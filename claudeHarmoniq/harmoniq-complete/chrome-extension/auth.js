// Dedicated sign-in page — uses chrome.identity.launchWebAuthFlow
// (avoids Firebase's signInWithPopup which fails from extension origins not in authorized domains)

const GOOGLE_CLIENT_ID = '520405889569-k0bnth8c66l2ovgkig6kgm0fnb341a3g.apps.googleusercontent.com';

const statusEl = document.getElementById('status');
const googleBtn = document.getElementById('googleBtn');

async function waitForFirebase() {
    let attempts = 0;
    while (!window.firebaseManager?.initialized && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    if (!window.firebaseManager?.initialized) {
        throw new Error('Firebase failed to initialize. Check that this extension origin is allowed.');
    }
}

// Log the redirect URI so it's easy to find in DevTools (chrome://extensions → Inspect views: background page or auth.html)
console.log('[Harmoniq] OAuth redirect URI:', chrome.identity.getRedirectURL());

googleBtn.addEventListener('click', async () => {
    googleBtn.disabled = true;
    statusEl.textContent = 'Opening Google sign-in...';
    statusEl.className = '';

    try {
        const redirectUrl = chrome.identity.getRedirectURL();
        console.log('[Harmoniq] Using redirect URI:', redirectUrl);
        const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('response_type', 'id_token');
        authUrl.searchParams.set('redirect_uri', redirectUrl);
        authUrl.searchParams.set('scope', 'openid email profile');
        authUrl.searchParams.set('nonce', nonce);
        authUrl.searchParams.set('prompt', 'select_account');

        const responseUrl = await new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
                { url: authUrl.toString(), interactive: true },
                (url) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (!url) {
                        reject(new Error('Sign-in was cancelled.'));
                    } else {
                        resolve(url);
                    }
                }
            );
        });

        const params = new URLSearchParams(new URL(responseUrl).hash.substring(1));
        const idToken = params.get('id_token');
        if (!idToken) throw new Error('No ID token in sign-in response.');

        await waitForFirebase();
        const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
        const result = await firebaseManager.auth.signInWithCredential(credential);
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
        let msg = err.message;
        if (err.message.includes('redirect_uri_mismatch')) {
            const uri = chrome.identity.getRedirectURL();
            msg = `OAuth redirect URI not registered. Add this to Google Cloud Console → OAuth client → Authorized redirect URIs: ${uri}`;
        } else if (/cancel|closed|denied/i.test(err.message)) {
            msg = 'Sign-in cancelled.';
        } else if (err.code === 'auth/network-request-failed') {
            msg = 'Network error. Check your connection.';
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-id-token') {
            msg = 'Invalid credentials received. Please try again.';
        }
        statusEl.textContent = msg;
        statusEl.className = 'error';
    }
});
