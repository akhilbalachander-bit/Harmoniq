// ============================================
// HARMONIQ CONFIGURATION
// ============================================

const HARMONIQ_CONFIG = {
    appName: 'Harmoniq',
    version: '4.2.0',
    playlistSize: 20,
    maxEmotionSelections: 3,
    journeyPhases: {
        validation: 0.30,
        transition: 0.40,
        destination: 0.30
    },
    generationDelay: 200
};

window.HARMONIQ_CONFIG = HARMONIQ_CONFIG;
