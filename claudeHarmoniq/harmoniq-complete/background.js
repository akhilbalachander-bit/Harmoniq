// ============================================
// HARMONIQ BACKGROUND SERVICE WORKER
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('setupWizard.html')
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'playTrack') {
        chrome.tabs.create({
            url: `https://open.spotify.com/search/${encodeURIComponent(request.track.spotifyQuery)}`
        });
    }
});

console.log('Harmoniq background service worker loaded');
