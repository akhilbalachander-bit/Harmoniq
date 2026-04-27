// ============================================
// MUSIC DATABASE - STARTER (60 songs)
// Replace with auto-generated version from Setup Wizard
// ============================================

const musicDatabase = {
    happy: [
        { title: "Happy", artist: "Pharrell Williams", spotifyQuery: "Happy Pharrell Williams", reason: "Pure joy" },
        { title: "Don't Stop Me Now", artist: "Queen", spotifyQuery: "Don't Stop Me Now Queen", reason: "Unstoppable energy" },
        { title: "Good Vibrations", artist: "The Beach Boys", spotifyQuery: "Good Vibrations Beach Boys", reason: "Positive vibes" },
        { title: "Walking on Sunshine", artist: "Katrina and the Waves", spotifyQuery: "Walking on Sunshine", reason: "Feel-good" }
    ],
    sad: [
        { title: "Someone Like You", artist: "Adele", spotifyQuery: "Someone Like You Adele", reason: "Heartbreak" },
        { title: "The Night We Met", artist: "Lord Huron", spotifyQuery: "The Night We Met Lord Huron", reason: "Nostalgia" },
        { title: "Skinny Love", artist: "Bon Iver", spotifyQuery: "Skinny Love Bon Iver", reason: "Vulnerability" },
        { title: "Fix You", artist: "Coldplay", spotifyQuery: "Fix You Coldplay", reason: "Healing" }
    ],
    energetic: [
        { title: "Eye of the Tiger", artist: "Survivor", spotifyQuery: "Eye of the Tiger Survivor", reason: "Fighting spirit" },
        { title: "Thunderstruck", artist: "AC/DC", spotifyQuery: "Thunderstruck ACDC", reason: "Electric" },
        { title: "Till I Collapse", artist: "Eminem", spotifyQuery: "Till I Collapse Eminem", reason: "Motivation" },
        { title: "Can't Hold Us", artist: "Macklemore", spotifyQuery: "Can't Hold Us Macklemore", reason: "High energy" }
    ],
    calm: [
        { title: "Weightless", artist: "Marconi Union", spotifyQuery: "Weightless Marconi Union", reason: "Relaxation" },
        { title: "River Flows in You", artist: "Yiruma", spotifyQuery: "River Flows in You Yiruma", reason: "Peaceful" },
        { title: "Clair de Lune", artist: "Debussy", spotifyQuery: "Clair de Lune Debussy", reason: "Tranquil" },
        { title: "Breathe", artist: "Telepopmusik", spotifyQuery: "Breathe Telepopmusik", reason: "Calming" }
    ],
    anxious: [
        { title: "Breathe Me", artist: "Sia", spotifyQuery: "Breathe Me Sia", reason: "Grounding" },
        { title: "Let It Be", artist: "The Beatles", spotifyQuery: "Let It Be Beatles", reason: "Acceptance" },
        { title: "The Scientist", artist: "Coldplay", spotifyQuery: "The Scientist Coldplay", reason: "Reflection" },
        { title: "Landslide", artist: "Fleetwood Mac", spotifyQuery: "Landslide Fleetwood Mac", reason: "Gentle release" }
    ],
    angry: [
        { title: "Break Stuff", artist: "Limp Bizkit", spotifyQuery: "Break Stuff Limp Bizkit", reason: "Release" },
        { title: "Killing in the Name", artist: "Rage Against the Machine", spotifyQuery: "Killing in the Name RATM", reason: "Rage" },
        { title: "Bodies", artist: "Drowning Pool", spotifyQuery: "Bodies Drowning Pool", reason: "Aggression" },
        { title: "Numb", artist: "Linkin Park", spotifyQuery: "Numb Linkin Park", reason: "Frustration" }
    ],
    romantic: [
        { title: "Perfect", artist: "Ed Sheeran", spotifyQuery: "Perfect Ed Sheeran", reason: "Love" },
        { title: "Thinking Out Loud", artist: "Ed Sheeran", spotifyQuery: "Thinking Out Loud Ed Sheeran", reason: "Romance" },
        { title: "All of Me", artist: "John Legend", spotifyQuery: "All of Me John Legend", reason: "Devotion" },
        { title: "Make You Feel My Love", artist: "Adele", spotifyQuery: "Make You Feel My Love Adele", reason: "Affection" }
    ],
    nostalgic: [
        { title: "Summer of '69", artist: "Bryan Adams", spotifyQuery: "Summer of 69 Bryan Adams", reason: "Classic" },
        { title: "Don't Stop Believin'", artist: "Journey", spotifyQuery: "Don't Stop Believin Journey", reason: "Timeless" },
        { title: "Sweet Child O' Mine", artist: "Guns N' Roses", spotifyQuery: "Sweet Child O Mine GNR", reason: "Memories" },
        { title: "Hotel California", artist: "Eagles", spotifyQuery: "Hotel California Eagles", reason: "Retro" }
    ],
    tired: [
        { title: "Sleep Walk", artist: "Santo & Johnny", spotifyQuery: "Sleep Walk Santo Johnny", reason: "Dreamy" },
        { title: "Gymnopédie No. 1", artist: "Erik Satie", spotifyQuery: "Gymnopedie Satie", reason: "Peaceful" },
        { title: "Nocturne Op.9 No.2", artist: "Chopin", spotifyQuery: "Nocturne Chopin", reason: "Restful" },
        { title: "Moon River", artist: "Andy Williams", spotifyQuery: "Moon River Andy Williams", reason: "Lullaby" }
    ],
    motivated: [
        { title: "Stronger", artist: "Kanye West", spotifyQuery: "Stronger Kanye West", reason: "Power" },
        { title: "Lose Yourself", artist: "Eminem", spotifyQuery: "Lose Yourself Eminem", reason: "Determination" },
        { title: "Hall of Fame", artist: "The Script", spotifyQuery: "Hall of Fame The Script", reason: "Achievement" },
        { title: "Remember the Name", artist: "Fort Minor", spotifyQuery: "Remember the Name Fort Minor", reason: "Drive" }
    ],
    lonely: [
        { title: "All By Myself", artist: "Eric Carmen", spotifyQuery: "All By Myself Eric Carmen", reason: "Solitude" },
        { title: "Hurt", artist: "Johnny Cash", spotifyQuery: "Hurt Johnny Cash", reason: "Isolation" },
        { title: "Mad World", artist: "Gary Jules", spotifyQuery: "Mad World Gary Jules", reason: "Melancholy" },
        { title: "Everybody Hurts", artist: "R.E.M.", spotifyQuery: "Everybody Hurts REM", reason: "Shared pain" }
    ],
    confident: [
        { title: "Confident", artist: "Demi Lovato", spotifyQuery: "Confident Demi Lovato", reason: "Self-assurance" },
        { title: "Stronger", artist: "Kelly Clarkson", spotifyQuery: "Stronger Kelly Clarkson", reason: "Empowerment" },
        { title: "Roar", artist: "Katy Perry", spotifyQuery: "Roar Katy Perry", reason: "Bold" },
        { title: "Fighter", artist: "Christina Aguilera", spotifyQuery: "Fighter Christina Aguilera", reason: "Resilience" }
    ],
    stressed: [
        { title: "Three Little Birds", artist: "Bob Marley", spotifyQuery: "Three Little Birds Bob Marley", reason: "Reassurance" },
        { title: "Don't Worry Be Happy", artist: "Bobby McFerrin", spotifyQuery: "Don't Worry Be Happy McFerrin", reason: "Peace" },
        { title: "Here Comes the Sun", artist: "The Beatles", spotifyQuery: "Here Comes the Sun Beatles", reason: "Relief" },
        { title: "What a Wonderful World", artist: "Louis Armstrong", spotifyQuery: "Wonderful World Armstrong", reason: "Perspective" }
    ],
    excited: [
        { title: "Party Rock Anthem", artist: "LMFAO", spotifyQuery: "Party Rock Anthem LMFAO", reason: "Celebration" },
        { title: "Uptown Funk", artist: "Mark Ronson", spotifyQuery: "Uptown Funk Mark Ronson", reason: "High energy" },
        { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", spotifyQuery: "Can't Stop the Feeling Timberlake", reason: "Joy" },
        { title: "Levels", artist: "Avicii", spotifyQuery: "Levels Avicii", reason: "Euphoria" }
    ],
    hopeful: [
        { title: "Here Comes the Sun", artist: "The Beatles", spotifyQuery: "Here Comes the Sun Beatles", reason: "Optimism" },
        { title: "Brave", artist: "Sara Bareilles", spotifyQuery: "Brave Sara Bareilles", reason: "Courage" },
        { title: "Beautiful Day", artist: "U2", spotifyQuery: "Beautiful Day U2", reason: "Fresh start" },
        { title: "Rise Up", artist: "Andra Day", spotifyQuery: "Rise Up Andra Day", reason: "Uplift" }
    ]
};

window.musicDatabase = musicDatabase;
