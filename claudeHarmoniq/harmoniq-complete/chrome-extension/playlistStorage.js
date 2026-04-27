// ============================================
// LOCAL PLAYLIST STORAGE (Chrome Storage API)
// ============================================

class PlaylistStorageV2 {
    constructor() {
        this.storageKey = 'harmoniq_playlists_v2';
        this.ready = false;
        this.playlists = [];
    }

    async init() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            this.playlists = result[this.storageKey] || [];
            this.ready = true;
            return true;
        } catch (error) {
            console.error('❌ Storage init failed:', error);
            this.ready = false;
            return false;
        }
    }

    async save(name, songs, currentEmotions, targetEmotions, shuffled = false) {
        if (!this.ready) await this.init();
        const playlist = {
            id: Date.now(), name: name.trim(), songs, currentEmotions, targetEmotions,
            shuffled, songCount: songs.length,
            journey: `${currentEmotions.join('+')} → ${targetEmotions.join('+')}`,
            created: new Date().toISOString(),
            createdDate: new Date().toLocaleDateString()
        };
        this.playlists.unshift(playlist);
        await chrome.storage.local.set({ [this.storageKey]: this.playlists });
        return playlist.id;
    }

    async getAll() {
        if (!this.ready) await this.init();
        return this.playlists;
    }

    async deletePlaylist(id) {
        this.playlists = this.playlists.filter(p => p.id !== id);
        await chrome.storage.local.set({ [this.storageKey]: this.playlists });
    }
}

const playlistStorage = new PlaylistStorageV2();
playlistStorage.init();
window.playlistStorage = playlistStorage;
