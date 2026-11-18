/**
 * Folder Selection & IndexedDB Directory Handle Manager
 * Supports both:
 *  1. File System Access API (window.showDirectoryPicker) -> save to ANY folder on disk
 *  2. Chrome Downloads Subfolder fallback (chrome.downloads.download)
 */

const DB_NAME = 'meta_ai_video_downloader_db';
const DB_VERSION = 1;
const STORE_NAME = 'directory_handles';
const HANDLE_KEY = 'saved_dir_handle';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a FileSystemDirectoryHandle into IndexedDB for session persistence
 * @param {FileSystemDirectoryHandle} dirHandle
 */
export async function saveDirectoryHandle(dirHandle) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(dirHandle, HANDLE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[FolderManager] Failed to persist directory handle:', err);
    return false;
  }
}

/**
 * Loads a previously saved FileSystemDirectoryHandle from IndexedDB
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function loadSavedDirectoryHandle() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Opens the native OS folder picker dialog and saves the handle
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function pickSaveDirectory() {
  if (typeof window.showDirectoryPicker !== 'function') {
    throw new Error('File System Access API (showDirectoryPicker) is not supported in this context.');
  }

  const dirHandle = await window.showDirectoryPicker({
    id: 'meta_ai_videos_dir',
    mode: 'readwrite',
    startIn: 'downloads'
  });

  if (dirHandle) {
    await saveDirectoryHandle(dirHandle);
  }
  return dirHandle;
}

/**
 * Checks (and optionally requests) readwrite permission on a FileSystemDirectoryHandle
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {boolean} requestIfPrompt
 * @returns {Promise<'granted'|'prompt'|'denied'>}
 */
export async function ensureDirectoryPermission(dirHandle, requestIfPrompt = true) {
  if (!dirHandle) return 'denied';
  try {
    const opts = { mode: 'readwrite' };
    let status = await dirHandle.queryPermission(opts);
    if (status === 'granted') return 'granted';
    if (requestIfPrompt && status === 'prompt') {
      status = await dirHandle.requestPermission(opts);
    }
    return status;
  } catch (err) {
    console.warn('[FolderManager] Permission check error:', err);
    return 'denied';
  }
}

/**
 * Checks if a file already exists inside a FileSystemDirectoryHandle
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} filename
 * @returns {Promise<boolean>}
 */
export async function fileExistsInDirectory(dirHandle, filename) {
  try {
    await dirHandle.getFileHandle(filename, { create: false });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the target FileSystemFileHandle according to conflict resolution setting:
 *  - 'uniquify': appends (1), (2), ... if file exists
 *  - 'overwrite': overwrites existing file
 *  - 'skip': returns { skipped: true } if file exists
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} desiredFilename
 * @param {'uniquify'|'overwrite'|'skip'} conflictAction
 * @returns {Promise<{ fileHandle: FileSystemFileHandle|null, finalFilename: string, skipped: boolean }>}
 */
export async function resolveTargetFileHandle(dirHandle, desiredFilename, conflictAction = 'uniquify') {
  const exists = await fileExistsInDirectory(dirHandle, desiredFilename);

  if (!exists || conflictAction === 'overwrite') {
    const fileHandle = await dirHandle.getFileHandle(desiredFilename, { create: true });
    return { fileHandle, finalFilename: desiredFilename, skipped: false };
  }

  if (conflictAction === 'skip') {
    return { fileHandle: null, finalFilename: desiredFilename, skipped: true };
  }

  // 'uniquify': find next available name like "filename (1).mp4"
  const dotIndex = desiredFilename.lastIndexOf('.');
  const base = dotIndex > 0 ? desiredFilename.slice(0, dotIndex) : desiredFilename;
  const ext = dotIndex > 0 ? desiredFilename.slice(dotIndex) : '.mp4';

  let counter = 1;
  while (counter < 1000) {
    const candidate = `${base} (${counter})${ext}`;
    const candidateExists = await fileExistsInDirectory(dirHandle, candidate);
    if (!candidateExists) {
      const fileHandle = await dirHandle.getFileHandle(candidate, { create: true });
      return { fileHandle, finalFilename: candidate, skipped: false };
    }
    counter++;
  }

  const fallbackName = `${base}_${Date.now()}${ext}`;
  const fileHandle = await dirHandle.getFileHandle(fallbackName, { create: true });
  return { fileHandle, finalFilename: fallbackName, skipped: false };
}

