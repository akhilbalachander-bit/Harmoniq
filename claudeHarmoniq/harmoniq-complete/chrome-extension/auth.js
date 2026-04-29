// Dedicated sign-in page — runs signInWithPopup in a full tab context
// (Chrome blocks new windows from extension popups but not from tabs)

const statusEl = document.getElementById('status');
const googleBtn = document.getElementById('googleBtn');

async function waitForFirebase() {
    let attempts = 0;
    while (!window.firebaseManager?.initialized && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
}

googleBtn.addEventListener('click', async () => {
    googleBtn.disabled = true;
    statusEl.textContent = 'Opening sign-in window...';
    statusEl.className = '';

    try {
        await waitForFirebase();
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebaseManager.auth.signInWithPopup(provider);
        const user = result.user;

        await firebaseManager.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        statusEl.textContent = 'Signed in! You can close this tab.';
        statusEl.className = 'success';
        setTimeout(() => window.close(), 2000);
    } catch (err) {
        googleBtn.disabled = false;
        const msgs = {
            'auth/popup-closed-by-user': 'Sign-in cancelled.',
            'auth/popup-blocked': 'Popup blocked — please allow popups for this page.',
            'auth/network-request-failed': 'Network error. Check your connection.'
        };
        statusEl.textContent = msgs[err.code] || `Error: ${err.message}`;
        statusEl.className = 'error';
    }
});
