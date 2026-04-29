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
        // Opens auth.html as a full tab — signInWithPopup works there,
        // unlike in the extension popup where Chrome blocks new windows.
        return new Promise((resolve) => {
            chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') });
            // Auth state change will fire via shared Firebase IndexedDB persistence.
            const unsub = firebaseManager.auth.onAuthStateChanged((user) => {
                if (user) {
                    unsub();
                    resolve(user);
                }
            });
        });
    }

    async signUpWithEmail(email, password, displayName) {
        const result = await firebaseManager.auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName });
        await this.saveUserProfile(result.user);
        return result.user;
    }

    async signInWithEmail(email, password) {
        const result = await firebaseManager.auth.signInWithEmailAndPassword(email, password);
        return result.user;
    }

    async signOut() {
        await firebaseManager.auth.signOut();
        this.currentUser = null;
    }

    async saveUserProfile(user) {
        const ref = firebaseManager.db.collection('users').doc(user.uid);
        await ref.set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    onAuthStateChanged(cb) { this.authStateListeners.push(cb); }
    notifyListeners(user) { this.authStateListeners.forEach(cb => cb(user)); }
    isSignedIn() { return this.currentUser !== null; }
    getCurrentUser() { return this.currentUser; }
}

const authSystem = new AuthSystem();
window.authSystem = authSystem;
authSystem.init();
