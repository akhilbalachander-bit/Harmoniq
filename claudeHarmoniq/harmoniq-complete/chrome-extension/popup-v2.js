// ============================================
// HARMONIQ MAIN APPLICATION LOGIC
// ============================================

let currentEmotions = [];
let targetEmotions = [];
let currentPlaylist = [];

// DOM Elements
const currentGrid = document.getElementById('currentEmotionGrid');
const targetGrid = document.getElementById('targetEmotionGrid');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const generateBtn = document.getElementById('generateBtn');
const saveBtn = document.getElementById('saveBtn');
const createSpotifyBtn = document.getElementById('createSpotifyBtn');
const startOverBtn = document.getElementById('startOverBtn');
const trackList = document.getElementById('trackList');
const playlistNameInput = document.getElementById('playlistName');
const shuffleToggle = document.getElementById('shuffleToggle');
const journeyTitle = document.getElementById('journeyTitle');
const journeyDesc = document.getElementById('journeyDesc');

// Build emotion grids
function buildEmotionGrid(container, selectionArray, maxSelections = 3) {
    container.innerHTML = '';
    for (const [key, data] of Object.entries(EMOTIONS)) {
        const btn = document.createElement('button');
        btn.className = 'emotion-btn';
        btn.innerHTML = `<span class="emotion-emoji">${data.emoji}</span><span class="emotion-name">${data.label}</span>`;
        btn.addEventListener('click', () => {
            const idx = selectionArray.indexOf(key);
            if (idx > -1) { selectionArray.splice(idx, 1); btn.classList.remove('selected'); }
            else if (selectionArray.length < maxSelections) { selectionArray.push(key); btn.classList.add('selected'); }
            updateButtons();
        });
        container.appendChild(btn);
    }
}

function updateButtons() {
    nextBtn.disabled = currentEmotions.length === 0;
    generateBtn.disabled = targetEmotions.length === 0;
}

buildEmotionGrid(currentGrid, currentEmotions);
buildEmotionGrid(targetGrid, targetEmotions);

// Tab navigation
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');
        if (tab.dataset.tab === 'saved') loadSavedPlaylists();
    });
});

// Step navigation
nextBtn.addEventListener('click', () => {
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
});

backBtn.addEventListener('click', () => {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
});

startOverBtn.addEventListener('click', () => {
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    currentEmotions = []; targetEmotions = [];
    document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
    updateButtons();
});

// Generate playlist
generateBtn.addEventListener('click', async () => {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';

    await new Promise(r => setTimeout(r, 300));

    currentPlaylist = buildJourneyPlaylist(currentEmotions, targetEmotions, shuffleToggle.checked);

    const cLabels = currentEmotions.map(e => EMOTIONS[e].label).join(' + ');
    const tLabels = targetEmotions.map(e => EMOTIONS[e].label).join(' + ');
    journeyTitle.textContent = `${cLabels} → ${tLabels}`;
    journeyDesc.textContent = `${currentPlaylist.length} songs for your journey`;
    playlistNameInput.value = `${cLabels} → ${tLabels}`;

    trackList.innerHTML = '';
    currentPlaylist.forEach((song, i) => {
        const item = document.createElement('div');
        item.className = 'track-item';
        item.innerHTML = `
            <div class="track-number">${i + 1}</div>
            <div class="track-info">
                <div class="track-title">${song.title}</div>
                <div class="track-artist">${song.artist}</div>
                <div class="track-phase">${song.phase || ''}</div>
            </div>`;
        item.addEventListener('click', () => {
            window.open(`https://open.spotify.com/search/${encodeURIComponent(song.spotifyQuery)}`, '_blank');
        });
        trackList.appendChild(item);
    });

    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';
});

// Save playlist
saveBtn.addEventListener('click', async () => {
    const name = playlistNameInput.value.trim();
    if (!name) { showNotification('⚠️ Enter a playlist name'); return; }
    try {
        await playlistStorage.save(name, currentPlaylist, currentEmotions, targetEmotions, shuffleToggle.checked);
        showNotification('✅ Saved locally!');
        if (authSystem.isSignedIn()) {
            try {
                await cloudStorage.savePlaylist(name, currentPlaylist, currentEmotions, targetEmotions, shuffleToggle.checked);
                showNotification('✅ Saved to cloud!');
            } catch (e) { showNotification('✅ Saved locally (cloud failed)'); }
        }
    } catch (e) { showNotification('❌ Save failed'); }
});

// Create in Spotify
createSpotifyBtn.addEventListener('click', async () => {
    if (!currentPlaylist.length) return;
    const songs = currentPlaylist.map(t => ({ title: t.title, artist: t.artist }));
    const songList = songs.map(s => `${s.artist} - ${s.title}`).join('\n');
    try {
        await navigator.clipboard.writeText(songList);
        showNotification('📋 Songs copied! Opening TuneMyMusic...');
        window.open('https://www.tunemymusic.com/transfer', '_blank');
    } catch (e) { showNotification('❌ Copy failed'); }
});

// Load saved playlists
async function loadSavedPlaylists() {
    const container = document.getElementById('savedPlaylists');
    const playlists = await playlistStorage.getAll();
    if (!playlists.length) { container.innerHTML = '<p class="empty-state">No saved playlists yet</p>'; return; }
    container.innerHTML = '';
    playlists.forEach(pl => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `<div class="playlist-card-name">${pl.name}</div><div class="playlist-card-meta">${pl.songCount} songs • ${pl.journey} • ${pl.createdDate}</div>`;
        container.appendChild(card);
    });
}

// Auth UI
const signedOutSection = document.getElementById('signedOut');
const signedInSection = document.getElementById('signedIn');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userEmail = document.getElementById('userEmail');

authSystem.onAuthStateChanged((user) => {
    if (user) { signedOutSection.style.display = 'none'; signedInSection.style.display = 'block'; userEmail.textContent = user.email; }
    else { signedOutSection.style.display = 'block'; signedInSection.style.display = 'none'; }
});

googleSignInBtn.addEventListener('click', async () => {
    try { await authSystem.signInWithGoogle(); showNotification('✅ Signed in!'); }
    catch (e) { showNotification('❌ Sign-in failed'); }
});

signOutBtn.addEventListener('click', async () => {
    try { await authSystem.signOut(); showNotification('✅ Signed out'); }
    catch (e) { showNotification('❌ Sign-out failed'); }
});

// Notification
function showNotification(msg) {
    const el = document.getElementById('notification');
    el.textContent = msg; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

window.showNotification = showNotification;
console.log('✅ Harmoniq loaded');
