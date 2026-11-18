/**
 * Content Script: Meta.AI HTML & DOM Video Scanner
 * Scans <video> elements and HTML source for .mp4 links (e.g., scontent.xx.fbcdn.net),
 * observes DOM mutations as the user scrolls, and communicates with the Side Panel.
 */

(() => {
  // Prevent duplicate injection if executed via both manifest content_scripts and executeScript
  if (window.__META_AI_VIDEO_SCANNER_INITIALIZED__) {
    return;
  }
  window.__META_AI_VIDEO_SCANNER_INITIALIZED__ = true;

  /** @type {Map<string, object>} */
  const discoveredVideos = new Map();
  let autoScanEnabled = true;
  let scanDebounceTimer = null;

  function decodeHtmlUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    return rawUrl
      .trim()
      .replace(/&amp;/gi, '&')
      .replace(/&#38;/g, '&')
      .replace(/&#x26;/gi, '&');
  }

  function sanitizeFilename(name) {
    return String(name || 'video.mp4')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseUrlToVideoMeta(rawUrl, extra = {}) {
    const cleanUrl = decodeHtmlUrl(rawUrl);
    if (!cleanUrl || !cleanUrl.startsWith('http')) return null;

    try {
      const urlObj = new URL(cleanUrl);
      const pathname = urlObj.pathname || '';
      if (!pathname.toLowerCase().includes('.mp4') && !cleanUrl.toLowerCase().includes('.mp4')) {
        return null;
      }

      const segments = pathname.split('/').filter(Boolean);
      let rawFilename = segments.pop() || `meta_video_${Date.now()}.mp4`;
      if (!rawFilename.toLowerCase().endsWith('.mp4')) {
        rawFilename += '.mp4';
      }
      const filename = sanitizeFilename(rawFilename);
      const id = filename.replace(/\.mp4$/i, '');

      const oeHex = urlObj.searchParams.get('oe');
      let expiresAt = null;
      if (oeHex && /^[0-9a-fA-F]+$/.test(oeHex)) {
        const parsedSeconds = parseInt(oeHex, 16);
        if (!Number.isNaN(parsedSeconds) && parsedSeconds > 1000000000) {
          expiresAt = parsedSeconds * 1000;
        }
      }

      return {
        id,
        url: cleanUrl,
        filename,
        host: urlObj.hostname,
        isFbCdn: urlObj.hostname.includes('fbcdn.net'),
        expiresAt,
        width: extra.width || null,
        height: extra.height || null,
        duration: extra.duration || null,
        poster: extra.poster || null,
        discoveredAt: extra.discoveredAt || Date.now()
      };
    } catch {
      return null;
    }
  }

  /**
   * Scans all <video> tags and raw HTML source on the current page
   */
  function scanCurrentDom() {
    let newlyAdded = 0;

    // 1. Scan all live <video> elements in the DOM
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach((videoEl) => {
      const candidateSrc =
        videoEl.src ||
        videoEl.currentSrc ||
        videoEl.getAttribute('src') ||
        videoEl.querySelector('source[src*=".mp4"]')?.src ||
        videoEl.querySelector('source')?.src ||
        videoEl.querySelector('source')?.getAttribute('src');

      if (!candidateSrc) return;

      const meta = parseUrlToVideoMeta(candidateSrc, {
        width: videoEl.videoWidth || null,
        height: videoEl.videoHeight || null,
        duration: Number.isFinite(videoEl.duration) ? Math.round(videoEl.duration) : null,
        poster: videoEl.poster || videoEl.getAttribute('poster') || null
      });

      if (meta) {
        // Tag element with data attribute for easy "Locate on Page" highlighting
        videoEl.setAttribute('data-meta-dl-id', meta.id);

        const existing = discoveredVideos.get(meta.id);
        if (!existing) {
          discoveredVideos.set(meta.id, meta);
          newlyAdded++;
        } else {
          // Keep original discoveredAt, but refresh signed URL & video dimensions if newly loaded
          discoveredVideos.set(meta.id, {
            ...existing,
            url: meta.url,
            expiresAt: meta.expiresAt || existing.expiresAt,
            width: meta.width || existing.width,
            height: meta.height || existing.height,
            duration: meta.duration || existing.duration,
            poster: meta.poster || existing.poster
          });
        }
      }
    });

    // 2. Fallback regex scan on raw HTML source for any .mp4 links not yet mounted
    try {
      const htmlString = document.documentElement?.innerHTML || '';
      const mp4Regex = /https?:\/\/[^"'\s<>\\]+\.mp4(?:\?[^"'\s<>\\]+)?/gi;
      const matches = htmlString.match(mp4Regex) || [];
      for (const match of matches) {
        const meta = parseUrlToVideoMeta(match);
        if (meta && !discoveredVideos.has(meta.id)) {
          discoveredVideos.set(meta.id, meta);
          newlyAdded++;
        }
      }
    } catch {
      // Ignore fallback error
    }

    const list = Array.from(discoveredVideos.values());
    if (newlyAdded > 0) {
      broadcastUpdate(list);
    }
    return list;
  }

  function broadcastUpdate(videos) {
    try {
      chrome.runtime.sendMessage(
        {
          type: 'VIDEO_LIST_UPDATED',
          pageUrl: window.location.href,
          pageTitle: document.title,
          videos
        },
        () => {
          // Suppress error when side panel is closed
          void chrome.runtime.lastError;
        }
      );
    } catch {
      // Ignore context invalidated errors
    }
  }

  /**
   * Scrolls to and highlights a specific <video> element on the page
   * @param {string} videoId
   */
  function highlightVideoOnPage(videoId) {
    let targetEl = document.querySelector(`video[data-meta-dl-id="${CSS.escape(videoId)}"]`);
    if (!targetEl) {
      const allVideos = Array.from(document.querySelectorAll('video'));
      targetEl = allVideos.find((v) => {
        const src = v.src || v.getAttribute('src') || '';
        return src.includes(videoId);
      });
    }

    if (!targetEl) {
      return { found: false };
    }

    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const prevOutline = targetEl.style.outline;
    const prevOutlineOffset = targetEl.style.outlineOffset;
    const prevTransition = targetEl.style.transition;

    targetEl.style.transition = 'outline 0.25s ease';
    targetEl.style.outline = '4px solid #00d2ff';
    targetEl.style.outlineOffset = '4px';

    setTimeout(() => {
      targetEl.style.outline = prevOutline;
      targetEl.style.outlineOffset = prevOutlineOffset;
      targetEl.style.transition = prevTransition;
    }, 2500);

    return { found: true };
  }

  // Observe DOM changes (infinite scrolling on Meta.ai)
  const observer = new MutationObserver(() => {
    if (!autoScanEnabled) return;
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(() => {
      scanCurrentDom();
    }, 400);
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });
  }

  // Listen for commands from the Side Panel
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) return false;

    switch (message.type) {
      case 'SCAN_PAGE': {
        const videos = scanCurrentDom();
        sendResponse({
          ok: true,
          pageUrl: window.location.href,
          pageTitle: document.title,
          videos
        });
        return false;
      }

      case 'CLEAR_CACHE_AND_RESCAN': {
        discoveredVideos.clear();
        const videos = scanCurrentDom();
        sendResponse({
          ok: true,
          pageUrl: window.location.href,
          pageTitle: document.title,
          videos
        });
        return false;
      }

      case 'SET_AUTO_SCAN': {
        autoScanEnabled = Boolean(message.enabled);
        sendResponse({ ok: true, autoScanEnabled });
        return false;
      }

      case 'HIGHLIGHT_VIDEO': {
        const res = highlightVideoOnPage(message.videoId);
        sendResponse({ ok: true, ...res });
        return false;
      }

      default:
        return false;
    }
  });

  // Initial scan on load
  scanCurrentDom();
})();

