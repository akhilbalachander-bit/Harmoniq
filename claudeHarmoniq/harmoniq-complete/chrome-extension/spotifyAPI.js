// ============================================
// SPOTIFY API - Playlist Creation
// REPLACE clientId with YOUR Spotify Client ID
// Get from: https://developer.spotify.com/dashboard
// ============================================

class SmartSpotify {
    constructor() {
        this.clientId = 'YOUR_SPOTIFY_CLIENT_ID';
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
                    return reject(new Error('Auth failed'));
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
        return data.id;
    }

    async searchTrack(title, artist) {
        const query = encodeURIComponent(`${title} ${artist}`);
        const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const data = await res.json();
        return data.tracks?.items[0]?.uri || null;
    }

    async createPlaylistPremium(name, description, songs, onProgress) {
        try {
            if (onProgress) onProgress({ step: 1, status: 'active', percent: 5, message: 'Authenticating...', stats: `0/${songs.length} songs` });
            await this.authenticate();
            if (onProgress) onProgress({ step: 1, status: 'complete', percent: 25, message: 'Authenticated!', stats: `0/${songs.length} songs` });

            if (onProgress) onProgress({ step: 2, status: 'active', percent: 25, message: 'Creating playlist...', stats: `0/${songs.length} songs` });
            const userId = await this.getUserId();
            const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, public: false })
            });
            const playlist = await createRes.json();
            if (onProgress) onProgress({ step: 2, status: 'complete', percent: 35, message: 'Playlist created!', stats: `0/${songs.length} songs` });

            if (onProgress) onProgress({ step: 3, status: 'active', percent: 35, message: 'Finding songs...', stats: `0/${songs.length} songs` });
            const trackUris = [];
            const inc = 50 / songs.length;
            for (let i = 0; i < songs.length; i++) {
                const uri = await this.searchTrack(songs[i].title, songs[i].artist);
                if (uri) trackUris.push(uri);
                if (onProgress) onProgress({ step: 3, status: 'active', percent: 35 + ((i + 1) * inc), message: 'Finding songs...', stats: `${trackUris.length}/${songs.length} found` });
            }
            if (onProgress) onProgress({ step: 3, status: 'complete', percent: 85, message: `Found ${trackUris.length} songs!`, stats: `${trackUris.length}/${songs.length} found` });

            if (onProgress) onProgress({ step: 4, status: 'active', percent: 85, message: 'Adding to playlist...', stats: `${trackUris.length} songs` });
            if (trackUris.length > 0) {
                await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uris: trackUris })
                });
            }
            if (onProgress) onProgress({ step: 4, status: 'complete', percent: 100, message: 'Done!', stats: `${trackUris.length}/${songs.length} added` });

            return { success: true, playlistUrl: `https://open.spotify.com/playlist/${playlist.id}`, tracksAdded: trackUris.length, tracksTotal: songs.length };
        } catch (error) {
            console.error('❌ Premium failed:', error);
            return { success: false, error: error.message };
        }
    }

    async createPlaylistFree(songs) {
        const songList = songs.map(s => `${s.artist} - ${s.title}`).join('\n');
        await navigator.clipboard.writeText(songList);
        window.open('https://www.tunemymusic.com/transfer', '_blank');
        return { success: true, method: 'free', message: 'Songs copied! Paste in TuneMyMusic.' };
    }
}

const smartSpotify = new SmartSpotify();
window.smartSpotify = smartSpotify;
