/**
 * URL & HTML Source Parser Utilities for Meta.AI / fbcdn.net .mp4 links
 */

/**
 * Decodes HTML entities commonly found in raw HTML attributes (e.g. &amp; -> &)
 * @param {string} rawUrl
 * @returns {string}
 */
export function decodeHtmlUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  return rawUrl
    .trim()
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/g, '&')
    .replace(/&#x26;/gi, '&');
}

/**
 * Parses a video URL (such as https://scontent.xx.fbcdn.net/v/.../902044508_..._n.mp4?_nc_ht=...)
 * and returns structured metadata.
 * @param {string} rawUrl
 * @param {object} [extra]
 * @returns {object|null}
 */
export function parseVideoUrl(rawUrl, extra = {}) {
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
    // Sanitize illegal filesystem characters
    const safeFilename = sanitizeFilename(rawFilename);
    const id = safeFilename.replace(/\.mp4$/i, '');

    // Meta/fbcdn URLs carry an 'oe' hex timestamp indicating link expiration
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
      filename: safeFilename,
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
 * Extracts all .mp4 video links from a raw HTML string (including <video src="..."> tags)
 * @param {string} htmlSource
 * @returns {Array<object>}
 */
export function extractVideosFromHtmlString(htmlSource) {
  if (!htmlSource || typeof htmlSource !== 'string') return [];

  const resultsMap = new Map();

  // 1. Parse via DOMParser to accurately read <video> and <source> attributes
  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlSource, 'text/html');
      const videoEls = doc.querySelectorAll('video');
      videoEls.forEach((video) => {
        const src =
          video.getAttribute('src') ||
          video.querySelector('source[src*=".mp4"]')?.getAttribute('src') ||
          video.querySelector('source')?.getAttribute('src');
        if (src) {
          const parsed = parseVideoUrl(src, {
            poster: video.getAttribute('poster') || null
          });
          if (parsed) {
            resultsMap.set(parsed.id, parsed);
          }
        }
      });
    }
  } catch {
    // Fallback to regex below
  }

  // 2. Regex pass for any direct https://...mp4?... URLs in the HTML text
  const mp4Regex = /https?:\/\/[^"'\s<>\\]+\.mp4(?:\?[^"'\s<>\\]+)?/gi;
  const matches = htmlSource.match(mp4Regex) || [];
  for (const match of matches) {
    const parsed = parseVideoUrl(match);
    if (parsed && !resultsMap.has(parsed.id)) {
      resultsMap.set(parsed.id, parsed);
    }
  }

  return Array.from(resultsMap.values());
}

/**
 * Checks if a signed CDN URL has expired based on its 'oe' timestamp
 * @param {number|null} expiresAt
 * @returns {boolean}
 */
export function isUrlExpired(expiresAt) {
  if (!expiresAt) return false;
  return Date.now() > expiresAt;
}

/**
 * Removes illegal characters from a filename (not path)
 * @param {string} name
 * @returns {string}
 */
export function sanitizeFilename(name) {
  return String(name || 'video.mp4')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ensures a user-edited filename is sanitized and ends with .mp4
 * @param {string} rawName
 * @param {string} [fallbackName]
 * @returns {string}
 */
export function ensureMp4Filename(rawName, fallbackName = 'video.mp4') {
  const trimmed = String(rawName || '').trim();
  if (!trimmed) {
    return sanitizeFilename(fallbackName || 'video.mp4');
  }
  let clean = sanitizeFilename(trimmed);
  if (!clean || clean === '.mp4') {
    clean = sanitizeFilename(fallbackName || 'video.mp4');
  }
  if (!clean.toLowerCase().endsWith('.mp4')) {
    clean += '.mp4';
  }
  return clean;
}

/**
 * Generates an auto-numbered filename for a selected clip based on its top-to-bottom order
 * @param {object} params
 * @param {object} params.item - Video item
 * @param {number} params.orderNumber - 1-based order number (e.g., 1, 2, 3...)
 * @param {string} [params.prefix='clip'] - Custom base name / prefix
 * @param {'prefix_num'|'num_prefix'|'num_only'|'num_original'} [params.format='prefix_num']
 * @param {number} [params.padDigits=2] - Zero-padding length (e.g., 2 -> 01, 3 -> 001, 1 -> 1)
 * @returns {string}
 */
export function generateAutoFilename({
  item,
  orderNumber,
  prefix = 'clip',
  format = 'prefix_num',
  padDigits = 2
}) {
  const numStr = String(Math.max(1, orderNumber)).padStart(Math.max(1, padDigits), '0');
  const cleanOriginal = ensureMp4Filename(item?.filename || `${item?.id || 'video'}.mp4`);
  const cleanPrefix = sanitizeFilename(String(prefix || '').replace(/\.mp4$/i, '')).trim();

  switch (format) {
    case 'num_only':
      return `${numStr}.mp4`;
    case 'num_original':
      return `${numStr}_${cleanOriginal}`;
    case 'num_prefix':
      return cleanPrefix ? `${numStr}_${cleanPrefix}.mp4` : `${numStr}.mp4`;
    case 'prefix_num':
    default:
      return cleanPrefix ? `${cleanPrefix}_${numStr}.mp4` : `${numStr}.mp4`;
  }
}

/**
 * Formats a target filename according to the item's customFilename or fallback naming pattern
 * @param {object} item - Video queue item
 * @param {number} index - 0-based queue index
 * @param {'original'|'indexed_original'|'custom_indexed'} [pattern='original']
 * @param {string} [customPrefix='meta_video']
 * @returns {string}
 */
export function formatTargetFilename(item, index, pattern = 'original', customPrefix = 'meta_video') {
  if (item?.customFilename && String(item.customFilename).trim()) {
    return ensureMp4Filename(item.customFilename, item.filename);
  }

  const paddedIndex = String(index + 1).padStart(3, '0');
  const cleanOriginal = sanitizeFilename(item.filename || `${item.id}.mp4`);
  const safePrefix = sanitizeFilename(customPrefix || 'meta_video').replace(/\.mp4$/i, '');

  switch (pattern) {
    case 'indexed_original':
      return `${paddedIndex}_${cleanOriginal}`;
    case 'custom_indexed':
      return `${safePrefix}_${paddedIndex}.mp4`;
    case 'original':
    default:
      return cleanOriginal;
  }
}

/**
 * Formats bytes into human-readable string (KB / MB / GB)
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0 || Number.isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
