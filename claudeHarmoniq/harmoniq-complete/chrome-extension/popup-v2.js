// ============================================
// HARMONIQ v5 — MAIN APPLICATION LOGIC
// ============================================

// Genre chip -> array of genre keywords used in musicData.js
const GENRE_MAP = {
    'All':        null,
    'Pop':        ['pop', 'indie pop', 'synth-pop'],
    'Hip-Hop':    ['hip-hop', 'rap', 'trap', 'r&b'],
    'Rock':       ['rock', 'alternative', 'indie rock', 'metal'],
    'Electronic': ['electronic', 'edm', 'house', 'dance', 'ambient'],
    'R&B':        ['r&b', 'soul', 'neo-soul'],
    'Classical':  ['classical', 'piano', 'orchestral']
};

let currentEmotions = [];
let targetEmotions  = [];
let currentPlaylist = [];
let activeGenre     = 'All';
let resultGenre     = 'All';
let isSignUpMode    = false;
let preferences     = { liked: {}, disliked: {}, blocked: {} }; // keyed by "title|artist"

// ---- Utility ----
const $ = id => document.getElementById(id);
function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden'); }

function toast(msg, ms = 3000) {
    const el = $('notification');
    el.textContent = msg;
    show(el);
    clearTimeout(el._timer);
    el._timer = setTimeout(() => hide(el), ms);
}

// ---- Load preferences from storage ----
async function loadPrefs() {
    const data = await chrome.storage.local.get('harmoniq_prefs');
    if (data.harmoniq_prefs) preferences = data.harmoniq_prefs;
}
async function savePrefs() {
    await chrome.storage.local.set({ harmoniq_prefs: preferences });
}

// ---- Genre Chips (Step 1) ----
function buildGenreChips(containerId, onSelect) {
    const container = $(containerId);
    container.innerHTML = '';
    Object.keys(GENRE_MAP).forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'genre-chip' + (label === 'All' ? ' active' : '');
        btn.textContent = label;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            onSelect(label);
        });
        container.appendChild(btn);
    });
}

// ---- Emotion Grid ----
function buildEmotionGrid(containerId, selectionArray, maxSel = 3) {
    const container = $(containerId);
    container.innerHTML = '';
    for (const [key, data] of Object.entries(EMOTIONS)) {
        const btn = document.createElement('button');
        btn.className = 'emotion-btn';
        btn.dataset.key = key;
        btn.innerHTML = `<span class="emotion-emoji">${data.emoji}</span><span class="emotion-name">${data.label}</span>`;
        btn.addEventListener('click', () => {
            const idx = selectionArray.indexOf(key);
            if (idx > -1) {
                selectionArray.splice(idx, 1);
                btn.classList.remove('selected');
            } else if (selectionArray.length < maxSel) {
                selectionArray.push(key);
                btn.classList.add('selected');
            }
            updateStepButtons();
        });
        container.appendChild(btn);
    }
}

function updateStepButtons() {
    $('nextBtn').disabled = currentEmotions.length === 0;
    $('generateBtn').disabled = targetEmotions.length === 0;
}

// ---- Filter playlist by genre ----
function filterByGenre(playlist, genre) {
    if (!genre || genre === 'All') return playlist;
    const keywords = GENRE_MAP[genre];
    if (!keywords) return playlist;
    const filtered = playlist.filter(s => {
        if (!s.genre) return false;
        return keywords.some(k => s.genre.toLowerCase().includes(k.toLowerCase()));
    });
    return filtered.length >= 5 ? filtered : playlist;
}

// ---- Track key ----
function trackKey(song) { return `${song.title}|${song.artist}`; }

// ---- Render Track List ----
function renderTrackList(playlist) {
    const container = $('trackList');
    container.innerHTML = '';
    const filtered = filterByGenre(playlist, resultGenre);

    filtered.forEach((song, i) => {
        const key = trackKey(song);
        const liked    = !!preferences.liked[key];
        const disliked = !!preferences.disliked[key];
        const blocked  = !!preferences.blocked[key];

        if (blocked) return; // skip blocked songs

        const item = document.createElement('div');
        item.className = 'track-item' + (liked ? ' liked' : '') + (disliked ? ' disliked' : '');

        item.innerHTML = `
            <span class="track-num">${i + 1}</span>
            <div class="track-info">
                <div class="track-title">${song.title}</div>
                <div class="track-artist">${song.artist}</div>
            </div>
            <div class="track-actions">
                <button class="track-action ${liked ? 'active' : ''}" data-act="like" title="Like">&#128077;</button>
                <button class="track-action ${disliked ? 'active' : ''}" data-act="dislike" title="Dislike">&#128078;</button>
                <button class="track-action" data-act="block" title="Don't recommend">&#128683;</button>
            </div>`;

        item.querySelector('[data-act="like"]').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (liked) {
                delete preferences.liked[key];
            } else {
                preferences.liked[key] = true;
                delete preferences.disliked[key];
            }
            await savePrefs();
            renderTrackList(playlist);
        });

        item.querySelector('[data-act="dislike"]').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (disliked) {
                delete preferences.disliked[key];
            } else {
                preferences.disliked[key] = true;
                delete preferences.liked[key];
            }
            await savePrefs();
            renderTrackList(playlist);
        });

        item.querySelector('[data-act="block"]').addEventListener('click', async (e) => {
            e.stopPropagation();
            preferences.blocked[key] = true;
            await savePrefs();
            renderTrackList(playlist);
            toast('Song blocked — won\'t appear again');
        });

        // Click track to search on Spotify
        item.addEventListener('click', () => {
            chrome.tabs.create({ url: `https://open.spotify.com/search/${encodeURIComponent(song.spotifyQuery || `${song.title} ${song.artist}`)}` });
        });

        container.appendChild(item);
    });

    if (container.children.length === 0) {
        container.innerHTML = '<p class="empty-state">No tracks to show</p>';
    }
}

// ---- Init grids ----
buildGenreChips('genreChips', (g) => { activeGenre = g; });
buildEmotionGrid('currentEmotionGrid', currentEmotions);
buildEmotionGrid('targetEmotionGrid', targetEmotions);

// ---- Step navigation ----
$('nextBtn').addEventListener('click', () => {
    hide($('step1'));
    show($('step2'));
});

$('backBtn').addEventListener('click', () => {
    hide($('step2'));
    show($('step1'));
});

$('startOverBtn').addEventListener('click', () => {
    hide($('step3'));
    show($('step1'));
    currentEmotions.length = 0;
    targetEmotions.length  = 0;
    activeGenre = 'All';
    document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.genre-chip').forEach((c, i) => {
        c.classList.toggle('active', i === 0);
    });
    updateStepButtons();
    hide($('results'));
});

// ---- Generate ----
$('generateBtn').addEventListener('click', async () => {
    hide($('step2'));
    show($('step3'));
    show($('loading'));
    hide($('results'));
    hide($('spProgress'));

    await new Promise(r => setTimeout(r, 300));

    // Build playlist then filter
    const raw = buildJourneyPlaylist(currentEmotions, targetEmotions, false);
    currentPlaylist = filterByGenre(raw, activeGenre);
    if (currentPlaylist.length === 0) currentPlaylist = raw; // fallback

    // Journey bar with emotion icons
    const fromEmos = currentEmotions.map(e => `<span class="journey-emo">${EMOTIONS[e].emoji}</span>`).join('');
    const toEmos   = targetEmotions.map(e => `<span class="journey-emo">${EMOTIONS[e].emoji}</span>`).join('');
    $('journeyFrom').innerHTML = fromEmos;
    $('journeyTo').innerHTML   = toEmos;

    // Default playlist name
    const fromLabel = currentEmotions.map(e => EMOTIONS[e].label).join('+');
    const toLabel   = targetEmotions.map(e => EMOTIONS[e].label).join('+');
    $('playlistName').value = `${fromLabel} → ${toLabel}`;

    // Result genre chips
    resultGenre = 'All';
    buildGenreChips('resultGenreChips', (g) => {
        resultGenre = g;
        renderTrackList(currentPlaylist);
    });

    hide($('loading'));
    show($('results'));
    renderTrackList(currentPlaylist);
});

// ---- Save ----
$('saveBtn').addEventListener('click', async () => {
    const name = $('playlistName').value.trim();
    if (!name) { toast('Enter a playlist name first'); return; }
    try {
        await playlistStorage.save(name, currentPlaylist, currentEmotions, targetEmotions, false);
        toast('Saved!');
        if (authSystem.isSignedIn()) {
            try {
                await cloudStorage.savePlaylist(name, currentPlaylist, currentEmotions, targetEmotions, false);
                toast('Saved to cloud!');
            } catch { /* local save already done */ }
        }
    } catch { toast('Save failed'); }
});

// ---- Create in Spotify ----
$('createSpotifyBtn').addEventListener('click', async () => {
    if (!currentPlaylist.length) return;

    const name = $('playlistName').value.trim() || 'Harmoniq Journey';
    const desc = `Emotional journey playlist by Harmoniq`;
    const songs = currentPlaylist.map(s => ({ title: s.title, artist: s.artist }));

    hide($('results'));
    show($('spProgress'));
    $('spFill').style.width = '0%';
    $('spMsg').textContent = 'Starting...';
    $('spStats').textContent = `0/${songs.length}`;

    const result = await smartSpotify.createPlaylistPremium(name, desc, songs, (p) => {
        $('spFill').style.width = `${p.percent}%`;
        $('spMsg').textContent = p.message;
        $('spStats').textContent = p.stats;
    });

    hide($('spProgress'));
    show($('results'));

    if (result.success) {
        toast(`Created in Spotify! ${result.tracksAdded}/${result.tracksTotal} songs added`);
        if (result.playlistUrl) {
            chrome.tabs.create({ url: result.playlistUrl });
        }
    } else {
        // Fallback: copy to clipboard
        try {
            await smartSpotify.copyToClipboard(songs);
            toast('Could not create directly — song list copied to clipboard');
        } catch {
            toast(`Spotify error: ${result.error}`);
        }
    }
});

// ---- Bottom Nav ----
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const panel = btn.dataset.panel;
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        $('panel' + panel).classList.add('active');
        if (panel === 'Playlists') loadSavedPlaylists();
    });
});

// ---- Load Saved Playlists ----
async function loadSavedPlaylists() {
    const container = $('savedPlaylists');
    container.innerHTML = '';
    const playlists = await playlistStorage.getAll();
    if (!playlists.length) {
        container.innerHTML = '<p class="empty-state">No saved playlists yet</p>';
        return;
    }
    playlists.forEach(pl => {
        const card = document.createElement('div');
        card.className = 'pl-card';

        const header = document.createElement('div');
        header.className = 'pl-card-header';
        header.innerHTML = `
            <div>
                <div class="pl-name">${pl.name}</div>
                <div class="pl-meta">${pl.songCount || 0} songs &bull; ${pl.createdDate || ''}</div>
            </div>
            <button class="pl-toggle">Show</button>
            <button class="pl-del">Delete</button>`;

        const tracksDiv = document.createElement('div');
        tracksDiv.className = 'pl-tracks hidden';

        const toggleBtn = header.querySelector('.pl-toggle');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = tracksDiv.classList.contains('hidden');
            if (isHidden) {
                tracksDiv.innerHTML = '';
                (pl.songs || []).forEach((s, i) => {
                    const row = document.createElement('div');
                    row.className = 'pl-track-row';
                    row.textContent = `${i + 1}. ${s.title} — ${s.artist}`;
                    tracksDiv.appendChild(row);
                });
                show(tracksDiv);
                toggleBtn.textContent = 'Hide';
            } else {
                hide(tracksDiv);
                toggleBtn.textContent = 'Show';
            }
        });

        header.querySelector('.pl-del').addEventListener('click', async (e) => {
            e.stopPropagation();
            await playlistStorage.delete(pl.id);
            await loadSavedPlaylists();
            toast('Playlist deleted');
        });

        card.appendChild(header);
        card.appendChild(tracksDiv);
        container.appendChild(card);
    });
}

// ---- Help ----
$('fullHelpBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('instructions.html') });
});

// ---- Auth Modal ----
$('authBtn').addEventListener('click', () => {
    show($('authModal'));
});
$('closeAuthModal').addEventListener('click', () => {
    hide($('authModal'));
});
$('authModal').addEventListener('click', (e) => {
    if (e.target === $('authModal')) hide($('authModal'));
});

$('googleSignInBtn').addEventListener('click', async () => {
    toast('Opening sign-in tab...');
    hide($('authModal'));
    await authSystem.signInWithGoogle();
});

$('switchAuthMode').addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    $('emailAuthBtn').textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
    $('switchAuthMode').textContent = isSignUpMode ? 'Sign In' : 'Sign Up';
});

$('emailAuthBtn').addEventListener('click', async () => {
    const email = $('authEmail').value.trim();
    const pass  = $('authPassword').value;
    const errEl = $('authError');
    hide(errEl);
    if (!email || !pass) { show(errEl); errEl.textContent = 'Enter email and password'; return; }
    try {
        if (isSignUpMode) {
            await authSystem.signUpWithEmail(email, pass, email.split('@')[0]);
        } else {
            await authSystem.signInWithEmail(email, pass);
        }
        hide($('authModal'));
        toast('Signed in!');
    } catch (err) {
        show(errEl);
        const msgs = {
            'auth/wrong-password': 'Incorrect password.',
            'auth/user-not-found': 'No account with that email.',
            'auth/email-already-in-use': 'Email already in use.',
            'auth/weak-password': 'Password must be 6+ characters.',
            'auth/invalid-email': 'Invalid email address.'
        };
        errEl.textContent = msgs[err.code] || err.message;
    }
});

// ---- Auth State Listener ----
authSystem.onAuthStateChanged((user) => {
    if (user) {
        const initials = (user.displayName || user.email || 'U')[0].toUpperCase();
        $('authBtn').textContent = initials;
        $('authBtn').title = user.email;
        $('userEmail').textContent = user.email;
        $('userAvatar').textContent = initials;
        hide($('authSignedOut'));
        show($('authSignedIn'));
    } else {
        $('authBtn').textContent = 'Sign In';
        $('authBtn').title = '';
        show($('authSignedOut'));
        hide($('authSignedIn'));
    }
});

$('signOutBtn').addEventListener('click', async () => {
    await authSystem.signOut();
    hide($('authModal'));
    toast('Signed out');
});

// ---- Init ----
(async () => {
    await loadPrefs();
})();

window.showNotification = toast;
console.log('Harmoniq v5 loaded');
