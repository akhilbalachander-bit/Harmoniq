// ============================================
// SPOTIFY API - Direct Playlist Creation
// Uses chrome.identity OAuth (Authorization Code + PKCE)
// Requires redirect URI in Spotify Developer Dashboard:
//   https://<YOUR-EXTENSION-ID>.chromiumapp.org/callback
// Find your extension ID at chrome://extensions
// ============================================

// Bump this string whenever the required scopes change to force all users to re-authorize.
const SPOTIFY_SCOPE = 'playlist-modify-public playlist-modify-private user-read-private';
const SPOTIFY_SCOPE_KEY = 'v2-playlist';

class SmartSpotify {
    constructor() {
        this.clientId = '86bfab39244345f5acff8f58930a2638';
        this.accessToken = null;
    }

    get redirectUri() {
        return `https://${chrome.runtime.id}.chromiumapp.org/callback`;
    }

    // Load a cached token from storage without prompting the user.
    // Returns true if a valid token was found (or was refreshed).
    async loadCachedToken() {
        const stored = await chrome.storage.local.get(['spotify_token', 'spotify_token_expiry', 'spotify_refresh_token', 'spotify_scope_key']);
        if (stored.spotify_scope_key !== SPOTIFY_SCOPE_KEY) return false;
        if (stored.spotify_token && stored.spotify_token_expiry > Date.now()) {
            this.accessToken = stored.spotify_token;
            return true;
        }
        if (stored.spotify_refresh_token) {
            try {
                await this._refreshToken(stored.spotify_refresh_token);
                return true;
            } catch { /* fall through */ }
        }
        return false;
    }

    async authenticate() {
        const stored = await chrome.storage.local.get(['spotify_token', 'spotify_token_expiry', 'spotify_refresh_token', 'spotify_scope_key']);

        // If the stored token was granted with a different scope set, invalidate it.
        if (stored.spotify_scope_key !== SPOTIFY_SCOPE_KEY) {
            await chrome.storage.local.remove(['spotify_token', 'spotify_token_expiry', 'spotify_refresh_token', 'spotify_scope_key']);
        } else {
            if (stored.spotify_token && stored.spotify_token_expiry > Date.now()) {
                this.accessToken = stored.spotify_token;
                return;
            }

            if (stored.spotify_refresh_token) {
                try {
                    await this._refreshToken(stored.spotify_refresh_token);
                    return;
                } catch { /* fall through to full auth */ }
            }
        }

        // PKCE flow
        const codeVerifier = this._generateCodeVerifier();
        const codeChallenge = await this._generateCodeChallenge(codeVerifier);

        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.set('client_id', this.clientId);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('redirect_uri', this.redirectUri);
        authUrl.searchParams.set('scope', SPOTIFY_SCOPE);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('code_challenge', codeChallenge);

        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow({ url: authUrl.toString(), interactive: true }, async (responseUrl) => {
                if (chrome.runtime.lastError || !responseUrl) {
                    return reject(new Error(
                        `Spotify auth failed. Make sure ${this.redirectUri} is added as a redirect URI in your Spotify Developer Dashboard.`
                    ));
                }
                const url = new URL(responseUrl);
                const code = url.searchParams.get('code');
                const error = url.searchParams.get('error');
                if (error || !code) {
                    return reject(new Error(`Spotify auth denied: ${error || 'no code returned'}`));
                }
                try {
                    await this._exchangeCode(code, codeVerifier);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    _generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    async _generateCodeChallenge(verifier) {
        const data = new TextEncoder().encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    async _exchangeCode(code, codeVerifier) {
        const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: this.redirectUri,
                client_id: this.clientId,
                code_verifier: codeVerifier
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Spotify token exchange failed: ${err.error_description || res.status}`);
        }
        const data = await res.json();
        this.accessToken = data.access_token;
        await chrome.storage.local.set({
            spotify_token: data.access_token,
            spotify_token_expiry: Date.now() + (data.expires_in * 1000),
            spotify_refresh_token: data.refresh_token,
            spotify_scope_key: SPOTIFY_SCOPE_KEY
        });
    }

    async _refreshToken(refreshToken) {
        const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: this.clientId
            })
        });
        if (!res.ok) throw new Error('Token refresh failed');
        const data = await res.json();
        this.accessToken = data.access_token;
        await chrome.storage.local.set({
            spotify_token: data.access_token,
            spotify_token_expiry: Date.now() + (data.expires_in * 1000),
            ...(data.refresh_token ? { spotify_refresh_token: data.refresh_token } : {})
        });
    }

    async getUserId() {
        const res = await fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        if (!res.ok) throw new Error('Failed to get Spotify user profile');
        const data = await res.json();
        return data.id;
    }

    // Retry wrapper: handles 429 rate-limit and transient 5xx errors
    async fetchWithRetry(url, options, retries = 3) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            const res = await fetch(url, options);
            if (res.status === 429) {
                const retryAfter = parseInt(res.headers.get('Retry-After') || '2') * 1000;
                await new Promise(r => setTimeout(r, retryAfter));
                continue;
            }
            if (res.status >= 500 && attempt < retries) {
                await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
                continue;
            }
            return res;
        }
        throw new Error('Max retries exceeded');
    }

    async searchTrack(title, artist, retries = 2) {
        const q = encodeURIComponent(`track:${title} artist:${artist}`);
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const res = await this.fetchWithRetry(
                    `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
                    { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
                );
                if (!res.ok) return null;
                const data = await res.json();
                const uri = data.tracks?.items[0]?.uri;
                if (uri) return uri;
                // Fallback: broader search without field filters
                if (attempt === 0) {
                    const q2 = encodeURIComponent(`${title} ${artist}`);
                    const res2 = await this.fetchWithRetry(
                        `https://api.spotify.com/v1/search?q=${q2}&type=track&limit=1`,
                        { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
                    );
                    if (res2.ok) {
                        const data2 = await res2.json();
                        return data2.tracks?.items[0]?.uri || null;
                    }
                }
                return null;
            } catch {
                if (attempt === retries) return null;
                await new Promise(r => setTimeout(r, (attempt + 1) * 500));
            }
        }
        return null;
    }

    // Parses a playlist-create response and throws with actionable messages on 401/403.
    async _parsePlaylistCreate(res) {
        if (res.status === 401 || res.status === 403) {
            // Wipe the cached token so the next attempt forces a fresh auth with correct scopes.
            this.accessToken = null;
            await chrome.storage.local.remove(['spotify_token', 'spotify_token_expiry', 'spotify_refresh_token']);
            throw new Error(
                res.status === 403
                    ? 'Spotify rejected playlist creation (missing scope). Please reconnect Spotify via the account modal to grant playlist access.'
                    : 'Spotify session expired. Please reconnect Spotify via the account modal.'
            );
        }
        const data = await res.json();
        if (!data.id) {
            const msg = data?.error?.message || `HTTP ${res.status}`;
            throw new Error(`Playlist creation failed: ${msg}`);
        }
        return data;
    }

    async createPlaylistPremium(name, description, songs, onProgress) {
        try {
            onProgress?.({ percent: 5, message: 'Authenticating with Spotify...', stats: `0/${songs.length}` });
            await this.authenticate();
            onProgress?.({ percent: 20, message: 'Authenticated!', stats: `0/${songs.length}` });

            const userId = await this.getUserId();
            onProgress?.({ percent: 25, message: 'Creating playlist...', stats: `0/${songs.length}` });

            const createRes = await this.fetchWithRetry(
                `https://api.spotify.com/v1/users/${userId}/playlists`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, description, public: false })
                }
            );
            const playlist = await this._parsePlaylistCreate(createRes);
            onProgress?.({ percent: 35, message: 'Playlist created! Finding songs...', stats: `0/${songs.length}` });

            // Search songs in batches of 5 (to avoid hammering the API)
            const uris = [];
            const BATCH = 5;
            for (let i = 0; i < songs.length; i += BATCH) {
                const batch = songs.slice(i, i + BATCH);
                const results = await Promise.all(
                    batch.map(s => this.searchTrack(s.title, s.artist))
                );
                results.forEach(uri => { if (uri) uris.push(uri); });
                const done = Math.min(i + BATCH, songs.length);
                const pct = 35 + Math.round((done / songs.length) * 50);
                onProgress?.({ percent: pct, message: 'Finding songs...', stats: `${uris.length}/${songs.length} found` });
                if (i + BATCH < songs.length) {
                    await new Promise(r => setTimeout(r, 200));
                }
            }

            if (uris.length > 0) {
                onProgress?.({ percent: 87, message: 'Adding songs to playlist...', stats: `${uris.length}/${songs.length}` });
                for (let i = 0; i < uris.length; i += 100) {
                    await this.fetchWithRetry(
                        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${this.accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ uris: uris.slice(i, i + 100) })
                        }
                    );
                }
            }

            onProgress?.({ percent: 100, message: 'Done!', stats: `${uris.length}/${songs.length} added` });
            return {
                success: true,
                playlistUrl: `https://open.spotify.com/playlist/${playlist.id}`,
                tracksAdded: uris.length,
                tracksTotal: songs.length
            };
        } catch (err) {
            console.error('Spotify create failed:', err);
            return { success: false, error: err.message };
        }
    }

    // Fast path: songs already have Spotify URIs (from Recommendations API).
    async createPlaylistFromUris(name, description, songs, onProgress) {
        try {
            onProgress?.({ percent: 10, message: 'Authenticating with Spotify...', stats: `0/${songs.length}` });
            await this.authenticate();

            const userId = await this.getUserId();
            onProgress?.({ percent: 30, message: 'Creating playlist...', stats: `0/${songs.length}` });

            const createRes = await this.fetchWithRetry(
                `https://api.spotify.com/v1/users/${userId}/playlists`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, description, public: false })
                }
            );
            const playlist = await this._parsePlaylistCreate(createRes);

            const uris = songs.map(s => s.uri).filter(Boolean);
            onProgress?.({ percent: 70, message: 'Adding songs...', stats: `${uris.length}/${songs.length}` });

            for (let i = 0; i < uris.length; i += 100) {
                await this.fetchWithRetry(
                    `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ uris: uris.slice(i, i + 100) })
                    }
                );
            }

            onProgress?.({ percent: 100, message: 'Done!', stats: `${uris.length}/${songs.length} added` });
            return {
                success: true,
                playlistUrl: `https://open.spotify.com/playlist/${playlist.id}`,
                tracksAdded: uris.length,
                tracksTotal: songs.length
            };
        } catch (err) {
            console.error('Spotify createFromUris failed:', err);
            return { success: false, error: err.message };
        }
    }

    async copyToClipboard(songs) {
        const text = songs.map(s => `${s.artist} - ${s.title}`).join('\n');
        await navigator.clipboard.writeText(text);
    }
}

const smartSpotify = new SmartSpotify();
window.smartSpotify = smartSpotify;
