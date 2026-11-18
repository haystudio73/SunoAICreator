/**
 * Sequential Auto-Download Queue Engine (File-by-File)
 * Processes selected videos strictly one by one (concurrency = 1) with:
 *  - Direct Disk Streaming via FileSystemDirectoryHandle (Primary)
 *  - Chrome Downloads Subfolder Mode via chrome.downloads.download (Fallback)
 *  - Pause / Resume / Skip / Cancel / Retry Failed controls
 *  - Real-time byte progress callbacks & polite inter-file delay
 */

import { resolveTargetFileHandle } from './folder-manager.js';
import { formatTargetFilename, sanitizeFilename } from './url-parser.js';

export class SequentialDownloadQueue {
  /**
   * @param {object} options
   * @param {(state: object) => void} options.onStateChange
   */
  constructor({ onStateChange }) {
    this.onStateChange = onStateChange || (() => {});
    this.isRunning = false;
    this.isPaused = false;
    this.stopRequested = false;
    this.currentAbortController = null;
    this.currentDownloadId = null;
    this.activeItemId = null;
  }

  /**
   * Runs the sequential download queue over the provided items array
   * @param {Array<object>} items
   * @param {object} config
   * @param {'folder_picker'|'subfolder'} config.saveMode
   * @param {FileSystemDirectoryHandle|null} config.dirHandle
   * @param {string} config.subfolderName
   * @param {'uniquify'|'overwrite'|'skip'} config.conflictAction
   * @param {'original'|'indexed_original'|'custom_indexed'} config.namingPattern
   * @param {string} config.customPrefix
   * @param {number} config.delayMs
   * @param {number} config.maxRetries
   */
  async startQueue(items, config) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.stopRequested = false;

    // Mark all selected 'idle' or 'failed' (if none pending) items as 'queued'
    const selectedItems = items.filter((item) => item.selected);
    selectedItems.forEach((item) => {
      if (item.status === 'idle' || item.status === 'failed') {
        item.status = 'queued';
        item.error = null;
        item.progress = 0;
      }
    });

    this.emitUpdate(items);

    let sequenceIndex = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.selected) continue;
      sequenceIndex++;

      if (this.stopRequested) break;

      // Wait while paused
      while (this.isPaused && !this.stopRequested) {
        await new Promise((r) => setTimeout(r, 200));
      }
      if (this.stopRequested) break;

      if (item.status !== 'queued') {
        continue;
      }

      this.activeItemId = item.id;
      const targetFilename = formatTargetFilename(
        item,
        sequenceIndex - 1,
        config.namingPattern,
        config.customPrefix
      );
      item.targetFilename = targetFilename;

      await this.processSingleItem(item, items, config);
      this.activeItemId = null;

      // Polite cooldown delay before next file in queue
      const hasMoreQueued = items.slice(i + 1).some((x) => x.selected && x.status === 'queued');
      if (hasMoreQueued && !this.stopRequested && !this.isPaused && config.delayMs > 0) {
        await this.sleepWithCancel(config.delayMs);
      }
    }

    this.isRunning = false;
    this.isPaused = false;
    this.stopRequested = false;
    this.activeItemId = null;
    this.emitUpdate(items);
  }

  /**
   * Downloads a single item with retry backoff
   */
  async processSingleItem(item, allItems, config) {
    const maxRetries = Number.isFinite(config.maxRetries) ? config.maxRetries : 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (this.stopRequested) {
        item.status = 'idle';
        item.progress = 0;
        this.emitUpdate(allItems);
        return;
      }

      item.status = 'downloading';
      item.attempt = attempt + 1;
      item.error = null;
      if (attempt === 0) {
        item.progress = 0;
        item.loadedBytes = 0;
      }
      this.emitUpdate(allItems);

      try {
        if (config.saveMode === 'folder_picker' && config.dirHandle) {
          await this.downloadViaFileSystemHandle(item, allItems, config);
        } else {
          await this.downloadViaChromeDownloadsApi(item, allItems, config);
        }
        return;
      } catch (err) {
        if (err?.name === 'AbortError' || err?.message === 'USER_SKIPPED') {
          if (err?.message === 'USER_SKIPPED') {
            item.status = 'skipped';
            item.error = 'Skipped by user';
          } else if (this.stopRequested) {
            item.status = 'idle';
            item.progress = 0;
          } else {
            item.status = 'queued';
          }
          this.emitUpdate(allItems);
          return;
        }

        if (attempt < maxRetries && !this.stopRequested) {
          item.error = `Retry ${attempt + 1}/${maxRetries} (${err.message || 'Network error'})`;
          this.emitUpdate(allItems);
          await this.sleepWithCancel(1000 * (attempt + 1));
        } else {
          item.status = 'failed';
          item.error = err.message || 'Download failed';
          this.emitUpdate(allItems);
        }
      }
    }
  }

  /**
   * Primary Engine: Fetches .mp4 stream and pipes directly into user's chosen FileSystemDirectoryHandle
   */
  async downloadViaFileSystemHandle(item, allItems, config) {
    const { fileHandle, finalFilename, skipped } = await resolveTargetFileHandle(
      config.dirHandle,
      item.targetFilename || item.filename,
      config.conflictAction
    );

    if (skipped) {
      item.status = 'skipped';
      item.finalFilename = finalFilename;
      item.progress = 100;
      item.error = 'File already exists (Skipped)';
      this.emitUpdate(allItems);
      return;
    }

    item.finalFilename = finalFilename;
    this.currentAbortController = new AbortController();

    const response = await fetch(item.url, {
      method: 'GET',
      signal: this.currentAbortController.signal,
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const totalBytes = parseInt(response.headers.get('content-length') || '0', 10) || 0;
    item.totalBytes = totalBytes;

    const writable = await fileHandle.createWritable();
    let loadedBytes = 0;

    try {
      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        let lastUiNotify = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          await writable.write(value);
          loadedBytes += value.byteLength;
          item.loadedBytes = loadedBytes;

          if (totalBytes > 0) {
            item.progress = Math.min(99, Math.round((loadedBytes / totalBytes) * 100));
          } else {
            item.progress = 50;
          }

          const now = Date.now();
          if (now - lastUiNotify > 120) {
            lastUiNotify = now;
            this.emitUpdate(allItems);
          }
        }
      } else {
        const blob = await response.blob();
        await writable.write(blob);
        loadedBytes = blob.size;
        item.loadedBytes = loadedBytes;
        item.totalBytes = loadedBytes;
      }

      await writable.close();
      item.status = 'completed';
      item.progress = 100;
      this.emitUpdate(allItems);
    } catch (err) {
      try {
        await writable.abort();
      } catch {
        // Ignore abort cleanup error
      }
      throw err;
    } finally {
      this.currentAbortController = null;
    }
  }

  /**
   * Fallback Engine: Uses chrome.downloads.download into a subfolder inside Chrome's Downloads directory
   */
  async downloadViaChromeDownloadsApi(item, allItems, config) {
    const cleanSubfolder = String(config.subfolderName || 'Meta_AI_Videos')
      .split(/[\\/]/)
      .map((seg) => sanitizeFilename(seg))
      .filter(Boolean)
      .join('/');

    const targetFile = item.targetFilename || item.filename;
    const relativePath = cleanSubfolder ? `${cleanSubfolder}/${targetFile}` : targetFile;
    const conflictAction =
      config.conflictAction === 'overwrite'
        ? 'overwrite'
        : config.conflictAction === 'skip'
        ? 'uniquify'
        : 'uniquify';

    return new Promise((resolve, reject) => {
      chrome.downloads.download(
        {
          url: item.url,
          filename: relativePath,
          conflictAction,
          saveAs: false
        },
        (downloadId) => {
          if (chrome.runtime.lastError || !downloadId) {
            reject(new Error(chrome.runtime.lastError?.message || 'Failed to start chrome.downloads'));
            return;
          }

          this.currentDownloadId = downloadId;
          item.finalFilename = relativePath;

          const pollTimer = setInterval(() => {
            chrome.downloads.search({ id: downloadId }, (results) => {
              const dl = results?.[0];
              if (!dl) return;
              if (dl.totalBytes > 0) {
                item.totalBytes = dl.totalBytes;
                item.loadedBytes = dl.bytesReceived;
                item.progress = Math.min(99, Math.round((dl.bytesReceived / dl.totalBytes) * 100));
                this.emitUpdate(allItems);
              }
            });
          }, 250);

          const onChangedListener = (delta) => {
            if (delta.id !== downloadId) return;

            if (delta.state?.current === 'complete') {
              cleanup();
              item.status = 'completed';
              item.progress = 100;
              this.emitUpdate(allItems);
              resolve();
            } else if (delta.state?.current === 'interrupted') {
              cleanup();
              const errMsg = delta.error?.current || 'Download interrupted';
              reject(new Error(errMsg));
            }
          };

          const cleanup = () => {
            clearInterval(pollTimer);
            chrome.downloads.onChanged.removeListener(onChangedListener);
            this.currentDownloadId = null;
          };

          chrome.downloads.onChanged.addListener(onChangedListener);
        }
      );
    });
  }

  pause() {
    if (!this.isRunning) return;
    this.isPaused = true;
  }

  resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
  }

  skipCurrent() {
    if (this.currentAbortController) {
      this.currentAbortController.abort(new Error('USER_SKIPPED'));
    } else if (this.currentDownloadId) {
      chrome.downloads.cancel(this.currentDownloadId);
    }
  }

  stop() {
    this.stopRequested = true;
    this.isPaused = false;
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    } else if (this.currentDownloadId) {
      chrome.downloads.cancel(this.currentDownloadId);
    }
  }

  async sleepWithCancel(ms) {
    const step = 100;
    let elapsed = 0;
    while (elapsed < ms && !this.stopRequested) {
      await new Promise((r) => setTimeout(r, Math.min(step, ms - elapsed)));
      elapsed += step;
    }
  }

  emitUpdate(items) {
    this.onStateChange({
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      activeItemId: this.activeItemId,
      items
    });
  }
}

