// ============================================
// FIREBASE CONFIGURATION
// REPLACE the values below with YOUR Firebase config
// Get from: Firebase Console → Project Settings → Your Apps
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyBJoNEbVdX9N0ncY9c6wkyJjWcCEttIUqM",
  authDomain: "harmoniq-5d985.firebaseapp.com",
  projectId: "harmoniq-5d985",
  storageBucket: "harmoniq-5d985.firebasestorage.app",
  messagingSenderId: "520405889569",
  appId: "1:520405889569:web:6d314fc6b63535069ea960",
  measurementId: "G-THRY9KP1EE"
};

// Allowed origins for website and chrome extension
const ALLOWED_ORIGINS = [
    'https://akhilbalachander-bit.github.io',
    'chrome-extension://'
];

function isAllowedOrigin() {
    const origin = window.location.origin;
    return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

class FirebaseManager {
    constructor() {
        this.initialized = false;
        this.db = null;
        this.auth = null;
    }

    async init() {
        if (this.initialized) return;
        if (!isAllowedOrigin()) {
            console.error('❌ Firebase blocked: origin not whitelisted:', window.location.origin);
            return false;
        }
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.initialized = true;
            console.log('✅ Firebase initialized');
            return true;
        } catch (error) {
            console.error('❌ Firebase init failed:', error);
            return false;
        }
    }
}

const firebaseManager = new FirebaseManager();
window.firebaseManager = firebaseManager;
firebaseManager.init();
