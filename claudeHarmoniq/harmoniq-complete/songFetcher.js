// ============================================
// AUTOMATED SONG FETCHER - Spotify API
// REPLACE clientId/clientSecret with YOUR Spotify credentials
// ============================================

class AutomatedSongFetcher {
    constructor() {
        this.clientId = '86bfab39244345f5acff8f58930a2638';
        this.clientSecret = 'e50a758bc4eb4b9899609649a52df0b1';
        this.accessToken = null;

        this.emotionQueries = {
            happy: ['happy songs', 'feel good hits', 'upbeat pop'],
            sad: ['sad songs', 'heartbreak', 'emotional ballads'],
            energetic: ['workout music', 'pump up songs', 'high energy'],
            calm: ['relaxing music', 'chill vibes', 'peaceful songs'],
            anxious: ['calming music', 'stress relief', 'meditation music'],
            angry: ['rage songs', 'aggressive rock', 'metal workout'],
            romantic: ['love songs', 'romantic ballads', 'date night music'],
            nostalgic: ['throwback hits', '90s classics', '2000s nostalgia'],
            tired: ['sleep music', 'bedtime songs', 'lullabies'],
            motivated: ['motivational music', 'inspirational songs', 'pump up'],
            lonely: ['songs about loneliness', 'alone time music'],
            confident: ['confidence boosters', 'empowerment anthems'],
            stressed: ['stress relief music', 'calming playlists'],
            excited: ['party music', 'celebration songs', 'hype songs'],
            hopeful: ['hopeful songs', 'uplifting music', 'positive vibes']
        };
    }

    async authenticate() {
        const stored = await chrome.storage.local.get(['spotify_fetcher_token', 'token_expiry']);
        if (stored.spotify_fetcher_token && stored.token_expiry > Date.now()) {
            this.accessToken = stored.spotify_fetcher_token;
            return;
        }
        const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'grant_type=client_credentials'
        });
        if (!response.ok) throw new Error('Authentication failed');
        const data = await response.json();
        this.accessToken = data.access_token;
        await chrome.storage.local.set({ spotify_fetcher_token: this.accessToken, token_expiry: Date.now() + (data.expires_in * 1000) });
    }

    async getCuratedPlaylist(emotion, limit = 40) {
        await this.authenticate();
        const query = this.emotionQueries[emotion][0];
        const plRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=5`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const plData = await plRes.json();
        if (!plData.playlists?.items?.length) return [];
        const playlistId = plData.playlists.items[0].id;
        const trRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        const trData = await trRes.json();
        return trData.items.filter(i => i.track?.name && i.track?.artists?.[0]).map(i => ({
            title: i.track.name, artist: i.track.artists[0].name,
            spotifyQuery: `${i.track.name} ${i.track.artists[0].name}`, reason: "Auto-curated"
        }));
    }

    async saveDatabaseToStorage(database) {
        await chrome.storage.local.set({ automated_music_database: database, database_last_updated: Date.now() });
    }

    exportToJavaScript(database) {
        let js = '// Auto-generated music database\nconst musicDatabase = {\n';
        for (const [emotion, tracks] of Object.entries(database)) {
            js += `    ${emotion}: [\n`;
            for (const t of tracks) {
                js += `        { title: "${this.esc(t.title)}", artist: "${this.esc(t.artist)}", spotifyQuery: "${this.esc(t.spotifyQuery)}", reason: "${t.reason}" },\n`;
            }
            js += '    ],\n';
        }
        js += '};\nwindow.musicDatabase = musicDatabase;\n';
        return js;
    }

    downloadAsFile(database) {
        const js = this.exportToJavaScript(database);
        const blob = new Blob([js], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'musicData.js';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    esc(str) { return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
    delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

const songFetcher = new AutomatedSongFetcher();
window.songFetcher = songFetcher;
