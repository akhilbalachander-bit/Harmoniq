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

let currentEmotions  = [];
let targetEmotions   = [];
let currentPlaylist  = [];
let activeGenre      = 'All';
let resultGenre      = 'All';
let preferences      = { liked: {}, disliked: {}, blocked: {} };
let playlistFromSpotify = false; // true when current playlist came from Spotify Recommendations

// ---- Audio player state ----
let activeAudio     = null;
let activeAudioKey  = null;

function stopAudio() {
    if (activeAudio) {
        activeAudio.pause();
        activeAudio.src = '';
        activeAudio = null;
    }
    activeAudioKey = null;
    const bar = $('nowPlayingBar');
    if (bar) hide(bar);
    document.querySelectorAll('.track-play.playing').forEach(b => {
        b.textContent = '▶';
        b.classList.remove('playing');
    });
}

function playPreview(previewUrl, key, title, artist) {
    if (activeAudioKey === key) { stopAudio(); return; }
    stopAudio();
    activeAudio = new Audio(previewUrl);
    activeAudioKey = key;
    activeAudio.volume = 0.7;
    activeAudio.play().catch(() => {});
    activeAudio.addEventListener('ended', stopAudio);

    // Update play button
    const btn = document.querySelector(`.track-play[data-key="${CSS.escape(key)}"]`);
    if (btn) { btn.textContent = '⏸'; btn.classList.add('playing'); }

    // Now-playing bar
    const bar = $('nowPlayingBar');
    if (bar) {
        $('nowPlayingTitle').textContent = `${title} — ${artist}`;
        show(bar);
    }
}

// ---- Utility ----
const $ = id => document.getElementById(id);
function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden'); }

// ---- Global Spotify progress helpers ----
function spGlobalShow(p) {
    const modal = $('spGlobalModal');
    if (modal) show(modal);
    if (p) {
        $('spGlobalFill').style.width = `${p.percent}%`;
        $('spGlobalMsg').textContent   = p.message;
        $('spGlobalStats').textContent = p.stats || '';
    }
}
function spGlobalHide() {
    const modal = $('spGlobalModal');
    if (modal) hide(modal);
}

async function runSpotifyCreate(name, desc, playlist, isFromSpotify) {
    spGlobalShow({ percent: 0, message: 'Connecting to Spotify...', stats: `0/${playlist.length}` });
    let result;
    if (isFromSpotify && playlist.every(s => s.uri)) {
        result = await smartSpotify.createPlaylistFromUris(name, desc, playlist, (p) => spGlobalShow(p));
    } else {
        const songs = playlist.map(s => ({ title: s.title, artist: s.artist }));
        result = await smartSpotify.createPlaylistPremium(name, desc, songs, (p) => spGlobalShow(p));
    }
    if (!result.success) {
        spGlobalShow({ percent: 0, message: '❌ ' + (result.error || 'Spotify error'), stats: '' });
        await new Promise(r => setTimeout(r, 1800));
    }
    spGlobalHide();
    return result;
}

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
        const key      = trackKey(song);
        const liked    = !!preferences.liked[key];
        const disliked = !!preferences.disliked[key];
        const blocked  = !!preferences.blocked[key];
        if (blocked) return;

        const item = document.createElement('div');
        item.className = 'track-item' + (liked ? ' liked' : '') + (disliked ? ' disliked' : '');

        const artHtml = song.albumArt
            ? `<img class="track-art" src="${song.albumArt}" alt="" loading="lazy">`
            : `<span class="track-num">${i + 1}</span>`;

        const playHtml = song.previewUrl
            ? `<button class="track-play track-action" data-key="${key}" title="Preview">▶</button>`
            : '';

        item.innerHTML = `
            ${artHtml}
            <div class="track-info">
                <div class="track-title">${song.title}</div>
                <div class="track-artist">${song.artist}</div>
            </div>
            <div class="track-actions">
                ${playHtml}
                <button class="track-action ${liked ? 'active' : ''}" data-act="like" title="Like">👍</button>
                <button class="track-action ${disliked ? 'active' : ''}" data-act="dislike" title="Dislike">👎</button>
                <button class="track-action" data-act="block" title="Don't recommend">🚫</button>
            </div>`;

        // Preview play button
        if (song.previewUrl) {
            item.querySelector('.track-play').addEventListener('click', (e) => {
                e.stopPropagation();
                playPreview(song.previewUrl, key, song.title, song.artist);
            });
        }

        item.querySelector('[data-act="like"]').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (liked) { delete preferences.liked[key]; }
            else { preferences.liked[key] = true; delete preferences.disliked[key]; }
            await savePrefs();
            renderTrackList(playlist);
        });

        item.querySelector('[data-act="dislike"]').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (disliked) { delete preferences.disliked[key]; }
            else { preferences.disliked[key] = true; delete preferences.liked[key]; }
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

        // Click track body → open in Spotify
        item.addEventListener('click', (e) => {
            if (e.target.closest('.track-actions')) return;
            const url = song.spotifyUrl
                || `https://open.spotify.com/search/${encodeURIComponent(song.spotifyQuery || `${song.title} ${song.artist}`)}`;
            chrome.tabs.create({ url });
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
    stopAudio();
    hide($('step3'));
    show($('step1'));
    currentEmotions.length = 0;
    targetEmotions.length  = 0;
    activeGenre = 'All';
    playlistFromSpotify = false;
    document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.genre-chip').forEach((c, i) => {
        c.classList.toggle('active', i === 0);
    });
    updateStepButtons();
    hide($('results'));
});

// ---- Spotify connect banner ----
function updateSpotifyBanner() {
    const banner = $('spotifyConnectBanner');
    if (!banner) return;
    const hasToken = smartSpotify.accessToken !== null;
    hasToken ? hide(banner) : show(banner);
}

// ---- Spotify modal status ----
function updateSpotifyModalStatus() {
    const hasToken = !!smartSpotify.accessToken;

    // Signed-in panel
    const connected    = $('spotifyModalConnected');
    const disconnected = $('spotifyModalDisconnected');
    if (connected)    hasToken ? show(connected)    : hide(connected);
    if (disconnected) hasToken ? hide(disconnected) : show(disconnected);

    // Signed-out panel
    const connectedOut    = $('spotifyConnectedSignedOut');
    const disconnectedOut = $('spotifyDisconnectedSignedOut');
    if (connectedOut)    hasToken ? show(connectedOut)    : hide(connectedOut);
    if (disconnectedOut) hasToken ? hide(disconnectedOut) : show(disconnectedOut);
}

async function connectSpotify() {
    toast('Connecting to Spotify...');
    try {
        await smartSpotify.authenticate();
        toast('Spotify connected! Songs will now come live from Spotify.');
        updateSpotifyModalStatus();
        updateSpotifyBanner();
    } catch (err) {
        console.error('Spotify connect error:', err);
        const msg = err?.message || '';
        if (msg.includes('redirect') || msg.includes('INVALID_CLIENT') || msg.includes('redirect_uri')) {
            toast('Spotify: redirect URI not registered. Open the setup guide in the modal.', 5000);
        } else if (msg.includes('cancel') || msg.includes('closed') || msg.includes('user_denied') || msg.includes('access_denied')) {
            toast('Spotify sign-in cancelled.');
        } else {
            toast(`Spotify error: ${msg || 'auth failed. Check setup guide.'}`, 5000);
        }
    }
}

async function disconnectSpotify() {
    await chrome.storage.local.remove(['spotify_token', 'spotify_token_expiry', 'spotify_refresh_token']);
    smartSpotify.accessToken = null;
    updateSpotifyModalStatus();
    updateSpotifyBanner();
    toast('Spotify disconnected');
}

// ---- Generate ----
$('generateBtn').addEventListener('click', async () => {
    hide($('step2'));
    show($('step3'));
    show($('loading'));
    hide($('results'));
    stopAudio();

    const loadMsg = $('loadingMsg');

    // Load cached Spotify token silently (no auth popup at this stage)
    await smartSpotify.loadCachedToken().catch(() => {});

    const token = smartSpotify.accessToken;

    // Try Spotify Recommendations first
    let spotifyPlaylist = null;
    if (token) {
        if (loadMsg) loadMsg.textContent = 'Fetching songs for your current mood...';
        spotifyPlaylist = await spotifyRec.buildJourney(
            currentEmotions, targetEmotions, token,
            (msg) => { if (loadMsg) loadMsg.textContent = msg; }
        );
    }

    if (spotifyPlaylist && spotifyPlaylist.length > 0) {
        currentPlaylist = spotifyPlaylist;
        playlistFromSpotify = true;
    } else {
        // Fallback to local musicData.js
        if (loadMsg) loadMsg.textContent = 'Building your journey...';
        playlistFromSpotify = false;
        const raw = buildJourneyPlaylist(currentEmotions, targetEmotions, false);
        currentPlaylist = filterByGenre(raw, activeGenre);
        if (currentPlaylist.length === 0) currentPlaylist = raw;
    }

    // Journey bar
    const fromEmos = currentEmotions.map(e => `<span class="journey-emo">${EMOTIONS[e].emoji}</span>`).join('');
    const toEmos   = targetEmotions.map(e => `<span class="journey-emo">${EMOTIONS[e].emoji}</span>`).join('');
    $('journeyFrom').innerHTML = fromEmos;
    $('journeyTo').innerHTML   = toEmos;

    // Source badge
    const badge = $('playlistSourceBadge');
    if (badge) {
        badge.textContent   = playlistFromSpotify ? '🎵 Live from Spotify' : '📚 Local library';
        badge.className     = 'source-badge' + (playlistFromSpotify ? ' live' : ' local');
    }

    // Default name
    const fromLabel = currentEmotions.map(e => EMOTIONS[e].label).join('+');
    const toLabel   = targetEmotions.map(e => EMOTIONS[e].label).join('+');
    $('playlistName').value = `${fromLabel} → ${toLabel}`;

    // Result genre chips (only useful for local playlists)
    resultGenre = 'All';
    buildGenreChips('resultGenreChips', (g) => {
        resultGenre = g;
        renderTrackList(currentPlaylist);
    });

    updateSpotifyBanner();
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
        if (authSystem.isSignedIn()) {
            try {
                await cloudStorage.savePlaylist(name, currentPlaylist, currentEmotions, targetEmotions, false);
                toast('Saved locally and to cloud!', 3000);
            } catch {
                toast('Saved locally!', 3000);
            }
        } else {
            toast('Saved!', 3000);
        }
        // Refresh playlists tab if it is currently active
        if ($('panelPlaylists')?.classList.contains('active')) {
            loadSavedPlaylists();
        }
    } catch { toast('Save failed'); }
});

// ---- Export to Spotify via TuneMyMusic ----
$('createSpotifyBtn').addEventListener('click', async () => {
    if (!currentPlaylist.length) return;
    stopAudio();
    const text = currentPlaylist.map(s => `${s.artist} - ${s.title}`).join('\n');
    try {
        await navigator.clipboard.writeText(text);
    } catch { /* clipboard may fail silently */ }
    chrome.tabs.create({ url: 'https://www.tunemymusic.com/transfer' });
    toast('Playlist copied! Paste it into the TuneMyMusic text box to add to Spotify.', 6000);
});

// ---- Spotify connect / disconnect (banner + modal buttons) ----
document.addEventListener('click', (e) => {
    const id = e.target.closest('button')?.id;
    if (id === 'connectSpotifyBtn' ||
        id === 'modalConnectSpotifyBtn' ||
        id === 'connectSpotifyBtnSignedOut') {
        connectSpotify();
    }
    if (id === 'disconnectSpotifyBtn' || id === 'disconnectSpotifyBtnSignedOut') {
        disconnectSpotify();
    }
});

// ---- Stop preview button ----
document.addEventListener('click', (e) => {
    if (e.target.id === 'stopPreviewBtn') stopAudio();
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
    container.innerHTML = '<p class="empty-state">Loading...</p>';

    const local = await playlistStorage.getAll();
    console.log('[Harmoniq] local playlists:', local.length, local);
    let playlists = [...local];

    console.log('[Harmoniq] isSignedIn:', authSystem.isSignedIn());
    if (authSystem.isSignedIn()) {
        try {
            const cloud = await cloudStorage.getUserPlaylists();
            console.log('[Harmoniq] cloud playlists:', cloud.length, cloud);
            const localIds = new Set(local.map(p => p.id));
            const onlyCloud = cloud.filter(p => !localIds.has(p.id));
            playlists = [...local, ...onlyCloud];
        } catch (err) {
            console.error('[Harmoniq] cloud fetch failed:', err);
        }
    }

    console.log('[Harmoniq] total playlists to render:', playlists.length);
    container.innerHTML = '';
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
            <div class="pl-card-info">
                <div class="pl-name">${pl.name}</div>
                <div class="pl-meta">${pl.songCount || 0} songs &bull; ${pl.createdDate || ''}</div>
                ${pl.journey ? `<div class="pl-journey">${pl.journey}</div>` : ''}
            </div>
            <div class="pl-card-btns">
                <button class="pl-toggle">▾ Tracks</button>
                <button class="pl-spotify-btn">🎵</button>
                <button class="pl-del">✕</button>
            </div>`;

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
                    row.innerHTML = `<span class="pl-track-num">${i + 1}</span>${s.title} <span class="pl-track-artist">— ${s.artist}</span>`;
                    row.addEventListener('click', () => {
                        chrome.tabs.create({ url: `https://open.spotify.com/search/${encodeURIComponent(`${s.title} ${s.artist}`)}` });
                    });
                    tracksDiv.appendChild(row);
                });
                show(tracksDiv);
                toggleBtn.textContent = '▴ Tracks';
            } else {
                hide(tracksDiv);
                toggleBtn.textContent = '▾ Tracks';
            }
        });

        header.querySelector('.pl-spotify-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!pl.songs?.length) { toast('No songs in this playlist'); return; }
            const text = pl.songs.map(s => `${s.artist} - ${s.title}`).join('\n');
            try {
                await navigator.clipboard.writeText(text);
            } catch { /* clipboard may fail silently */ }
            chrome.tabs.create({ url: 'https://www.tunemymusic.com/transfer' });
            toast('Playlist copied! Paste it into the TuneMyMusic text box to add to Spotify.', 6000);
        });

        header.querySelector('.pl-del').addEventListener('click', async (e) => {
            e.stopPropagation();
            await playlistStorage.deletePlaylist(pl.id);
            if (authSystem.isSignedIn()) {
                try { await cloudStorage.deletePlaylist(pl.id); } catch { /* ignore */ }
            }
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
    updateSpotifyModalStatus();
});

$('signOutBtn').addEventListener('click', async () => {
    await authSystem.signOut();
    hide($('authModal'));
    toast('Signed out');
});

// ---- Spotify redirect URI display + copy ----
function populateRedirectUriDisplays() {
    const uri = smartSpotify.redirectUri;
    ['redirectUriDisplayOut', 'redirectUriDisplayIn'].forEach(id => {
        const el = $(id);
        if (el) el.textContent = uri;
    });
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.sp-copy-uri-btn');
    if (!btn) return;
    const targetId = btn.dataset.target;
    const text = $(targetId)?.textContent;
    if (text) {
        navigator.clipboard.writeText(text).then(() => toast('Redirect URI copied!')).catch(() => {});
    }
});

// ---- Init ----
(async () => {
    await loadPrefs();
    populateRedirectUriDisplays();
    // Silently restore a cached Spotify token so modal shows correct status immediately
    await smartSpotify.loadCachedToken().catch(() => {});
    updateSpotifyModalStatus();
    updateSpotifyBanner();
})();

window.showNotification = toast;
console.log('Harmoniq v5 loaded');
