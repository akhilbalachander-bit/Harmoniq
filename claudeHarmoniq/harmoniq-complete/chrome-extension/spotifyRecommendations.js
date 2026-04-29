// ============================================
// SPOTIFY RECOMMENDATIONS
// Maps emotions to Spotify audio features and
// fetches a 3-phase journey playlist live from
// the Spotify Recommendations API.
//
// Falls back gracefully if the API is unavailable
// (returns null so caller can use musicData.js).
// ============================================

// Spotify audio feature targets per emotion
// valence 0–1 (sad→happy), energy 0–1 (slow→intense),
// danceability 0–1, acousticness 0–1, tempo BPM
const EMOTION_FEATURES = {
    happy:     { valence: 0.85, energy: 0.75, danceability: 0.75, acousticness: 0.15, tempo: 120, genres: ['pop', 'dance', 'indie-pop'] },
    sad:       { valence: 0.10, energy: 0.25, danceability: 0.30, acousticness: 0.60, tempo: 76,  genres: ['indie', 'folk', 'singer-songwriter'] },
    energetic: { valence: 0.70, energy: 0.95, danceability: 0.85, acousticness: 0.05, tempo: 140, genres: ['edm', 'dance', 'pop'] },
    calm:      { valence: 0.55, energy: 0.20, danceability: 0.30, acousticness: 0.75, tempo: 80,  genres: ['ambient', 'acoustic', 'chill'] },
    anxious:   { valence: 0.20, energy: 0.70, danceability: 0.40, acousticness: 0.20, tempo: 125, genres: ['alternative', 'indie', 'rock'] },
    angry:     { valence: 0.10, energy: 0.90, danceability: 0.50, acousticness: 0.05, tempo: 145, genres: ['metal', 'rock', 'punk'] },
    romantic:  { valence: 0.80, energy: 0.40, danceability: 0.55, acousticness: 0.45, tempo: 96,  genres: ['pop', 'r-n-b', 'soul'] },
    nostalgic: { valence: 0.65, energy: 0.45, danceability: 0.45, acousticness: 0.40, tempo: 100, genres: ['rock', 'pop', 'soul'] },
    tired:     { valence: 0.30, energy: 0.15, danceability: 0.20, acousticness: 0.80, tempo: 66,  genres: ['ambient', 'acoustic', 'sleep'] },
    motivated: { valence: 0.80, energy: 0.85, danceability: 0.75, acousticness: 0.10, tempo: 130, genres: ['hip-hop', 'pop', 'dance'] },
    lonely:    { valence: 0.15, energy: 0.25, danceability: 0.25, acousticness: 0.65, tempo: 72,  genres: ['indie', 'folk', 'singer-songwriter'] },
    confident: { valence: 0.85, energy: 0.80, danceability: 0.80, acousticness: 0.10, tempo: 125, genres: ['hip-hop', 'pop', 'r-n-b'] },
    stressed:  { valence: 0.20, energy: 0.65, danceability: 0.35, acousticness: 0.30, tempo: 115, genres: ['acoustic', 'indie', 'alternative'] },
    excited:   { valence: 0.90, energy: 0.90, danceability: 0.85, acousticness: 0.05, tempo: 140, genres: ['dance', 'edm', 'pop'] },
    hopeful:   { valence: 0.75, energy: 0.55, danceability: 0.55, acousticness: 0.35, tempo: 105, genres: ['pop', 'indie-pop', 'soul'] },
};

function avgFeatures(emotionKeys) {
    const feats = emotionKeys.map(k => EMOTION_FEATURES[k]).filter(Boolean);
    if (!feats.length) return EMOTION_FEATURES.hopeful;
    const n = feats.length;
    return {
        valence:      feats.reduce((s, f) => s + f.valence,      0) / n,
        energy:       feats.reduce((s, f) => s + f.energy,       0) / n,
        danceability: feats.reduce((s, f) => s + f.danceability, 0) / n,
        acousticness: feats.reduce((s, f) => s + f.acousticness, 0) / n,
        tempo:        feats.reduce((s, f) => s + f.tempo,        0) / n,
        genres:       feats[0].genres,
    };
}

function blendFeatures(a, b, t) {
    const lerp = (x, y) => x + (y - x) * t;
    return {
        valence:      lerp(a.valence,      b.valence),
        energy:       lerp(a.energy,       b.energy),
        danceability: lerp(a.danceability, b.danceability),
        acousticness: lerp(a.acousticness, b.acousticness),
        tempo:        lerp(a.tempo,        b.tempo),
        genres:       t < 0.5 ? a.genres : b.genres,
    };
}

class SpotifyRecommendations {

    async fetchPhase(features, limit, token) {
        const seeds = features.genres.slice(0, 2).join(',');
        const params = new URLSearchParams({
            limit: String(limit),
            seed_genres:          seeds,
            target_valence:       features.valence.toFixed(3),
            target_energy:        features.energy.toFixed(3),
            target_danceability:  features.danceability.toFixed(3),
            target_acousticness:  features.acousticness.toFixed(3),
            target_tempo:         String(Math.round(features.tempo)),
        });

        const res = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 429) {
            const wait = parseInt(res.headers.get('Retry-After') || '2') * 1000;
            await new Promise(r => setTimeout(r, wait));
            return this.fetchPhase(features, limit, token);
        }

        if (res.status === 403) {
            // Recommendations API not available for this app
            throw new Error('RECOMMENDATIONS_UNAVAILABLE');
        }

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error?.message || `Spotify ${res.status}`);
        }

        const data = await res.json();
        return (data.tracks || []).map(t => ({
            title:      t.name,
            artist:     t.artists.map(a => a.name).join(', '),
            album:      t.album?.name || '',
            albumArt:   t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || null,
            previewUrl: t.preview_url || null,
            spotifyUrl: t.external_urls?.spotify || null,
            uri:        t.uri,
            id:         t.id,
            fromSpotify: true,
        }));
    }

    // Build a 3-phase emotional journey using live Spotify data.
    // Returns null if the API is unavailable (caller should fall back).
    async buildJourney(currentEmotions, targetEmotions, token, onProgress) {
        try {
            const fromFeats  = avgFeatures(currentEmotions);
            const toFeats    = avgFeatures(targetEmotions);
            const blendFeats = blendFeatures(fromFeats, toFeats, 0.5);

            onProgress?.('Fetching songs for your current mood...');
            const phase1 = await this.fetchPhase(fromFeats, 8, token);

            onProgress?.('Building transition...');
            await new Promise(r => setTimeout(r, 250));
            const phase2 = await this.fetchPhase(blendFeats, 6, token);

            onProgress?.('Finding destination songs...');
            await new Promise(r => setTimeout(r, 250));
            const phase3 = await this.fetchPhase(toFeats, 6, token);

            // Tag phases and deduplicate by Spotify track ID
            const tagged = [
                ...phase1.map(t => ({ ...t, phase: 'validation' })),
                ...phase2.map(t => ({ ...t, phase: 'transition' })),
                ...phase3.map(t => ({ ...t, phase: 'destination' })),
            ];
            const seen = new Set();
            const unique = tagged.filter(t => {
                if (seen.has(t.id)) return false;
                seen.add(t.id);
                return true;
            });

            return unique.slice(0, 20);
        } catch (err) {
            if (err.message === 'RECOMMENDATIONS_UNAVAILABLE') return null;
            console.warn('Spotify recommendations failed, falling back:', err.message);
            return null;
        }
    }
}

const spotifyRec = new SpotifyRecommendations();
window.spotifyRec = spotifyRec;
window.EMOTION_FEATURES = EMOTION_FEATURES;
