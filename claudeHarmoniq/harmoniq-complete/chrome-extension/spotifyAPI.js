// ============================================
// SPOTIFY API - Direct Playlist Creation
// Uses chrome.identity.launchWebAuthFlow for OAuth.
// IMPORTANT: Add https://<extensionId>.chromiumapp.org/callback
// to your Spotify app's Redirect URIs in the Developer Dashboard.
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
        this.redirectUri = `https://${extensionId}.chromiumapp.org/callback`;
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=token&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=playlist-modify-public%20playlist-modify-private%20user-read-private`;
        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (responseUrl) => {
                if (chrome.runtime.lastError || !responseUrl) {
                    return reject(new Error(chrome.runtime.lastError?.message || 'Auth failed. Make sure your redirect URI is registered in the Spotify Developer Dashboard.'));
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
        const data = await res.json();
        if (!data.id) throw new Error('Could not get Spotify user ID');
        return data.id;
    }

    async searchTrack(title, artist) {
        const query = encodeURIComponent(`track:${title} artist:${artist}`);
        const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const data = await res.json();
        return data.tracks?.items[0]?.uri || null;
    }

    async createPlaylistPremium(name, description, songs, onProgress) {
        try {
            if (onProgress) onProgress({ percent: 5, message: 'Authenticating with Spotify...' });
            await this.authenticate();
            if (onProgress) onProgress({ percent: 20, message: 'Authenticated!' });

            const userId = await this.getUserId();
            if (onProgress) onProgress({ percent: 30, message: 'Creating playlist...' });

            const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, public: false })
            });
            const playlist = await createRes.json();
            if (!playlist.id) throw new Error('Failed to create playlist');
            if (onProgress) onProgress({ percent: 40, message: 'Finding songs...' });

            const trackUris = [];
            const inc = 45 / songs.length;
            for (let i = 0; i < songs.length; i++) {
                const uri = await this.searchTrack(songs[i].title, songs[i].artist);
                if (uri) trackUris.push(uri);
                if (onProgress) onProgress({ percent: Math.round(40 + (i + 1) * inc), message: `Finding songs... ${trackUris.length}/${songs.length}` });
            }

            if (onProgress) onProgress({ percent: 88, message: 'Adding to playlist...' });
            if (trackUris.length > 0) {
                await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uris: trackUris })
                });
            }
            if (onProgress) onProgress({ percent: 100, message: 'Done!' });
            return { success: true, playlistUrl: `https://open.spotify.com/playlist/${playlist.id}`, tracksAdded: trackUris.length, tracksTotal: songs.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

const smartSpotify = new SmartSpotify();
window.smartSpotify = smartSpotify;
