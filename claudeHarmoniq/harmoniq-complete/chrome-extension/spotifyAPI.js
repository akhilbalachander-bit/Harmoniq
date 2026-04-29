// ============================================
// SPOTIFY API - Direct Playlist Creation
// Uses chrome.identity OAuth (Implicit Grant)
// Requires redirect URI in Spotify Developer Dashboard:
//   https://<extensionId>.chromiumapp.org/callback
// Get extension ID from chrome://extensions
// ============================================

class SmartSpotify {
    constructor() {
        this.clientId = '86bfab39244345f5acff8f58930a2638';
        this.accessToken = null;
        this.redirectUri = '';
    }

    async authenticate() {
        const stored = await chrome.storage.local.get(['spotify_token', 'spotify_token_expiry']);
        if (stored.spotify_token && stored.spotify_token_expiry > Date.now()) {
            this.accessToken = stored.spotify_token;
            return;
        }

        const extensionId = chrome.runtime.id;
        this.redirectUri = `https://appdnaibcgibemilkmilgjljejajkibl.chromiumapp.org/callback`;

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
                        'Spotify auth failed. Make sure ' +
                        `https://${extensionId}.chromiumapp.org/callback` +
                        ' is added as a redirect URI in your Spotify Developer Dashboard.'
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

    async searchTrack(title, artist) {
        const q = encodeURIComponent(`${title} ${artist}`);
        const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const data = await res.json();
        return data.tracks?.items[0]?.uri || null;
    }

    async createPlaylistPremium(name, description, songs, onProgress) {
        try {
            onProgress?.({ percent: 5, message: 'Authenticating with Spotify...', stats: `0/${songs.length}` });
            await this.authenticate();
            onProgress?.({ percent: 20, message: 'Authenticated!', stats: `0/${songs.length}` });

            const userId = await this.getUserId();
            onProgress?.({ percent: 25, message: 'Creating playlist...', stats: `0/${songs.length}` });

            const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, public: false })
            });
            const playlist = await createRes.json();
            if (!playlist.id) throw new Error('Playlist creation failed');
            onProgress?.({ percent: 35, message: 'Playlist created! Finding songs...', stats: `0/${songs.length}` });

            const uris = [];
            for (let i = 0; i < songs.length; i++) {
                const uri = await this.searchTrack(songs[i].title, songs[i].artist);
                if (uri) uris.push(uri);
                const pct = 35 + Math.round(((i + 1) / songs.length) * 50);
                onProgress?.({ percent: pct, message: 'Finding songs...', stats: `${uris.length}/${songs.length} found` });
            }

            if (uris.length > 0) {
                onProgress?.({ percent: 87, message: 'Adding songs to playlist...', stats: `${uris.length}/${songs.length}` });
                for (let i = 0; i < uris.length; i += 100) {
                    await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ uris: uris.slice(i, i + 100) })
                    });
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
