/**
 * Side Panel Controller (`sidepanel.js`)
 * Coordinates:
 *  - Active tab HTML/DOM scanning & live MutationObserver updates
 *  - Raw HTML snippet parsing (e.g., <video src="https://scontent.xx.fbcdn.net/...mp4">)
 *  - Destination Folder selection (File System Access API + Chrome Downloads Subfolder fallback)
 *  - Select All / Deselect All (Master checkbox + explicit buttons + Shift+Click)
 *  - Per-clip inline save filename editing AND Bulk Auto-Name All Selected (order number top -> bottom)
 *  - Saving & restoring video list + completed Download History in Local Storage
 *  - Multi-filter tabs (All, Selected, Unselected, Pending/New, Downloaded/History, Renamed, Failed)
 *  - Sequential Auto-Download Queue (File-by-File)
 */

import {
  ensureMp4Filename,
  extractVideosFromHtmlString,
  formatBytes,
  generateAutoFilename,
  isUrlExpired
} from '../utils/url-parser.js';
import {
  ensureDirectoryPermission,
  loadSavedDirectoryHandle,
  pickSaveDirectory
} from '../utils/folder-manager.js';
import {
  clearDownloadHistoryStorage,
  loadDownloadHistoryMap,
  loadVideoListFromLocalStorage,
  recordCompletedDownloadInHistory,
  saveVideoListToLocalStorage
} from '../utils/storage-history.js';
import { SequentialDownloadQueue } from '../utils/queue-engine.js';

const SAMPLE_META_HTML = `<video class="h-full w-full object-contain" playsinline="" controlslist="nodownload" loop="" src="https://scontent.xx.fbcdn.net/v/t39.105495-1/902044508_1849482556051902_4641685168229180870_n.mp4?_nc_ht=scontent.xx.fbcdn.net&amp;_nc_cat=106&amp;_nc_ohc=-pAZN6jli1EQ7kNvwHULcyB&amp;sdl=0&amp;ccb=14-4&amp;oh=00_AQTto52-DZkV6zT_n-5LCEhlqzaJTfq0MH3yZ_Hl4WcRHg&amp;oe=6AF9E9F0&amp;_nc_sid=a21977"></video>`;

// Application State
const state = {
  items: [], // Array of VideoQueueItem
  historyMap: {}, // { [videoId]: { id, originalFilename, savedFilename, downloadedAt, ... } }
  dirHandle: null,
  saveMode: 'folder_picker', // 'folder_picker' | 'subfolder'
  subfolderName: 'Meta_AI_Videos',
  conflictAction: 'uniquify', // 'uniquify' | 'skip' | 'overwrite'
  delayMs: 500,

  // Auto-Rename Selected (Top -> Bottom) settings
  autoNamePrefix: 'clip',
  autoNameFormat: 'prefix_num', // 'prefix_num' | 'num_prefix' | 'num_only' | 'num_original'
  autoNameStart: 1,
  autoNamePad: 2,
  autoSyncOrder: false,

  // List Filtering
  activeFilter: 'all', // 'all' | 'selected' | 'unselected' | 'pending' | 'downloaded' | 'renamed' | 'failed'
  searchQuery: '',
  lastClickedIndex: null
};

// DOM Elements
const els = {
  historyCountBadge: document.getElementById('historyCountBadge'),
  pageStatusBadge: document.getElementById('pageStatusBadge'),
  scanPageBtn: document.getElementById('scanPageBtn'),
  togglePasteDrawerBtn: document.getElementById('togglePasteDrawerBtn'),
  autoScanCheckbox: document.getElementById('autoScanCheckbox'),
  pasteHtmlDrawer: document.getElementById('pasteHtmlDrawer'),
  rawHtmlInput: document.getElementById('rawHtmlInput'),
  parseHtmlBtn: document.getElementById('parseHtmlBtn'),
  loadSampleBtn: document.getElementById('loadSampleBtn'),

  saveModeRadios: document.querySelectorAll('input[name="saveMode"]'),
  folderPickerPanel: document.getElementById('folderPickerPanel'),
  subfolderPanel: document.getElementById('subfolderPanel'),
  selectedFolderBox: document.getElementById('selectedFolderBox'),
  folderNameText: document.getElementById('folderNameText'),
  folderPermText: document.getElementById('folderPermText'),
  pickFolderBtn: document.getElementById('pickFolderBtn'),
  subfolderInput: document.getElementById('subfolderInput'),

  toggleAdvancedBtn: document.getElementById('toggleAdvancedBtn'),
  advancedSettingsPanel: document.getElementById('advancedSettingsPanel'),
  conflictActionSelect: document.getElementById('conflictActionSelect'),
  delayMsInput: document.getElementById('delayMsInput'),

  // Auto-Rename Selected Controls
  autoSyncOrderCheckbox: document.getElementById('autoSyncOrderCheckbox'),
  autoNamePrefixInput: document.getElementById('autoNamePrefixInput'),
  autoNameFormatSelect: document.getElementById('autoNameFormatSelect'),
  autoNameStartInput: document.getElementById('autoNameStartInput'),
  autoNamePadSelect: document.getElementById('autoNamePadSelect'),
  applyAutoNameBtn: document.getElementById('applyAutoNameBtn'),
  resetAllNamesBtn: document.getElementById('resetAllNamesBtn'),

  // Selection & Filter Toolbar Controls
  masterSelectCheckbox: document.getElementById('masterSelectCheckbox'),
  selectAllBtn: document.getElementById('selectAllBtn'),
  selectNoneBtn: document.getElementById('selectNoneBtn'),
  selectInvertBtn: document.getElementById('selectInvertBtn'),
  selectPendingBtn: document.getElementById('selectPendingBtn'),
  filterPillsBar: document.getElementById('filterPillsBar'),
  filterCountAll: document.getElementById('filterCountAll'),
  filterCountSelected: document.getElementById('filterCountSelected'),
  filterCountUnselected: document.getElementById('filterCountUnselected'),
  filterCountPending: document.getElementById('filterCountPending'),
  filterCountDownloaded: document.getElementById('filterCountDownloaded'),
  filterCountRenamed: document.getElementById('filterCountRenamed'),
  filterCountFailed: document.getElementById('filterCountFailed'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  clearListBtn: document.getElementById('clearListBtn'),
  searchFilterInput: document.getElementById('searchFilterInput'),

  totalCountText: document.getElementById('totalCountText'),
  selectedCountText: document.getElementById('selectedCountText'),
  completedCountText: document.getElementById('completedCountText'),

  videoListContainer: document.getElementById('videoListContainer'),
  emptyState: document.getElementById('emptyState'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateDesc: document.getElementById('emptyStateDesc'),

  queueStatusLabel: document.getElementById('queueStatusLabel'),
  queueCounterLabel: document.getElementById('queueCounterLabel'),
  overallProgressBar: document.getElementById('overallProgressBar'),

  startQueueBtn: document.getElementById('startQueueBtn'),
  pauseQueueBtn: document.getElementById('pauseQueueBtn'),
  resumeQueueBtn: document.getElementById('resumeQueueBtn'),
  skipCurrentBtn: document.getElementById('skipCurrentBtn'),
  stopQueueBtn: document.getElementById('stopQueueBtn'),
  retryFailedBtn: document.getElementById('retryFailedBtn')
};

const queueEngine = new SequentialDownloadQueue({
  onStateChange: () => {
    syncCompletedItemsToHistory();
    updateCardsProgressInPlace();
    renderFooterAndCounters();
  }
});

// Initialize Side Panel
async function init() {
  await loadUserSettings();
  restoreStateFromLocalStorage();
  await restoreSavedFolderHandle();
  bindEvents();
  renderFolderStatus();
  renderVideoList();
  renderFooterAndCounters();

  // Attempt initial scan of active tab
  await scanActiveTab(true);
}

/**
 * Restores saved video list and download history map from Local Storage
 */
function restoreStateFromLocalStorage() {
  state.historyMap = loadDownloadHistoryMap();
  const savedList = loadVideoListFromLocalStorage();

  state.items = savedList.map((item) => {
    const histEntry = state.historyMap[item.id] || null;
    return {
      ...item,
      inHistory: Boolean(histEntry) || item.status === 'completed',
      downloadedAt: item.downloadedAt || histEntry?.downloadedAt || null
    };
  });
}

/**
 * Checks if any items newly finished downloading and records them into Local Storage history
 */
function syncCompletedItemsToHistory() {
  const folderLabel =
    state.saveMode === 'folder_picker'
      ? state.dirHandle?.name || 'Local Folder'
      : `Downloads/${state.subfolderName}`;

  let historyUpdated = false;
  for (const item of state.items) {
    if (item.status === 'completed' && !item.inHistory) {
      item.inHistory = true;
      item.downloadedAt = Date.now();
      state.historyMap = recordCompletedDownloadInHistory(item, folderLabel);
      historyUpdated = true;
    }
  }

  // Persist current list state whenever queue state changes
  saveVideoListToLocalStorage(state.items);

  // If user is currently viewing a status-sensitive filter (e.g. Pending or Downloaded), re-render list when an item finishes
  if (
    historyUpdated &&
    (state.activeFilter === 'pending' ||
      state.activeFilter === 'downloaded' ||
      state.activeFilter === 'failed')
  ) {
    renderVideoList();
  }
}

async function loadUserSettings() {
  try {
    const stored = await chrome.storage.local.get([
      'saveMode',
      'subfolderName',
      'conflictAction',
      'delayMs',
      'autoNamePrefix',
      'autoNameFormat',
      'autoNameStart',
      'autoNamePad',
      'autoSyncOrder'
    ]);

    if (stored.saveMode) state.saveMode = stored.saveMode;
    if (stored.subfolderName) state.subfolderName = stored.subfolderName;
    if (stored.conflictAction) state.conflictAction = stored.conflictAction;
    if (typeof stored.delayMs === 'number') state.delayMs = stored.delayMs;

    if (typeof stored.autoNamePrefix === 'string') state.autoNamePrefix = stored.autoNamePrefix;
    if (stored.autoNameFormat) state.autoNameFormat = stored.autoNameFormat;
    if (typeof stored.autoNameStart === 'number') state.autoNameStart = stored.autoNameStart;
    if (typeof stored.autoNamePad === 'number') state.autoNamePad = stored.autoNamePad;
    if (typeof stored.autoSyncOrder === 'boolean') state.autoSyncOrder = stored.autoSyncOrder;

    // Sync inputs
    els.saveModeRadios.forEach((r) => {
      r.checked = r.value === state.saveMode;
    });
    updateSaveModeVisibility();
    els.subfolderInput.value = state.subfolderName;
    els.conflictActionSelect.value = state.conflictAction;
    els.delayMsInput.value = String(state.delayMs);

    els.autoNamePrefixInput.value = state.autoNamePrefix;
    els.autoNameFormatSelect.value = state.autoNameFormat;
    els.autoNameStartInput.value = String(state.autoNameStart);
    els.autoNamePadSelect.value = String(state.autoNamePad);
    els.autoSyncOrderCheckbox.checked = state.autoSyncOrder;
  } catch (err) {
    console.warn('[SidePanel] Could not load settings:', err);
  }
}

function saveUserSettings() {
  chrome.storage.local.set({
    saveMode: state.saveMode,
    subfolderName: state.subfolderName,
    conflictAction: state.conflictAction,
    delayMs: state.delayMs,
    autoNamePrefix: state.autoNamePrefix,
    autoNameFormat: state.autoNameFormat,
    autoNameStart: state.autoNameStart,
    autoNamePad: state.autoNamePad,
    autoSyncOrder: state.autoSyncOrder
  });
}

async function restoreSavedFolderHandle() {
  const savedHandle = await loadSavedDirectoryHandle();
  if (savedHandle) {
    state.dirHandle = savedHandle;
  }
}

async function renderFolderStatus() {
  if (!state.dirHandle) {
    els.selectedFolderBox.classList.remove('folder-ready');
    els.folderNameText.textContent = 'No folder selected yet';
    els.folderPermText.textContent = 'Click "Select Folder..." to choose save directory';
    return;
  }

  const perm = await ensureDirectoryPermission(state.dirHandle, false);
  els.folderNameText.textContent = `📁 ${state.dirHandle.name}`;
  if (perm === 'granted') {
    els.selectedFolderBox.classList.add('folder-ready');
    els.folderPermText.textContent = 'Write access granted • Ready for auto-download';
  } else {
    els.selectedFolderBox.classList.remove('folder-ready');
    els.folderPermText.textContent = 'Saved folder (will verify write access on Start)';
  }
}

function updateSaveModeVisibility() {
  if (state.saveMode === 'folder_picker') {
    els.folderPickerPanel.classList.remove('hidden');
    els.subfolderPanel.classList.add('hidden');
  } else {
    els.folderPickerPanel.classList.add('hidden');
    els.subfolderPanel.classList.remove('hidden');
  }
}

/**
 * Checks whether an item matches a given filter tab
 * @param {object} item
 * @param {string} filterKey
 * @returns {boolean}
 */
export function matchesFilterTab(item, filterKey) {
  const isDownloaded = item.status === 'completed' || Boolean(item.inHistory);
  const isRenamed =
    ensureMp4Filename(item.customFilename || item.filename, item.filename) !== item.filename;

  switch (filterKey) {
    case 'selected':
      return Boolean(item.selected);
    case 'unselected':
      return !item.selected;
    case 'pending':
      return !isDownloaded && item.status !== 'failed';
    case 'downloaded':
      return isDownloaded;
    case 'renamed':
      return isRenamed;
    case 'failed':
      return item.status === 'failed';
    case 'all':
    default:
      return true;
  }
}

/**
 * Returns items matching both the active filter pill AND the search query while keeping top-to-bottom order
 */
function getFilteredItems() {
  const query = state.searchQuery.trim().toLowerCase();
  return state.items.filter((item) => {
    if (!matchesFilterTab(item, state.activeFilter)) {
      return false;
    }
    if (!query) return true;
    const custom = (item.customFilename || '').toLowerCase();
    return (
      item.filename.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      custom.includes(query)
    );
  });
}

/**
 * Applies Auto-New-Name to all currently SELECTED items in top-to-bottom list order
 * @param {boolean} [onlyIfAutoSync=false]
 */
function applyAutoNameToSelected(onlyIfAutoSync = false) {
  if (onlyIfAutoSync && !state.autoSyncOrder) return;

  const startNum = Number.isFinite(state.autoNameStart) ? state.autoNameStart : 1;
  const padDigits = Number.isFinite(state.autoNamePad) ? state.autoNamePad : 2;

  let orderCounter = 0;
  for (const item of state.items) {
    if (item.selected) {
      const currentOrderNum = startNum + orderCounter;
      item.customFilename = generateAutoFilename({
        item,
        orderNumber: currentOrderNum,
        prefix: state.autoNamePrefix,
        format: state.autoNameFormat,
        padDigits
      });
      orderCounter++;
    }
  }
  saveVideoListToLocalStorage(state.items);
}

/**
 * Resets all clips back to their original .mp4 filenames
 */
function resetAllClipNames() {
  for (const item of state.items) {
    item.customFilename = item.filename;
  }
  saveVideoListToLocalStorage(state.items);
  renderVideoList();
  renderFooterAndCounters();
}

/**
 * Merges newly discovered video metadata into state.items without losing selection, customFilename, or history state
 * @param {Array<object>} incomingVideos
 */
function mergeDiscoveredVideos(incomingVideos) {
  if (!Array.isArray(incomingVideos) || incomingVideos.length === 0) return 0;

  let addedCount = 0;
  const existingMap = new Map(state.items.map((item) => [item.id, item]));

  for (const raw of incomingVideos) {
    if (!raw || !raw.id || !raw.url) continue;

    const existing = existingMap.get(raw.id);
    const historyEntry = state.historyMap[raw.id] || null;

    if (!existing) {
      const newItem = {
        ...raw,
        customFilename: historyEntry?.savedFilename || raw.filename,
        selected: !historyEntry, // Default: auto-select new videos, leave already-downloaded history items unselected
        status: historyEntry ? 'completed' : 'idle',
        inHistory: Boolean(historyEntry),
        downloadedAt: historyEntry?.downloadedAt || null,
        progress: historyEntry ? 100 : 0,
        loadedBytes: 0,
        totalBytes: historyEntry?.totalBytes || 0,
        error: null
      };
      state.items.push(newItem);
      existingMap.set(newItem.id, newItem);
      addedCount++;
    } else {
      // Refresh signed CDN URL & metadata while preserving customFilename/status/selection
      existing.url = raw.url;
      existing.expiresAt = raw.expiresAt || existing.expiresAt;
      existing.width = raw.width || existing.width;
      existing.height = raw.height || existing.height;
      existing.poster = raw.poster || existing.poster;
      if (historyEntry) {
        existing.inHistory = true;
        existing.downloadedAt = existing.downloadedAt || historyEntry.downloadedAt;
      }
    }
  }

  if (addedCount > 0 && state.autoSyncOrder) {
    applyAutoNameToSelected(true);
  }

  saveVideoListToLocalStorage(state.items);
  renderVideoList();
  renderFooterAndCounters();
  return addedCount;
}

/**
 * Queries the active tab for .mp4 videos; injects content-scanner.js if not yet injected
 */
async function scanActiveTab(silent = false) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      if (!silent) setStatusBadge('No Active Tab', false);
      return;
    }

    setStatusBadge('Scanning...', true);

    // First try messaging existing content script
    let response = await sendMessageToTab(tab.id, { type: 'SCAN_PAGE' });

    // If content script wasn't running yet, inject it dynamically
    if (!response && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/content-scanner.js']
        });
        response = await sendMessageToTab(tab.id, { type: 'SCAN_PAGE' });
      } catch (injectErr) {
        console.warn('[SidePanel] Dynamic script injection skipped:', injectErr.message);
      }
    }

    if (response && Array.isArray(response.videos)) {
      const added = mergeDiscoveredVideos(response.videos);
      setStatusBadge(
        `${state.items.length} video${state.items.length === 1 ? '' : 's'} (${added} new)`,
        state.items.length > 0
      );
    } else if (!silent) {
      setStatusBadge('0 videos on tab', false);
    }
  } catch (err) {
    console.warn('[SidePanel] Scan error:', err);
    if (!silent) setStatusBadge('Scan Error', false);
  }
}

function sendMessageToTab(tabId, payload) {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, payload, (res) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(res || null);
      });
    } catch {
      resolve(null);
    }
  });
}

function setStatusBadge(text, isActive = false) {
  els.pageStatusBadge.textContent = text;
  els.pageStatusBadge.classList.toggle('status-active', isActive);
}

/**
 * Computes a Map<videoId, number> of 1-based top-to-bottom order numbers for selected items
 */
function getSelectedOrderMap() {
  const orderMap = new Map();
  let seq = 1;
  for (const item of state.items) {
    if (item.selected) {
      orderMap.set(item.id, seq++);
    }
  }
  return orderMap;
}

/**
 * Renders the list of discovered video cards matching the active filter & search query
 */
function renderVideoList() {
  const filteredItems = getFilteredItems();
  const selectedOrderMap = getSelectedOrderMap();

  // Clear existing cards (keep emptyState element)
  Array.from(els.videoListContainer.querySelectorAll('.video-card')).forEach((el) => el.remove());

  if (filteredItems.length === 0) {
    els.emptyState.classList.remove('hidden');
    if (state.items.length > 0) {
      els.emptyStateTitle.textContent = `No clips match the "${state.activeFilter}" filter`;
      els.emptyStateDesc.innerHTML =
        'Switch the filter tab above to <strong>All</strong> or clear the search box to see all clips.';
    } else {
      els.emptyStateTitle.textContent = 'No .mp4 videos detected yet';
      els.emptyStateDesc.innerHTML =
        'Open <strong>meta.ai</strong> and click <strong>Scan Page HTML</strong>, scroll through your video feed, or click <strong>Paste HTML</strong> to extract <code>.mp4</code> links.';
    }
    return;
  }
  els.emptyState.classList.add('hidden');

  filteredItems.forEach((item, idx) => {
    const selectedOrder = selectedOrderMap.get(item.id) || null;
    const effectiveSaveName = ensureMp4Filename(item.customFilename || item.filename, item.filename);
    const isRenamed = effectiveSaveName !== item.filename;

    const card = document.createElement('div');
    card.dataset.cardId = item.id;
    card.className = [
      'video-card',
      item.selected ? 'is-selected' : '',
      item.status === 'downloading' ? 'is-downloading' : '',
      item.status === 'completed' ? 'is-completed' : '',
      item.status === 'failed' ? 'is-failed' : ''
    ]
      .filter(Boolean)
      .join(' ');

    const expired = isUrlExpired(item.expiresAt);
    const statusLabelMap = {
      idle: 'Ready',
      queued: 'Queued',
      downloading: `Downloading ${item.progress || 0}%`,
      completed: 'Saved ✓',
      failed: 'Failed',
      skipped: 'Skipped'
    };

    const bytesInfo =
      item.loadedBytes > 0
        ? item.totalBytes > 0
          ? `${formatBytes(item.loadedBytes)} / ${formatBytes(item.totalBytes)}`
          : `${formatBytes(item.loadedBytes)}`
        : '';

    const orderTagText = selectedOrder
      ? `#${String(selectedOrder).padStart(2, '0')}`
      : '—';

    const historyTimeStr = item.downloadedAt
      ? new Date(item.downloadedAt).toLocaleString()
      : '';

    card.innerHTML = `
      <div class="card-main">
        <input
          type="checkbox"
          class="card-checkbox"
          data-id="${escapeAttr(item.id)}"
          data-idx="${idx}"
          ${item.selected ? 'checked' : ''}
        />
        <div class="video-thumb-wrap" title="Hover to preview video">
          <video
            src="${escapeAttr(item.url)}"
            preload="metadata"
            muted
            loop
            playsinline
          ></video>
          <span class="index-badge">${idx + 1}</span>
        </div>
        <div class="card-details">
          <div class="card-rename-row">
            <span
              class="rename-order-tag ${selectedOrder ? '' : 'is-unselected'}"
              title="${selectedOrder ? `Download Queue Order #${selectedOrder} (Top to Bottom)` : 'Not selected'}"
            >${orderTagText}</span>
            <input
              type="text"
              class="card-filename-input ${isRenamed ? 'is-renamed' : ''}"
              data-id="${escapeAttr(item.id)}"
              value="${escapeAttr(effectiveSaveName)}"
              placeholder="${escapeAttr(item.filename)}"
              title="Edit save filename for this clip (.mp4 is appended automatically)"
            />
            <button
              class="icon-btn btn-reset-name ${isRenamed ? '' : 'hidden'}"
              data-id="${escapeAttr(item.id)}"
              title="Reset to original filename: ${escapeAttr(item.filename)}"
            >↺</button>
          </div>
          <div class="card-meta">
            <span class="badge-status badge-${item.status}">${statusLabelMap[item.status] || item.status}</span>
            ${
              item.inHistory
                ? `<span class="badge-history" title="Saved in Local Storage History${historyTimeStr ? ` (${escapeAttr(historyTimeStr)})` : ''}">🕒 History</span>`
                : ''
            }
            <span class="orig-name-hint" title="Original CDN file: ${escapeAttr(item.filename)}">Orig: ${escapeHtml(item.filename)}</span>
            ${item.width && item.height ? `<span>${item.width}×${item.height}</span>` : ''}
            ${expired ? `<span style="color:#f87171" title="Signed URL oe timestamp expired; rescan page">⚠️ Expired</span>` : ''}
            <span class="card-bytes-text">${bytesInfo}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="icon-btn btn-locate" data-id="${escapeAttr(item.id)}" title="Scroll to & highlight video on page">🎯</button>
          <button class="icon-btn btn-copy" data-url="${escapeAttr(item.url)}" title="Copy decoded .mp4 URL">🔗</button>
          <button class="icon-btn btn-dl-single" data-id="${escapeAttr(item.id)}" title="Download this clip immediately">⬇️</button>
        </div>
      </div>
      <div class="card-progress-row ${item.status !== 'idle' || item.error ? '' : 'hidden'}">
        <div class="item-progress-track">
          <div class="item-progress-fill" style="width: ${item.progress || 0}%"></div>
        </div>
        <div class="card-error-text ${item.error ? '' : 'hidden'}">${escapeHtml(item.error || '')}</div>
      </div>
    `;

    // Hover to preview video
    const videoEl = card.querySelector('video');
    const thumbWrap = card.querySelector('.video-thumb-wrap');
    if (videoEl && thumbWrap) {
      thumbWrap.addEventListener('mouseenter', () => {
        videoEl.play().catch(() => {});
      });
      thumbWrap.addEventListener('mouseleave', () => {
        videoEl.pause();
      });
    }

    els.videoListContainer.appendChild(card);
  });
}

/**
 * Updates progress bars & status badges in-place during active downloads so video previews
 * and focused filename inputs are never interrupted.
 */
function updateCardsProgressInPlace() {
  const statusLabelMap = {
    idle: 'Ready',
    queued: 'Queued',
    downloading: 'Downloading',
    completed: 'Saved ✓',
    failed: 'Failed',
    skipped: 'Skipped'
  };

  for (const item of state.items) {
    const card = els.videoListContainer.querySelector(
      `.video-card[data-card-id="${CSS.escape(item.id)}"]`
    );
    if (!card) continue;

    card.classList.toggle('is-downloading', item.status === 'downloading');
    card.classList.toggle('is-completed', item.status === 'completed');
    card.classList.toggle('is-failed', item.status === 'failed');

    const badge = card.querySelector('.badge-status');
    if (badge) {
      badge.className = `badge-status badge-${item.status}`;
      badge.textContent =
        item.status === 'downloading'
          ? `Downloading ${item.progress || 0}%`
          : statusLabelMap[item.status] || item.status;
    }

    const bytesEl = card.querySelector('.card-bytes-text');
    if (bytesEl) {
      bytesEl.textContent =
        item.loadedBytes > 0
          ? item.totalBytes > 0
            ? `${formatBytes(item.loadedBytes)} / ${formatBytes(item.totalBytes)}`
            : `${formatBytes(item.loadedBytes)}`
          : '';
    }

    const progRow = card.querySelector('.card-progress-row');
    const progFill = card.querySelector('.item-progress-fill');
    const errEl = card.querySelector('.card-error-text');

    if (progRow) {
      progRow.classList.toggle('hidden', item.status === 'idle' && !item.error);
    }
    if (progFill) {
      progFill.style.width = `${item.progress || 0}%`;
    }
    if (errEl) {
      errEl.textContent = item.error || '';
      errEl.classList.toggle('hidden', !item.error);
    }
  }
}

/**
 * Updates counters, filter pill counts, history badge, master Select All checkbox state, overall progress bar, and queue buttons
 */
function renderFooterAndCounters() {
  const total = state.items.length;
  const selectedItems = state.items.filter((i) => i.selected);
  const selectedCount = selectedItems.length;
  const unselectedCount = total - selectedCount;
  const completedCount = state.items.filter((i) => i.status === 'completed' || i.inHistory).length;
  const pendingCount = state.items.filter(
    (i) => i.status !== 'completed' && !i.inHistory && i.status !== 'failed'
  ).length;
  const renamedCount = state.items.filter(
    (i) => ensureMp4Filename(i.customFilename || i.filename, i.filename) !== i.filename
  ).length;
  const failedCount = state.items.filter((i) => i.status === 'failed').length;

  const historyTotalCount = Object.keys(state.historyMap || {}).length;
  els.historyCountBadge.textContent = `🕒 History: ${historyTotalCount}`;

  els.totalCountText.textContent = String(total);
  els.selectedCountText.textContent = String(selectedCount);
  els.completedCountText.textContent = String(completedCount);

  // Update Filter Pill Badges
  els.filterCountAll.textContent = String(total);
  els.filterCountSelected.textContent = String(selectedCount);
  els.filterCountUnselected.textContent = String(unselectedCount);
  els.filterCountPending.textContent = String(pendingCount);
  els.filterCountDownloaded.textContent = String(completedCount);
  els.filterCountRenamed.textContent = String(renamedCount);
  els.filterCountFailed.textContent = String(failedCount);

  // Sync Master Select All Checkbox state (checked, indeterminate, or unchecked)
  const visibleItems = getFilteredItems();
  const visibleSelectedCount = visibleItems.filter((i) => i.selected).length;
  if (visibleItems.length === 0) {
    els.masterSelectCheckbox.checked = false;
    els.masterSelectCheckbox.indeterminate = false;
  } else if (visibleSelectedCount === visibleItems.length) {
    els.masterSelectCheckbox.checked = true;
    els.masterSelectCheckbox.indeterminate = false;
  } else if (visibleSelectedCount > 0) {
    els.masterSelectCheckbox.checked = false;
    els.masterSelectCheckbox.indeterminate = true;
  } else {
    els.masterSelectCheckbox.checked = false;
    els.masterSelectCheckbox.indeterminate = false;
  }

  // Calculate overall queue progress among selected items
  const finishedSelected = selectedItems.filter(
    (i) => i.status === 'completed' || i.status === 'skipped' || i.status === 'failed'
  ).length;
  const activeItem = selectedItems.find((i) => i.status === 'downloading');
  const activeFraction = activeItem ? (activeItem.progress || 0) / 100 : 0;
  const overallPercent =
    selectedCount > 0
      ? Math.min(100, Math.round(((finishedSelected + activeFraction) / selectedCount) * 100))
      : 0;

  els.overallProgressBar.style.width = `${overallPercent}%`;
  els.queueCounterLabel.textContent = `${finishedSelected} / ${selectedCount}`;

  if (queueEngine.isRunning) {
    if (queueEngine.isPaused) {
      els.queueStatusLabel.textContent = '⏸ Queue Paused';
    } else if (activeItem) {
      const activeSaveName = ensureMp4Filename(
        activeItem.customFilename || activeItem.filename,
        activeItem.filename
      );
      els.queueStatusLabel.textContent = `⬇ Saving: ${activeSaveName} (${activeItem.progress || 0}%)`;
    } else {
      els.queueStatusLabel.textContent = '⏳ Preparing next file in queue...';
    }
  } else if (selectedCount === 0) {
    els.queueStatusLabel.textContent = 'Queue Idle — Select videos to download';
  } else if (finishedSelected === selectedCount && selectedCount > 0) {
    els.queueStatusLabel.textContent = `✅ Queue Finished (${completedCount} saved${failedCount ? `, ${failedCount} failed` : ''})`;
  } else {
    els.queueStatusLabel.textContent = `Ready — ${selectedCount} video${selectedCount === 1 ? '' : 's'} queued for sequential download`;
  }

  // Toggle buttons based on queue state
  els.startQueueBtn.classList.toggle('hidden', queueEngine.isRunning);
  els.startQueueBtn.disabled = selectedCount === 0;

  els.pauseQueueBtn.classList.toggle('hidden', !queueEngine.isRunning || queueEngine.isPaused);
  els.resumeQueueBtn.classList.toggle('hidden', !queueEngine.isRunning || !queueEngine.isPaused);
  els.skipCurrentBtn.classList.toggle('hidden', !queueEngine.isRunning);
  els.stopQueueBtn.classList.toggle('hidden', !queueEngine.isRunning);
  els.retryFailedBtn.classList.toggle('hidden', queueEngine.isRunning || failedCount === 0);
}

/**
 * Ensures destination folder is ready before starting downloads
 */
async function ensureDestinationReady() {
  if (state.saveMode === 'subfolder') {
    return true;
  }

  if (!state.dirHandle) {
    try {
      const picked = await pickSaveDirectory();
      if (!picked) return false;
      state.dirHandle = picked;
      await renderFolderStatus();
    } catch (err) {
      if (err?.name !== 'AbortError') {
        alert(`Could not select folder: ${err.message}`);
      }
      return false;
    }
  }

  const perm = await ensureDirectoryPermission(state.dirHandle, true);
  await renderFolderStatus();
  if (perm !== 'granted') {
    alert('Write permission to the selected folder was not granted.');
    return false;
  }
  return true;
}

async function handleStartQueue() {
  const hasSelected = state.items.some((i) => i.selected);
  if (!hasSelected) return;

  const ready = await ensureDestinationReady();
  if (!ready) return;

  state.items.forEach((item) => {
    item.customFilename = ensureMp4Filename(item.customFilename || item.filename, item.filename);
  });

  const anyPendingOrIdle = state.items.some(
    (i) => i.selected && (i.status === 'idle' || i.status === 'queued' || i.status === 'failed')
  );
  if (!anyPendingOrIdle) {
    state.items.forEach((i) => {
      if (i.selected) {
        i.status = 'idle';
        i.progress = 0;
        i.error = null;
      }
    });
  }

  saveVideoListToLocalStorage(state.items);

  await queueEngine.startQueue(state.items, {
    saveMode: state.saveMode,
    dirHandle: state.dirHandle,
    subfolderName: state.subfolderName,
    conflictAction: state.conflictAction,
    namingPattern: 'original',
    customPrefix: state.autoNamePrefix,
    delayMs: state.delayMs,
    maxRetries: 2
  });
}

async function handleDownloadSingle(videoId) {
  const item = state.items.find((i) => i.id === videoId);
  if (!item) return;

  const ready = await ensureDestinationReady();
  if (!ready) return;

  item.customFilename = ensureMp4Filename(item.customFilename || item.filename, item.filename);
  item.targetFilename = item.customFilename;

  await queueEngine.processSingleItem(item, state.items, {
    saveMode: state.saveMode,
    dirHandle: state.dirHandle,
    subfolderName: state.subfolderName,
    conflictAction: state.conflictAction,
    namingPattern: 'original',
    customPrefix: state.autoNamePrefix,
    delayMs: 0,
    maxRetries: 1
  });
}

function bindEvents() {
  // Scan button
  els.scanPageBtn.addEventListener('click', () => scanActiveTab(false));

  // Toggle Paste HTML drawer
  els.togglePasteDrawerBtn.addEventListener('click', () => {
    els.pasteHtmlDrawer.classList.toggle('hidden');
  });

  // Insert Sample Meta.ai <video> HTML
  els.loadSampleBtn.addEventListener('click', () => {
    els.rawHtmlInput.value = SAMPLE_META_HTML;
  });

  // Parse pasted HTML source
  els.parseHtmlBtn.addEventListener('click', () => {
    const rawHtml = els.rawHtmlInput.value.trim();
    if (!rawHtml) return;
    const extracted = extractVideosFromHtmlString(rawHtml);
    const added = mergeDiscoveredVideos(extracted);
    setStatusBadge(`Parsed ${extracted.length} link(s) (+${added} new)`, extracted.length > 0);
  });

  // Auto-scan toggle
  els.autoScanCheckbox.addEventListener('change', async () => {
    const enabled = els.autoScanCheckbox.checked;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      sendMessageToTab(tab.id, { type: 'SET_AUTO_SCAN', enabled });
    }
  });

  // Save mode radio buttons
  els.saveModeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      state.saveMode = radio.value;
      updateSaveModeVisibility();
      saveUserSettings();
    });
  });

  // Pick folder button (Native OS Folder Picker)
  els.pickFolderBtn.addEventListener('click', async () => {
    try {
      const handle = await pickSaveDirectory();
      if (handle) {
        state.dirHandle = handle;
        await renderFolderStatus();
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        alert(`Folder Picker Error: ${err.message}`);
      }
    }
  });

  // Subfolder & Advanced Settings inputs
  els.subfolderInput.addEventListener('input', () => {
    state.subfolderName = els.subfolderInput.value.trim() || 'Meta_AI_Videos';
    saveUserSettings();
  });

  els.toggleAdvancedBtn.addEventListener('click', () => {
    els.advancedSettingsPanel.classList.toggle('hidden');
  });

  els.conflictActionSelect.addEventListener('change', () => {
    state.conflictAction = els.conflictActionSelect.value;
    saveUserSettings();
  });

  els.delayMsInput.addEventListener('change', () => {
    state.delayMs = Math.max(0, parseInt(els.delayMsInput.value || '500', 10) || 0);
    saveUserSettings();
  });

  // Auto-Rename Selected (Top -> Bottom) Controls
  els.autoNamePrefixInput.addEventListener('input', () => {
    state.autoNamePrefix = els.autoNamePrefixInput.value;
    saveUserSettings();
    if (state.autoSyncOrder) {
      applyAutoNameToSelected(true);
      renderVideoList();
      renderFooterAndCounters();
    }
  });

  els.autoNameFormatSelect.addEventListener('change', () => {
    state.autoNameFormat = els.autoNameFormatSelect.value;
    saveUserSettings();
    if (state.autoSyncOrder) {
      applyAutoNameToSelected(true);
      renderVideoList();
      renderFooterAndCounters();
    }
  });

  els.autoNameStartInput.addEventListener('input', () => {
    const parsed = parseInt(els.autoNameStartInput.value, 10);
    state.autoNameStart = Number.isNaN(parsed) ? 1 : Math.max(0, parsed);
    saveUserSettings();
    if (state.autoSyncOrder) {
      applyAutoNameToSelected(true);
      renderVideoList();
      renderFooterAndCounters();
    }
  });

  els.autoNamePadSelect.addEventListener('change', () => {
    state.autoNamePad = parseInt(els.autoNamePadSelect.value || '2', 10) || 2;
    saveUserSettings();
    if (state.autoSyncOrder) {
      applyAutoNameToSelected(true);
      renderVideoList();
      renderFooterAndCounters();
    }
  });

  els.autoSyncOrderCheckbox.addEventListener('change', () => {
    state.autoSyncOrder = els.autoSyncOrderCheckbox.checked;
    saveUserSettings();
    if (state.autoSyncOrder) {
      applyAutoNameToSelected(false);
      renderVideoList();
      renderFooterAndCounters();
    }
  });

  els.applyAutoNameBtn.addEventListener('click', () => {
    applyAutoNameToSelected(false);
    renderVideoList();
    renderFooterAndCounters();
  });

  els.resetAllNamesBtn.addEventListener('click', () => {
    resetAllClipNames();
  });

  // Filter Pills Bar Click Handler
  els.filterPillsBar.addEventListener('click', (event) => {
    const pill = event.target.closest('.filter-pill');
    if (!pill) return;

    const filterKey = pill.dataset.filter || 'all';
    state.activeFilter = filterKey;

    Array.from(els.filterPillsBar.querySelectorAll('.filter-pill')).forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === filterKey);
    });

    renderVideoList();
    renderFooterAndCounters();
  });

  // Master Select All / Deselect All Checkbox
  els.masterSelectCheckbox.addEventListener('change', () => {
    const targetChecked = els.masterSelectCheckbox.checked;
    const visibleItems = getFilteredItems();
    visibleItems.forEach((i) => {
      i.selected = targetChecked;
    });
    applyAutoNameToSelected(true);
    saveVideoListToLocalStorage(state.items);
    renderVideoList();
    renderFooterAndCounters();
  });

  // Explicit Select All / Deselect All / Invert / Pending Buttons
  els.selectAllBtn.addEventListener('click', () => {
    const visibleItems = getFilteredItems();
    visibleItems.forEach((i) => (i.selected = true));
    applyAutoNameToSelected(true);
    saveVideoListToLocalStorage(state.items);
    renderVideoList();
    renderFooterAndCounters();
  });

  els.selectNoneBtn.addEventListener('click', () => {
    const visibleItems = getFilteredItems();
    visibleItems.forEach((i) => (i.selected = false));
    applyAutoNameToSelected(true);
    saveVideoListToLocalStorage(state.items);
    renderVideoList();
    renderFooterAndCounters();
  });

  els.selectInvertBtn.addEventListener('click', () => {
    const visibleItems = getFilteredItems();
    visibleItems.forEach((i) => (i.selected = !i.selected));
    applyAutoNameToSelected(true);
    saveVideoListToLocalStorage(state.items);
    renderVideoList();
    renderFooterAndCounters();
  });

  els.selectPendingBtn.addEventListener('click', () => {
    const visibleItems = getFilteredItems();
    visibleItems.forEach((i) => {
      i.selected = i.status !== 'completed' && !i.inHistory;
    });
    applyAutoNameToSelected(true);
    saveVideoListToLocalStorage(state.items);
    renderVideoList();
    renderFooterAndCounters();
  });

  // Clear History in Local Storage
  els.clearHistoryBtn.addEventListener('click', () => {
    const historyCount = Object.keys(state.historyMap || {}).length;
    if (historyCount === 0) {
      setStatusBadge('History already empty', false);
      return;
    }
    if (!confirm(`Clear ${historyCount} saved download record(s) from Local Storage History?`)) {
      return;
    }

    clearDownloadHistoryStorage();
    state.historyMap = {};
    state.items.forEach((item) => {
      item.inHistory = false;
      item.downloadedAt = null;
      if (item.status === 'completed') {
        item.status = 'idle';
        item.progress = 0;
      }
    });
    saveVideoListToLocalStorage(state.items);
    renderVideoList();
    renderFooterAndCounters();
    setStatusBadge('History cleared', false);
  });

  // Clear Current Video List
  els.clearListBtn.addEventListener('click', async () => {
    if (queueEngine.isRunning) {
      queueEngine.stop();
    }
    state.items = [];
    saveVideoListToLocalStorage(state.items);
    renderVideoList();
    renderFooterAndCounters();
    setStatusBadge('List Cleared', false);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      sendMessageToTab(tab.id, { type: 'CLEAR_CACHE_AND_RESCAN' });
    }
  });

  els.searchFilterInput.addEventListener('input', () => {
    state.searchQuery = els.searchFilterInput.value;
    renderVideoList();
    renderFooterAndCounters();
  });

  // Inline Per-Clip Save Filename Editing (input & change/blur)
  els.videoListContainer.addEventListener('input', (event) => {
    const nameInput = event.target.closest('.card-filename-input');
    if (!nameInput) return;

    const id = nameInput.dataset.id;
    const item = state.items.find((i) => i.id === id);
    if (!item) return;

    item.customFilename = nameInput.value;
    const isRenamed = ensureMp4Filename(item.customFilename, item.filename) !== item.filename;
    nameInput.classList.toggle('is-renamed', isRenamed);

    const card = nameInput.closest('.video-card');
    const resetBtn = card?.querySelector('.btn-reset-name');
    if (resetBtn) {
      resetBtn.classList.toggle('hidden', !isRenamed);
    }

    saveVideoListToLocalStorage(state.items);
    renderFooterAndCounters();
  });

  els.videoListContainer.addEventListener('change', (event) => {
    const nameInput = event.target.closest('.card-filename-input');
    if (!nameInput) return;

    const id = nameInput.dataset.id;
    const item = state.items.find((i) => i.id === id);
    if (!item) return;

    const normalized = ensureMp4Filename(nameInput.value, item.filename);
    item.customFilename = normalized;
    nameInput.value = normalized;

    const isRenamed = normalized !== item.filename;
    nameInput.classList.toggle('is-renamed', isRenamed);

    const card = nameInput.closest('.video-card');
    const resetBtn = card?.querySelector('.btn-reset-name');
    if (resetBtn) {
      resetBtn.classList.toggle('hidden', !isRenamed);
    }

    saveVideoListToLocalStorage(state.items);
    renderFooterAndCounters();
  });

  els.videoListContainer.addEventListener('keydown', (event) => {
    const nameInput = event.target.closest('.card-filename-input');
    if (nameInput && event.key === 'Enter') {
      nameInput.blur();
    }
  });

  // Delegate clicks inside videoListContainer (Checkboxes, Reset Name, Locate, Copy, Single Download)
  els.videoListContainer.addEventListener('click', async (event) => {
    const checkbox = event.target.closest('.card-checkbox');
    if (checkbox) {
      const id = checkbox.dataset.id;
      const idx = parseInt(checkbox.dataset.idx, 10);
      const visibleItems = getFilteredItems();
      const targetItem = state.items.find((i) => i.id === id);
      if (targetItem) {
        targetItem.selected = checkbox.checked;
      }

      // Support Shift + Click range selection
      if (event.shiftKey && state.lastClickedIndex !== null && !Number.isNaN(idx)) {
        const start = Math.min(state.lastClickedIndex, idx);
        const end = Math.max(state.lastClickedIndex, idx);
        for (let i = start; i <= end; i++) {
          if (visibleItems[i]) {
            visibleItems[i].selected = checkbox.checked;
          }
        }
      }
      state.lastClickedIndex = idx;
      applyAutoNameToSelected(true);
      saveVideoListToLocalStorage(state.items);
      renderVideoList();
      renderFooterAndCounters();
      return;
    }

    const resetNameBtn = event.target.closest('.btn-reset-name');
    if (resetNameBtn) {
      const videoId = resetNameBtn.dataset.id;
      const item = state.items.find((i) => i.id === videoId);
      if (item) {
        item.customFilename = item.filename;
        saveVideoListToLocalStorage(state.items);
        renderVideoList();
        renderFooterAndCounters();
      }
      return;
    }

    const locateBtn = event.target.closest('.btn-locate');
    if (locateBtn) {
      const videoId = locateBtn.dataset.id;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        sendMessageToTab(tab.id, { type: 'HIGHLIGHT_VIDEO', videoId });
      }
      return;
    }

    const copyBtn = event.target.closest('.btn-copy');
    if (copyBtn) {
      const url = copyBtn.dataset.url;
      await navigator.clipboard.writeText(url);
      const orig = copyBtn.textContent;
      copyBtn.textContent = '✓';
      setTimeout(() => (copyBtn.textContent = orig), 1000);
      return;
    }

    const singleDlBtn = event.target.closest('.btn-dl-single');
    if (singleDlBtn) {
      const videoId = singleDlBtn.dataset.id;
      await handleDownloadSingle(videoId);
    }
  });

  // Queue Control Buttons
  els.startQueueBtn.addEventListener('click', () => handleStartQueue());
  els.pauseQueueBtn.addEventListener('click', () => {
    queueEngine.pause();
    renderFooterAndCounters();
  });
  els.resumeQueueBtn.addEventListener('click', () => {
    queueEngine.resume();
    renderFooterAndCounters();
  });
  els.skipCurrentBtn.addEventListener('click', () => {
    queueEngine.skipCurrent();
  });
  els.stopQueueBtn.addEventListener('click', () => {
    queueEngine.stop();
    renderFooterAndCounters();
  });
  els.retryFailedBtn.addEventListener('click', async () => {
    state.items.forEach((item) => {
      if (item.status === 'failed') {
        item.selected = true;
        item.status = 'idle';
        item.error = null;
        item.progress = 0;
      } else {
        item.selected = false;
      }
    });
    saveVideoListToLocalStorage(state.items);
    renderVideoList();
    renderFooterAndCounters();
    await handleStartQueue();
  });

  // Listen for live updates pushed from Content Script's MutationObserver
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'VIDEO_LIST_UPDATED' && Array.isArray(message.videos)) {
      const added = mergeDiscoveredVideos(message.videos);
      if (added > 0) {
        setStatusBadge(`${state.items.length} videos (+${added} live)`, true);
      }
    }
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

init();
