// ============================================
// SPOTIFY RECOMMENDATIONS (Search-based)
// Uses Spotify Search API — works for all apps
// without quota extensions (replaces the
// deprecated /v1/recommendations endpoint).
// Falls back gracefully if unavailable.
// ============================================

// Emotion → curated search queries for Spotify Search API.
// Multiple queries per emotion give variety across the 3 phases.
const EMOTION_QUERIES = {
    happy:     ['happy feel good pop', 'upbeat joyful hits', 'sunshine indie pop', 'cheerful uplifting'],
    sad:       ['sad heartbreak ballad', 'melancholy indie songs', 'emotional tearjerker', 'sorrow acoustic folk'],
    energetic: ['high energy workout anthems', 'pump up edm bangers', 'intense cardio music', 'hype rap'],
    calm:      ['calm relaxing acoustic', 'peaceful ambient chill', 'serene lo-fi beats', 'gentle instrumental'],
    anxious:   ['tense anxious alternative', 'nervous energy indie rock', 'uneasy synth pop', 'restless music'],
    angry:     ['angry aggressive rock', 'rage metal', 'furious hip-hop', 'cathartic punk hardcore'],
    romantic:  ['romantic love songs', 'sensual r&b slow jams', 'tender love ballad', 'sweet soul romance'],
    nostalgic: ['nostalgic throwback hits', 'classic 80s pop', 'retro soul throwback', 'vintage rock classics'],
    tired:     ['sleepy ambient music', 'tired acoustic songs', 'dreamy lo-fi', 'soft bedtime lullaby'],
    motivated: ['motivational rap hustle', 'empowering pop hits', 'workout inspiration', 'achievement hip-hop'],
    lonely:    ['lonely indie folk', 'alone at night acoustic', 'isolation music', 'solitary introspective'],
    confident: ['confident swagger rap', 'boss energy hip-hop', 'powerful pop anthem', 'self-assured r&b'],
    stressed:  ['stress relief acoustic', 'calming tension music', 'unwinding indie chill', 'gentle de-stress'],
    excited:   ['excited celebration pop', 'euphoric dance anthems', 'party energy edm', 'thrilling upbeat'],
    hopeful:   ['hopeful uplifting indie', 'optimistic pop songs', 'bright future inspiration', 'inspired soul'],
};

class SpotifyRecommendations {

    // Search Spotify for tracks matching any of the given queries, up to `limit` unique results.
    async _searchTracks(queries, limit, token) {
        const tracks = [];
        const seen   = new Set();

        for (const query of queries) {
            if (tracks.length >= limit) break;
            try {
                const params = new URLSearchParams({
                    q:      query,
                    type:   'track',
                    limit:  String(Math.min(10, (limit - tracks.length) + 3)),
                    market: 'US',
                });
                const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.status === 429) {
                    const wait = parseInt(res.headers.get('Retry-After') || '2') * 1000;
                    await new Promise(r => setTimeout(r, wait));
                    continue;
                }
                if (!res.ok) continue;

                const data = await res.json();
                for (const t of (data.tracks?.items || [])) {
                    if (seen.has(t.id)) continue;
                    seen.add(t.id);
                    tracks.push({
                        title:       t.name,
                        artist:      t.artists.map(a => a.name).join(', '),
                        album:       t.album?.name || '',
                        albumArt:    t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || null,
                        previewUrl:  t.preview_url || null,
                        spotifyUrl:  t.external_urls?.spotify || null,
                        uri:         t.uri,
                        id:          t.id,
                        fromSpotify: true,
                    });
                    if (tracks.length >= limit) break;
                }
                if (tracks.length < limit) await new Promise(r => setTimeout(r, 100));
            } catch { continue; }
        }
        return tracks;
    }

    // Build search queries for a set of emotions (up to 2 per emotion for variety).
    _queriesFor(emotions) {
        return emotions.flatMap(e => (EMOTION_QUERIES[e] || []).slice(0, 2));
    }

    // Build a 3-phase emotional journey using Spotify Search.
    // Returns null if results are too thin (caller falls back to musicData.js).
    async buildJourney(currentEmotions, targetEmotions, token, onProgress) {
        try {
            const fromQueries  = this._queriesFor(currentEmotions);
            const toQueries    = this._queriesFor(targetEmotions);
            // Blend = first query from current + first from target
            const blendQueries = [...fromQueries.slice(0, 2), ...toQueries.slice(0, 2)];

            if (!fromQueries.length || !toQueries.length) return null;

            onProgress?.('Fetching songs for your current mood...');
            const phase1 = await this._searchTracks(fromQueries, 8, token);

            onProgress?.('Building transition...');
            await new Promise(r => setTimeout(r, 200));
            const phase2 = await this._searchTracks(blendQueries, 6, token);

            onProgress?.('Finding destination songs...');
            await new Promise(r => setTimeout(r, 200));
            const phase3 = await this._searchTracks(toQueries, 6, token);

            // Tag phases, then deduplicate by Spotify track ID
            const tagged = [
                ...phase1.map(t => ({ ...t, phase: 'validation' })),
                ...phase2.map(t => ({ ...t, phase: 'transition' })),
                ...phase3.map(t => ({ ...t, phase: 'destination' })),
            ];
            const seen   = new Set();
            const unique = tagged.filter(t => {
                if (seen.has(t.id)) return false;
                seen.add(t.id);
                return true;
            });

            // Need at least 5 tracks to consider this a success
            return unique.length >= 5 ? unique.slice(0, 20) : null;
        } catch (err) {
            console.warn('Spotify search failed, falling back:', err.message);
            return null;
        }
    }
}

const spotifyRec = new SpotifyRecommendations();
window.spotifyRec = spotifyRec;
window.EMOTION_QUERIES = EMOTION_QUERIES;
