// ============================================
// MUSIC DATABASE — 150+ songs, 10 per emotion
// Each song has a 'genre' field for genre filtering
// ============================================

const musicDatabase = {
    happy: [
        { title: "Happy", artist: "Pharrell Williams", spotifyQuery: "Happy Pharrell Williams", reason: "Pure joy", genre: "pop" },
        { title: "Don't Stop Me Now", artist: "Queen", spotifyQuery: "Don't Stop Me Now Queen", reason: "Unstoppable energy", genre: "rock" },
        { title: "Good Vibrations", artist: "The Beach Boys", spotifyQuery: "Good Vibrations Beach Boys", reason: "Positive vibes", genre: "pop" },
        { title: "Walking on Sunshine", artist: "Katrina and the Waves", spotifyQuery: "Walking on Sunshine Katrina", reason: "Feel-good", genre: "pop" },
        { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", spotifyQuery: "Can't Stop the Feeling Timberlake", reason: "Dance joy", genre: "pop" },
        { title: "Best Day of My Life", artist: "American Authors", spotifyQuery: "Best Day of My Life American Authors", reason: "Celebration", genre: "indie rock" },
        { title: "Shake It Off", artist: "Taylor Swift", spotifyQuery: "Shake It Off Taylor Swift", reason: "Carefree", genre: "pop" },
        { title: "Happy Together", artist: "The Turtles", spotifyQuery: "Happy Together Turtles", reason: "Classic joy", genre: "pop" },
        { title: "I Gotta Feeling", artist: "Black Eyed Peas", spotifyQuery: "I Gotta Feeling Black Eyed Peas", reason: "Tonight", genre: "pop" },
        { title: "Here Comes the Sun", artist: "The Beatles", spotifyQuery: "Here Comes the Sun Beatles", reason: "Warmth", genre: "rock" }
    ],
    sad: [
        { title: "Someone Like You", artist: "Adele", spotifyQuery: "Someone Like You Adele", reason: "Heartbreak", genre: "pop" },
        { title: "The Night We Met", artist: "Lord Huron", spotifyQuery: "The Night We Met Lord Huron", reason: "Nostalgia", genre: "indie rock" },
        { title: "Skinny Love", artist: "Bon Iver", spotifyQuery: "Skinny Love Bon Iver", reason: "Vulnerability", genre: "indie rock" },
        { title: "Fix You", artist: "Coldplay", spotifyQuery: "Fix You Coldplay", reason: "Healing", genre: "rock" },
        { title: "The Scientist", artist: "Coldplay", spotifyQuery: "The Scientist Coldplay", reason: "Reflection", genre: "rock" },
        { title: "Tears in Heaven", artist: "Eric Clapton", spotifyQuery: "Tears in Heaven Eric Clapton", reason: "Grief", genre: "rock" },
        { title: "Mad World", artist: "Gary Jules", spotifyQuery: "Mad World Gary Jules", reason: "Melancholy", genre: "pop" },
        { title: "Hurt", artist: "Johnny Cash", spotifyQuery: "Hurt Johnny Cash", reason: "Desolation", genre: "rock" },
        { title: "Black", artist: "Pearl Jam", spotifyQuery: "Black Pearl Jam", reason: "Loss", genre: "rock" },
        { title: "Liability", artist: "Lorde", spotifyQuery: "Liability Lorde", reason: "Isolation", genre: "indie pop" }
    ],
    energetic: [
        { title: "Eye of the Tiger", artist: "Survivor", spotifyQuery: "Eye of the Tiger Survivor", reason: "Fighting spirit", genre: "rock" },
        { title: "Thunderstruck", artist: "AC/DC", spotifyQuery: "Thunderstruck ACDC", reason: "Electric", genre: "rock" },
        { title: "Till I Collapse", artist: "Eminem", spotifyQuery: "Till I Collapse Eminem", reason: "Motivation", genre: "hip-hop" },
        { title: "Can't Hold Us", artist: "Macklemore", spotifyQuery: "Can't Hold Us Macklemore", reason: "High energy", genre: "hip-hop" },
        { title: "Levels", artist: "Avicii", spotifyQuery: "Levels Avicii", reason: "Euphoria", genre: "electronic" },
        { title: "Pump It", artist: "Black Eyed Peas", spotifyQuery: "Pump It Black Eyed Peas", reason: "Drive", genre: "hip-hop" },
        { title: "Jump Around", artist: "House of Pain", spotifyQuery: "Jump Around House of Pain", reason: "Hype", genre: "hip-hop" },
        { title: "Stronger", artist: "Kanye West", spotifyQuery: "Stronger Kanye West", reason: "Power", genre: "hip-hop" },
        { title: "Animals", artist: "Martin Garrix", spotifyQuery: "Animals Martin Garrix", reason: "Drop", genre: "electronic" },
        { title: "Turn Down for What", artist: "DJ Snake", spotifyQuery: "Turn Down for What DJ Snake", reason: "Chaos", genre: "electronic" }
    ],
    calm: [
        { title: "Weightless", artist: "Marconi Union", spotifyQuery: "Weightless Marconi Union", reason: "Relaxation", genre: "ambient" },
        { title: "River Flows in You", artist: "Yiruma", spotifyQuery: "River Flows in You Yiruma", reason: "Peaceful", genre: "classical" },
        { title: "Clair de Lune", artist: "Debussy", spotifyQuery: "Clair de Lune Debussy", reason: "Tranquil", genre: "classical" },
        { title: "Breathe", artist: "Telepopmusik", spotifyQuery: "Breathe Telepopmusik", reason: "Calming", genre: "electronic" },
        { title: "Holocene", artist: "Bon Iver", spotifyQuery: "Holocene Bon Iver", reason: "Vast", genre: "indie rock" },
        { title: "Experience", artist: "Ludovico Einaudi", spotifyQuery: "Experience Ludovico Einaudi", reason: "Serene", genre: "classical" },
        { title: "Breathe Me", artist: "Sia", spotifyQuery: "Breathe Me Sia", reason: "Gentle", genre: "pop" },
        { title: "The Night", artist: "Nils Frahm", spotifyQuery: "The Night Nils Frahm", reason: "Still", genre: "classical" },
        { title: "Gymnopédie No.1", artist: "Erik Satie", spotifyQuery: "Gymnopedie Satie", reason: "Timeless", genre: "classical" },
        { title: "Sunday Morning", artist: "Maroon 5", spotifyQuery: "Sunday Morning Maroon 5", reason: "Lazy ease", genre: "pop" }
    ],
    anxious: [
        { title: "Let It Be", artist: "The Beatles", spotifyQuery: "Let It Be Beatles", reason: "Acceptance", genre: "rock" },
        { title: "Landslide", artist: "Fleetwood Mac", spotifyQuery: "Landslide Fleetwood Mac", reason: "Gentle release", genre: "rock" },
        { title: "Three Little Birds", artist: "Bob Marley", spotifyQuery: "Three Little Birds Bob Marley", reason: "Reassurance", genre: "r&b" },
        { title: "Don't Panic", artist: "Coldplay", spotifyQuery: "Don't Panic Coldplay", reason: "Grounding", genre: "rock" },
        { title: "Unwritten", artist: "Natasha Bedingfield", spotifyQuery: "Unwritten Natasha Bedingfield", reason: "Open future", genre: "pop" },
        { title: "Easy", artist: "Groove Armada", spotifyQuery: "Easy Groove Armada", reason: "Ease", genre: "electronic" },
        { title: "In My Life", artist: "The Beatles", spotifyQuery: "In My Life Beatles", reason: "Perspective", genre: "rock" },
        { title: "Banana Pancakes", artist: "Jack Johnson", spotifyQuery: "Banana Pancakes Jack Johnson", reason: "Cosy", genre: "pop" },
        { title: "Better Together", artist: "Jack Johnson", spotifyQuery: "Better Together Jack Johnson", reason: "Support", genre: "pop" },
        { title: "The Blower's Daughter", artist: "Damien Rice", spotifyQuery: "The Blower's Daughter Damien Rice", reason: "Slow breath", genre: "indie rock" }
    ],
    angry: [
        { title: "Break Stuff", artist: "Limp Bizkit", spotifyQuery: "Break Stuff Limp Bizkit", reason: "Release", genre: "rock" },
        { title: "Killing in the Name", artist: "Rage Against the Machine", spotifyQuery: "Killing in the Name RATM", reason: "Rage", genre: "rock" },
        { title: "Bodies", artist: "Drowning Pool", spotifyQuery: "Bodies Drowning Pool", reason: "Aggression", genre: "rock" },
        { title: "Numb", artist: "Linkin Park", spotifyQuery: "Numb Linkin Park", reason: "Frustration", genre: "rock" },
        { title: "In the End", artist: "Linkin Park", spotifyQuery: "In the End Linkin Park", reason: "Catharsis", genre: "rock" },
        { title: "Given Up", artist: "Linkin Park", spotifyQuery: "Given Up Linkin Park", reason: "Unleash", genre: "rock" },
        { title: "Guerrilla Radio", artist: "Rage Against the Machine", spotifyQuery: "Guerrilla Radio RATM", reason: "Fight", genre: "rock" },
        { title: "Welcome to the Black Parade", artist: "My Chemical Romance", spotifyQuery: "Black Parade MCR", reason: "Defiance", genre: "rock" },
        { title: "Chop Suey!", artist: "System of a Down", spotifyQuery: "Chop Suey System of a Down", reason: "Chaos", genre: "rock" },
        { title: "B.Y.O.B.", artist: "System of a Down", spotifyQuery: "BYOB System of a Down", reason: "Fury", genre: "rock" }
    ],
    romantic: [
        { title: "Perfect", artist: "Ed Sheeran", spotifyQuery: "Perfect Ed Sheeran", reason: "Love", genre: "pop" },
        { title: "Thinking Out Loud", artist: "Ed Sheeran", spotifyQuery: "Thinking Out Loud Ed Sheeran", reason: "Romance", genre: "pop" },
        { title: "All of Me", artist: "John Legend", spotifyQuery: "All of Me John Legend", reason: "Devotion", genre: "r&b" },
        { title: "Make You Feel My Love", artist: "Adele", spotifyQuery: "Make You Feel My Love Adele", reason: "Affection", genre: "pop" },
        { title: "Endless Love", artist: "Diana Ross", spotifyQuery: "Endless Love Diana Ross", reason: "Timeless", genre: "r&b" },
        { title: "Lover", artist: "Taylor Swift", spotifyQuery: "Lover Taylor Swift", reason: "Dreamy", genre: "pop" },
        { title: "At Last", artist: "Etta James", spotifyQuery: "At Last Etta James", reason: "Bliss", genre: "soul" },
        { title: "Crazy in Love", artist: "Beyoncé", spotifyQuery: "Crazy in Love Beyonce", reason: "Passion", genre: "r&b" },
        { title: "Just the Way You Are", artist: "Bruno Mars", spotifyQuery: "Just the Way You Are Bruno Mars", reason: "Adoration", genre: "pop" },
        { title: "Iris", artist: "Goo Goo Dolls", spotifyQuery: "Iris Goo Goo Dolls", reason: "Deep feeling", genre: "rock" }
    ],
    nostalgic: [
        { title: "Summer of '69", artist: "Bryan Adams", spotifyQuery: "Summer of 69 Bryan Adams", reason: "Classic", genre: "rock" },
        { title: "Don't Stop Believin'", artist: "Journey", spotifyQuery: "Don't Stop Believin Journey", reason: "Timeless", genre: "rock" },
        { title: "Sweet Child O' Mine", artist: "Guns N' Roses", spotifyQuery: "Sweet Child O Mine GNR", reason: "Memories", genre: "rock" },
        { title: "Hotel California", artist: "Eagles", spotifyQuery: "Hotel California Eagles", reason: "Retro", genre: "rock" },
        { title: "Africa", artist: "Toto", spotifyQuery: "Africa Toto", reason: "80s warmth", genre: "rock" },
        { title: "Take On Me", artist: "a-ha", spotifyQuery: "Take On Me a-ha", reason: "80s magic", genre: "pop" },
        { title: "Come As You Are", artist: "Nirvana", spotifyQuery: "Come As You Are Nirvana", reason: "90s grunge", genre: "rock" },
        { title: "Semi-Charmed Life", artist: "Third Eye Blind", spotifyQuery: "Semi-Charmed Life Third Eye Blind", reason: "90s summer", genre: "rock" },
        { title: "Mr. Jones", artist: "Counting Crows", spotifyQuery: "Mr Jones Counting Crows", reason: "Yearning", genre: "rock" },
        { title: "1979", artist: "Smashing Pumpkins", spotifyQuery: "1979 Smashing Pumpkins", reason: "Youth", genre: "rock" }
    ],
    tired: [
        { title: "Gymnopédie No.1", artist: "Erik Satie", spotifyQuery: "Gymnopedie Satie", reason: "Peaceful", genre: "classical" },
        { title: "Nocturne Op.9 No.2", artist: "Chopin", spotifyQuery: "Nocturne Chopin", reason: "Restful", genre: "classical" },
        { title: "Moon River", artist: "Andy Williams", spotifyQuery: "Moon River Andy Williams", reason: "Lullaby", genre: "pop" },
        { title: "La Vie en Rose", artist: "Édith Piaf", spotifyQuery: "La Vie en Rose Piaf", reason: "Dreamy", genre: "classical" },
        { title: "Sleep Walk", artist: "Santo & Johnny", spotifyQuery: "Sleep Walk Santo Johnny", reason: "Drifting", genre: "classical" },
        { title: "Night Owl", artist: "Galimatias", spotifyQuery: "Night Owl Galimatias", reason: "Late night", genre: "electronic" },
        { title: "Slow Motion", artist: "Trey Songz", spotifyQuery: "Slow Motion Trey Songz", reason: "Low energy", genre: "r&b" },
        { title: "Falling", artist: "Harry Styles", spotifyQuery: "Falling Harry Styles", reason: "Heavy", genre: "pop" },
        { title: "To Build a Home", artist: "The Cinematic Orchestra", spotifyQuery: "To Build a Home Cinematic Orchestra", reason: "Quiet", genre: "classical" },
        { title: "With or Without You", artist: "U2", spotifyQuery: "With or Without You U2", reason: "Weary", genre: "rock" }
    ],
    motivated: [
        { title: "Lose Yourself", artist: "Eminem", spotifyQuery: "Lose Yourself Eminem", reason: "Determination", genre: "hip-hop" },
        { title: "Hall of Fame", artist: "The Script", spotifyQuery: "Hall of Fame The Script", reason: "Achievement", genre: "pop" },
        { title: "Remember the Name", artist: "Fort Minor", spotifyQuery: "Remember the Name Fort Minor", reason: "Drive", genre: "hip-hop" },
        { title: "Believer", artist: "Imagine Dragons", spotifyQuery: "Believer Imagine Dragons", reason: "Rise", genre: "rock" },
        { title: "Unstoppable", artist: "Sia", spotifyQuery: "Unstoppable Sia", reason: "Power", genre: "pop" },
        { title: "Fight Song", artist: "Rachel Platten", spotifyQuery: "Fight Song Rachel Platten", reason: "Resilience", genre: "pop" },
        { title: "Blinding Lights", artist: "The Weeknd", spotifyQuery: "Blinding Lights The Weeknd", reason: "Rush", genre: "pop" },
        { title: "Radioactive", artist: "Imagine Dragons", spotifyQuery: "Radioactive Imagine Dragons", reason: "Awakening", genre: "rock" },
        { title: "Work Hard Play Hard", artist: "Wiz Khalifa", spotifyQuery: "Work Hard Play Hard Wiz Khalifa", reason: "Grind", genre: "hip-hop" },
        { title: "Run the World (Girls)", artist: "Beyoncé", spotifyQuery: "Run the World Beyonce", reason: "Empowerment", genre: "r&b" }
    ],
    lonely: [
        { title: "All By Myself", artist: "Eric Carmen", spotifyQuery: "All By Myself Eric Carmen", reason: "Solitude", genre: "pop" },
        { title: "Hurt", artist: "Johnny Cash", spotifyQuery: "Hurt Johnny Cash", reason: "Isolation", genre: "rock" },
        { title: "Mad World", artist: "Gary Jules", spotifyQuery: "Mad World Gary Jules", reason: "Melancholy", genre: "pop" },
        { title: "Everybody Hurts", artist: "R.E.M.", spotifyQuery: "Everybody Hurts REM", reason: "Shared pain", genre: "rock" },
        { title: "I Am a Rock", artist: "Simon & Garfunkel", spotifyQuery: "I Am a Rock Simon Garfunkel", reason: "Withdrawal", genre: "pop" },
        { title: "Sound of Silence", artist: "Simon & Garfunkel", spotifyQuery: "Sound of Silence Simon Garfunkel", reason: "Empty", genre: "pop" },
        { title: "Creep", artist: "Radiohead", spotifyQuery: "Creep Radiohead", reason: "Outsider", genre: "rock" },
        { title: "Eleanor Rigby", artist: "The Beatles", spotifyQuery: "Eleanor Rigby Beatles", reason: "Alone", genre: "rock" },
        { title: "Driver 8", artist: "R.E.M.", spotifyQuery: "Driver 8 REM", reason: "Drifting", genre: "rock" },
        { title: "Breathe (2 AM)", artist: "Anna Nalick", spotifyQuery: "Breathe 2 AM Anna Nalick", reason: "Late alone", genre: "indie rock" }
    ],
    confident: [
        { title: "Confident", artist: "Demi Lovato", spotifyQuery: "Confident Demi Lovato", reason: "Self-assurance", genre: "pop" },
        { title: "Stronger", artist: "Kelly Clarkson", spotifyQuery: "Stronger Kelly Clarkson", reason: "Empowerment", genre: "pop" },
        { title: "Roar", artist: "Katy Perry", spotifyQuery: "Roar Katy Perry", reason: "Bold", genre: "pop" },
        { title: "Fighter", artist: "Christina Aguilera", spotifyQuery: "Fighter Christina Aguilera", reason: "Resilience", genre: "pop" },
        { title: "Formation", artist: "Beyoncé", spotifyQuery: "Formation Beyonce", reason: "Power", genre: "r&b" },
        { title: "God's Plan", artist: "Drake", spotifyQuery: "God's Plan Drake", reason: "Assured", genre: "hip-hop" },
        { title: "HUMBLE.", artist: "Kendrick Lamar", spotifyQuery: "HUMBLE Kendrick Lamar", reason: "Commanding", genre: "hip-hop" },
        { title: "I Will Survive", artist: "Gloria Gaynor", spotifyQuery: "I Will Survive Gloria Gaynor", reason: "Triumph", genre: "r&b" },
        { title: "Fearless", artist: "Taylor Swift", spotifyQuery: "Fearless Taylor Swift", reason: "Brave", genre: "pop" },
        { title: "Count on Me", artist: "Bruno Mars", spotifyQuery: "Count on Me Bruno Mars", reason: "Steady", genre: "pop" }
    ],
    stressed: [
        { title: "Three Little Birds", artist: "Bob Marley", spotifyQuery: "Three Little Birds Bob Marley", reason: "Reassurance", genre: "r&b" },
        { title: "Don't Worry Be Happy", artist: "Bobby McFerrin", spotifyQuery: "Don't Worry Be Happy McFerrin", reason: "Peace", genre: "pop" },
        { title: "Here Comes the Sun", artist: "The Beatles", spotifyQuery: "Here Comes the Sun Beatles", reason: "Relief", genre: "rock" },
        { title: "What a Wonderful World", artist: "Louis Armstrong", spotifyQuery: "Wonderful World Armstrong", reason: "Perspective", genre: "classical" },
        { title: "Shake It Out", artist: "Florence + the Machine", spotifyQuery: "Shake It Out Florence", reason: "Release", genre: "indie rock" },
        { title: "Dog Days Are Over", artist: "Florence + the Machine", spotifyQuery: "Dog Days Are Over Florence", reason: "Relief", genre: "indie rock" },
        { title: "Somewhere Only We Know", artist: "Keane", spotifyQuery: "Somewhere Only We Know Keane", reason: "Retreat", genre: "rock" },
        { title: "The Sound of Settling", artist: "Death Cab for Cutie", spotifyQuery: "Sound of Settling Death Cab", reason: "Release", genre: "indie rock" },
        { title: "Vienna", artist: "Billy Joel", spotifyQuery: "Vienna Billy Joel", reason: "Slow down", genre: "pop" },
        { title: "Easy", artist: "Son Lux", spotifyQuery: "Easy Son Lux", reason: "Unwind", genre: "indie pop" }
    ],
    excited: [
        { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", spotifyQuery: "Uptown Funk Mark Ronson", reason: "High energy", genre: "r&b" },
        { title: "Party Rock Anthem", artist: "LMFAO", spotifyQuery: "Party Rock Anthem LMFAO", reason: "Celebration", genre: "electronic" },
        { title: "Levitating", artist: "Dua Lipa", spotifyQuery: "Levitating Dua Lipa", reason: "Euphoria", genre: "pop" },
        { title: "Dynamite", artist: "BTS", spotifyQuery: "Dynamite BTS", reason: "Burst", genre: "pop" },
        { title: "Telephone", artist: "Lady Gaga", spotifyQuery: "Telephone Lady Gaga", reason: "Frenzy", genre: "pop" },
        { title: "Firework", artist: "Katy Perry", spotifyQuery: "Firework Katy Perry", reason: "Explode", genre: "pop" },
        { title: "Wake Me Up", artist: "Avicii", spotifyQuery: "Wake Me Up Avicii", reason: "Alive", genre: "electronic" },
        { title: "Don't You Worry Child", artist: "Swedish House Mafia", spotifyQuery: "Don't You Worry Child SHM", reason: "Release", genre: "electronic" },
        { title: "Jump", artist: "Kris Kross", spotifyQuery: "Jump Kris Kross", reason: "Fun", genre: "hip-hop" },
        { title: "Good as Hell", artist: "Lizzo", spotifyQuery: "Good as Hell Lizzo", reason: "Vibing", genre: "pop" }
    ],
    hopeful: [
        { title: "Brave", artist: "Sara Bareilles", spotifyQuery: "Brave Sara Bareilles", reason: "Courage", genre: "pop" },
        { title: "Beautiful Day", artist: "U2", spotifyQuery: "Beautiful Day U2", reason: "Fresh start", genre: "rock" },
        { title: "Rise Up", artist: "Andra Day", spotifyQuery: "Rise Up Andra Day", reason: "Uplift", genre: "r&b" },
        { title: "A Sky Full of Stars", artist: "Coldplay", spotifyQuery: "Sky Full of Stars Coldplay", reason: "Expansive", genre: "rock" },
        { title: "Somewhere Over the Rainbow", artist: "Israel Kamakawiwoʻole", spotifyQuery: "Over the Rainbow Israel", reason: "Hope", genre: "pop" },
        { title: "The Climb", artist: "Miley Cyrus", spotifyQuery: "The Climb Miley Cyrus", reason: "Progress", genre: "pop" },
        { title: "Something Just Like This", artist: "The Chainsmokers", spotifyQuery: "Something Just Like This Chainsmokers", reason: "Longing", genre: "electronic" },
        { title: "Counting Stars", artist: "OneRepublic", spotifyQuery: "Counting Stars OneRepublic", reason: "Dreaming", genre: "pop" },
        { title: "Let Her Go", artist: "Passenger", spotifyQuery: "Let Her Go Passenger", reason: "Bittersweet", genre: "indie pop" },
        { title: "Paradise", artist: "Coldplay", spotifyQuery: "Paradise Coldplay", reason: "Dreaming", genre: "rock" }
    ]
};

window.musicDatabase = musicDatabase;
