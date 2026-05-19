// ============================================
// CLOUD PLAYLIST STORAGE (Firebase)
// ============================================

class CloudStorage {
    async init() { await firebaseManager.init(); }

    async savePlaylist(name, songs, currentEmotions, targetEmotions, shuffled) {
        if (!authSystem.isSignedIn()) throw new Error('Must be signed in');
        await this.init();
        const user = authSystem.getCurrentUser();
        const playlistRef = firebaseManager.db.collection('playlists').doc();
        await playlistRef.set({
            id: playlistRef.id, userId: user.uid, name, songs,
            currentEmotions, targetEmotions, shuffled,
            songCount: songs.length,
            journey: `${currentEmotions.join('+')} → ${targetEmotions.join('+')}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Playlist saved to cloud:', playlistRef.id);
        return playlistRef.id;
    }

    async getUserPlaylists() {
        if (!authSystem.isSignedIn()) throw new Error('Must be signed in');
        await this.init();
        const user = authSystem.getCurrentUser();
        const snapshot = await firebaseManager.db.collection('playlists')
            .where('userId', '==', user.uid).get();
        return snapshot.docs
            .map(doc => ({
                id: doc.id, ...doc.data(),
                createdDate: doc.data().createdAt?.toDate().toLocaleDateString() || 'N/A',
                _ts: doc.data().createdAt?.toMillis() || 0
            }))
            .sort((a, b) => b._ts - a._ts);
    }

    async deletePlaylist(playlistId) {
        if (!authSystem.isSignedIn()) throw new Error('Must be signed in');
        await firebaseManager.db.collection('playlists').doc(playlistId).delete();
    }
}

const cloudStorage = new CloudStorage();
window.cloudStorage = cloudStorage;
