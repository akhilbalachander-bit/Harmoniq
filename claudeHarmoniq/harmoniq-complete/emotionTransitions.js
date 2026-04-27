// ============================================
// EMOTION TRANSITION ALGORITHM
// 3-Phase Journey: Validation → Transition → Destination
// ============================================

const EMOTION_TRANSITIONS = {
    happy:     { neighbors: ['excited', 'confident', 'energetic', 'hopeful'] },
    sad:       { neighbors: ['lonely', 'nostalgic', 'tired', 'hopeful'] },
    energetic: { neighbors: ['excited', 'happy', 'motivated', 'confident'] },
    calm:      { neighbors: ['hopeful', 'happy', 'nostalgic', 'romantic'] },
    anxious:   { neighbors: ['stressed', 'sad', 'calm', 'hopeful'] },
    angry:     { neighbors: ['stressed', 'energetic', 'motivated', 'calm'] },
    romantic:  { neighbors: ['happy', 'nostalgic', 'calm', 'hopeful'] },
    nostalgic: { neighbors: ['sad', 'romantic', 'calm', 'hopeful'] },
    tired:     { neighbors: ['calm', 'sad', 'lonely', 'hopeful'] },
    motivated: { neighbors: ['energetic', 'confident', 'excited', 'hopeful'] },
    lonely:    { neighbors: ['sad', 'nostalgic', 'hopeful', 'calm'] },
    confident: { neighbors: ['happy', 'energetic', 'motivated', 'excited'] },
    stressed:  { neighbors: ['anxious', 'angry', 'calm', 'hopeful'] },
    excited:   { neighbors: ['happy', 'energetic', 'confident', 'motivated'] },
    hopeful:   { neighbors: ['happy', 'calm', 'motivated', 'confident'] }
};

function buildJourneyPlaylist(currentEmotions, targetEmotions, shuffle = false) {
    const config = window.HARMONIQ_CONFIG || { playlistSize: 20, journeyPhases: { validation: 0.30, transition: 0.40, destination: 0.30 } };
    const db = window.musicDatabase;
    if (!db) { console.error('No music database found'); return []; }

    const totalSongs = config.playlistSize;
    const validationCount = Math.round(totalSongs * config.journeyPhases.validation);
    const transitionCount = Math.round(totalSongs * config.journeyPhases.transition);
    const destinationCount = totalSongs - validationCount - transitionCount;

    const playlist = [];

    // Phase 1: Validation (songs matching current emotions)
    for (let i = 0; i < validationCount; i++) {
        const emotion = currentEmotions[i % currentEmotions.length];
        const songs = db[emotion] || [];
        if (songs.length > 0) {
            const song = songs[Math.floor(Math.random() * songs.length)];
            playlist.push({ ...song, phase: 'validation', emotion: emotion });
        }
    }

    // Phase 2: Transition (bridging songs)
    const transitionEmotions = findTransitionEmotions(currentEmotions, targetEmotions);
    for (let i = 0; i < transitionCount; i++) {
        const emotion = transitionEmotions[i % transitionEmotions.length];
        const songs = db[emotion] || [];
        if (songs.length > 0) {
            const song = songs[Math.floor(Math.random() * songs.length)];
            playlist.push({ ...song, phase: 'transition', emotion: emotion });
        }
    }

    // Phase 3: Destination (songs matching target emotions)
    for (let i = 0; i < destinationCount; i++) {
        const emotion = targetEmotions[i % targetEmotions.length];
        const songs = db[emotion] || [];
        if (songs.length > 0) {
            const song = songs[Math.floor(Math.random() * songs.length)];
            playlist.push({ ...song, phase: 'destination', emotion: emotion });
        }
    }

    // Remove duplicates
    const unique = [];
    const seen = new Set();
    for (const song of playlist) {
        const key = `${song.title}-${song.artist}`.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(song);
        }
    }

    if (shuffle) {
        for (let i = unique.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unique[i], unique[j]] = [unique[j], unique[i]];
        }
    }

    return unique.slice(0, totalSongs);
}

function findTransitionEmotions(current, target) {
    const transitions = new Set();
    for (const c of current) {
        const neighbors = EMOTION_TRANSITIONS[c]?.neighbors || [];
        for (const n of neighbors) {
            if (target.includes(n) || EMOTION_TRANSITIONS[n]?.neighbors.some(x => target.includes(x))) {
                transitions.add(n);
            }
        }
    }
    for (const t of target) {
        const neighbors = EMOTION_TRANSITIONS[t]?.neighbors || [];
        for (const n of neighbors) {
            transitions.add(n);
        }
    }
    if (transitions.size === 0) {
        transitions.add('hopeful');
        transitions.add('calm');
    }
    return Array.from(transitions);
}

window.buildJourneyPlaylist = buildJourneyPlaylist;
window.EMOTION_TRANSITIONS = EMOTION_TRANSITIONS;
