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
            if (user) { console.log('✅ User signed in:', user.email); }
            else { console.log('ℹ️ User signed out'); }
        });
    }

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebaseManager.auth.signInWithPopup(provider);
            await this.saveUserProfile(result.user);
            return result.user;
        } catch (error) {
            console.error('❌ Google sign-in failed:', error);
            throw error;
        }
    }

    async signUpWithEmail(email, password, displayName) {
        try {
            const result = await firebaseManager.auth.createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName });
            await this.saveUserProfile(result.user);
            return result.user;
        } catch (error) {
            console.error('❌ Sign-up failed:', error);
            throw error;
        }
    }

    async signInWithEmail(email, password) {
        try {
            const result = await firebaseManager.auth.signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            console.error('❌ Sign-in failed:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await firebaseManager.auth.signOut();
            this.currentUser = null;
        } catch (error) {
            console.error('❌ Sign-out failed:', error);
            throw error;
        }
    }

    async saveUserProfile(user) {
        const userRef = firebaseManager.db.collection('users').doc(user.uid);
        await userRef.set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    onAuthStateChanged(callback) { this.authStateListeners.push(callback); }
    notifyListeners(user) { this.authStateListeners.forEach(cb => cb(user)); }
    isSignedIn() { return this.currentUser !== null; }
    getCurrentUser() { return this.currentUser; }
}

const authSystem = new AuthSystem();
window.authSystem = authSystem;
authSystem.init();
