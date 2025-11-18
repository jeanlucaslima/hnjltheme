/**
 * HN Custom Skin - Background Service Worker
 * Handles extension lifecycle and future API calls
 */

console.log('HN Skin: Background service worker loaded');

/**
 * Handle extension installation and updates
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('HN Skin: Extension installed/updated', details.reason);

  if (details.reason === 'install') {
    console.log('HN Skin: First time installation');
    // TODO: Initialize default settings in chrome.storage
    // TODO: Optionally open welcome/onboarding page
  } else if (details.reason === 'update') {
    console.log('HN Skin: Extension updated to version', chrome.runtime.getManifest().version);
    // TODO: Handle migrations if needed
  }
});

/**
 * TODO: Add message handlers for communication with content scripts
 * Example: Fetching user CSS from a profile service API
 */
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === 'GET_USER_CSS') {
//     // Fetch CSS from backend API
//     // Return to content script
//   }
// });

/**
 * TODO: Add alarm handlers for periodic tasks
 * Example: Syncing user preferences from cloud
 */
// chrome.alarms.create('sync-preferences', { periodInMinutes: 60 });
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'sync-preferences') {
//     // Sync user preferences
//   }
// });
