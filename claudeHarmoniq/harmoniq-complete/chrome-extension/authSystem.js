// ============================================
// USER AUTHENTICATION SYSTEM
// ============================================

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
    }

    async init() {
        await firebaseManager.init();
        firebaseManager.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.notifyListeners(user);
        });
    }

    async signInWithGoogle() {
        // Chrome extension popups block signInWithPopup.
        // Open a dedicated tab — Firebase shares auth state via IndexedDB across all extension pages.
        await chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') });
    }

    async signUpWithEmail(email, password, displayName) {
        try {
            const result = await firebaseManager.auth.createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName });
            await this.saveUserProfile(result.user);
            return result.user;
        } catch (error) { throw error; }
    }

    async signInWithEmail(email, password) {
        try {
            const result = await firebaseManager.auth.signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) { throw error; }
    }

    async signOut() {
        try {
            await firebaseManager.auth.signOut();
            this.currentUser = null;
        } catch (error) { throw error; }
    }

    async saveUserProfile(user) {
        try {
            await firebaseManager.db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL || null,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {}
    }

    onAuthStateChanged(callback) { this.authStateListeners.push(callback); }
    notifyListeners(user) { this.authStateListeners.forEach(cb => cb(user)); }
    isSignedIn() { return this.currentUser !== null; }
    getCurrentUser() { return this.currentUser; }
}

const authSystem = new AuthSystem();
window.authSystem = authSystem;
authSystem.init();
