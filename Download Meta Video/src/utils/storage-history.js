/**
 * Local Storage & Download History Manager (`storage-history.js`)
 * Persists:
 *  1. Current Video List state (items, custom filenames, selection, status) in localStorage
 *  2. Long-term Completed Download History (by video ID) in localStorage & chrome.storage.local
 *     so previously downloaded Meta.ai videos are recognized across sessions.
 */

const LS_VIDEO_LIST_KEY = 'meta_ai_dl_video_list_v1';
const LS_HISTORY_MAP_KEY = 'meta_ai_dl_history_map_v1';
const MAX_HISTORY_ENTRIES = 2000;

/**
 * Loads the persisted video list from localStorage
 * @returns {Array<object>}
 */
export function loadVideoListFromLocalStorage() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LS_VIDEO_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Reset transient 'downloading' or 'queued' states from an interrupted session back to 'idle'
    return parsed.map((item) => ({
      ...item,
      status:
        item.status === 'downloading' || item.status === 'queued'
          ? 'idle'
          : item.status || 'idle',
      progress: item.status === 'completed' ? 100 : 0
    }));
  } catch (err) {
    console.warn('[StorageHistory] Failed to load video list from localStorage:', err);
    return [];
  }
}

/**
 * Saves the current video list to localStorage
 * @param {Array<object>} items
 */
export function saveVideoListToLocalStorage(items) {
  try {
    if (typeof localStorage === 'undefined') return;
    const serializable = (items || []).map((item) => ({
      id: item.id,
      url: item.url,
      filename: item.filename,
      customFilename: item.customFilename || item.filename,
      finalFilename: item.finalFilename || null,
      host: item.host || 'scontent.xx.fbcdn.net',
      isFbCdn: Boolean(item.isFbCdn),
      expiresAt: item.expiresAt || null,
      width: item.width || null,
      height: item.height || null,
      duration: item.duration || null,
      poster: item.poster || null,
      discoveredAt: item.discoveredAt || Date.now(),
      downloadedAt: item.downloadedAt || null,
      selected: Boolean(item.selected),
      status: item.status || 'idle',
      progress: item.status === 'completed' ? 100 : item.progress || 0,
      loadedBytes: item.loadedBytes || 0,
      totalBytes: item.totalBytes || 0,
      error: item.error || null
    }));

    localStorage.setItem(LS_VIDEO_LIST_KEY, JSON.stringify(serializable));
  } catch (err) {
    console.warn('[StorageHistory] Failed to save video list to localStorage:', err);
  }
}

/**
 * Loads the persistent Download History map ({ [videoId]: HistoryEntry }) from localStorage
 * @returns {Record<string, object>}
 */
export function loadDownloadHistoryMap() {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(LS_HISTORY_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    console.warn('[StorageHistory] Failed to load download history map:', err);
    return {};
  }
}

/**
 * Records a completed video download into Local Storage history
 * @param {object} item - Completed video queue item
 * @param {string} [folderLabel] - Destination folder name
 * @returns {Record<string, object>} Updated history map
 */
export function recordCompletedDownloadInHistory(item, folderLabel = '') {
  if (!item || !item.id) return loadDownloadHistoryMap();

  try {
    const historyMap = loadDownloadHistoryMap();
    const now = Date.now();

    historyMap[item.id] = {
      id: item.id,
      originalFilename: item.filename,
      savedFilename: item.finalFilename || item.customFilename || item.filename,
      url: item.url,
      folderLabel: folderLabel || '',
      totalBytes: item.totalBytes || item.loadedBytes || 0,
      downloadedAt: now
    };

    // Trim oldest entries if exceeding MAX_HISTORY_ENTRIES
    const keys = Object.keys(historyMap);
    if (keys.length > MAX_HISTORY_ENTRIES) {
      const sorted = keys.sort(
        (a, b) => (historyMap[a]?.downloadedAt || 0) - (historyMap[b]?.downloadedAt || 0)
      );
      const toRemove = sorted.slice(0, keys.length - MAX_HISTORY_ENTRIES);
      toRemove.forEach((k) => delete historyMap[k]);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LS_HISTORY_MAP_KEY, JSON.stringify(historyMap));
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [LS_HISTORY_MAP_KEY]: historyMap });
    }

    return historyMap;
  } catch (err) {
    console.warn('[StorageHistory] Failed to record download history:', err);
    return loadDownloadHistoryMap();
  }
}

/**
 * Clears all saved download history from Local Storage
 */
export function clearDownloadHistoryStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LS_HISTORY_MAP_KEY);
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove(LS_HISTORY_MAP_KEY);
    }
  } catch (err) {
    console.warn('[StorageHistory] Failed to clear history:', err);
  }
}
