// ============================================
// SPOTIFY API - Direct Playlist Creation
// Uses chrome.identity OAuth (Implicit Grant)
// Requires redirect URI in Spotify Developer Dashboard:
//   https://<YOUR-EXTENSION-ID>.chromiumapp.org/callback
// Find your extension ID at chrome://extensions
// ============================================

class SmartSpotify {
    constructor() {
        this.clientId = '86bfab39244345f5acff8f58930a2638';
        this.accessToken = null;
    }

    get redirectUri() {
        return `https://${chrome.runtime.id}.chromiumapp.org/callback`;
    }

    async authenticate() {
        const stored = await chrome.storage.local.get(['spotify_token', 'spotify_token_expiry']);
        if (stored.spotify_token && stored.spotify_token_expiry > Date.now()) {
            this.accessToken = stored.spotify_token;
            return;
        }

        const scope = [
            'playlist-modify-public',
            'playlist-modify-private',
            'user-read-private'
        ].join('%20');

        const authUrl =
            `https://accounts.spotify.com/authorize` +
            `?client_id=${this.clientId}` +
            `&response_type=token` +
            `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
            `&scope=${scope}`;

        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (responseUrl) => {
                if (chrome.runtime.lastError || !responseUrl) {
                    return reject(new Error(
                        `Spotify auth failed. Add https://${chrome.runtime.id}.chromiumapp.org/callback` +
                        ' as a redirect URI in your Spotify Developer Dashboard.'
                    ));
                }
                const hash = new URL(responseUrl).hash.substring(1);
                const params = new URLSearchParams(hash);
                this.accessToken = params.get('access_token');
                const expiresIn = parseInt(params.get('expires_in')) || 3600;
                chrome.storage.local.set({
                    spotify_token: this.accessToken,
                    spotify_token_expiry: Date.now() + (expiresIn * 1000)
                });
                resolve();
            });
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
            const playlist = await createRes.json();
            if (!playlist.id) throw new Error('Playlist creation failed — check Spotify account permissions');
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
                    await new Promise(r => setTimeout(r, 200)); // small delay between batches
                }
            }

            if (uris.length > 0) {
                onProgress?.({ percent: 87, message: 'Adding songs to playlist...', stats: `${uris.length}/${songs.length}` });
                // Spotify max 100 URIs per request
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

    async copyToClipboard(songs) {
        const text = songs.map(s => `${s.artist} - ${s.title}`).join('\n');
        await navigator.clipboard.writeText(text);
    }
}

const smartSpotify = new SmartSpotify();
window.smartSpotify = smartSpotify;
