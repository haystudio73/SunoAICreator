/**
 * Background Service Worker (Manifest V3)
 * Configures the Chrome Side Panel to open on toolbar icon click and handles
 * fallback chrome.downloads requests when Subfolder Mode is used.
 */

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.error('[MetaVideoDL] Failed to set panel behavior:', err));
  }
});

// Ensure clicking the extension icon always opens the Side Panel
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab?.windowId) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (err) {
      console.error('[MetaVideoDL] Error opening side panel:', err);
    }
  }
});

// Listen for messages between Content Script and Side Panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'PING_SW') {
    sendResponse({ ok: true, timestamp: Date.now() });
    return false;
  }
  return false;
});

