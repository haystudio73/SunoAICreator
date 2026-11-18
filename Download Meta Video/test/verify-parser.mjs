import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  ensureMp4Filename,
  extractVideosFromHtmlString,
  formatTargetFilename,
  generateAutoFilename
} from '../src/utils/url-parser.js';
import {
  clearDownloadHistoryStorage,
  loadDownloadHistoryMap,
  loadVideoListFromLocalStorage,
  recordCompletedDownloadInHistory,
  saveVideoListToLocalStorage
} from '../src/utils/storage-history.js';

// Mock localStorage in Node environment
const memStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (memStore.has(k) ? memStore.get(k) : null),
  setItem: (k, v) => memStore.set(k, String(v)),
  removeItem: (k) => memStore.delete(k)
};

const html = fs.readFileSync(new URL('./mock-meta-ai.html', import.meta.url), 'utf8');
const videos = extractVideosFromHtmlString(html);

console.log(`Extracted ${videos.length} videos from mock-meta-ai.html`);
assert.equal(videos.length, 3, 'Should extract all 3 <video> .mp4 URLs from mock-meta-ai.html');

const first = videos[0];
assert.equal(
  first.filename,
  '902044508_1849482556051902_4641685168229180870_n.mp4',
  'Should extract clean filename from scontent.xx.fbcdn.net URL'
);
assert.ok(!first.url.includes('&amp;'), 'Should decode &amp; entities into valid & query separators');
assert.ok(first.url.includes('oh=00_AQTto52-DZkV6zT_n-5LCEhlqzaJTfq0MH3yZ_Hl4WcRHg'), 'Should preserve signed oh token');

// Test per-clip custom filename editing
assert.equal(ensureMp4Filename('my_custom_clip', first.filename), 'my_custom_clip.mp4');
assert.equal(ensureMp4Filename('scene_01.mp4', first.filename), 'scene_01.mp4');
assert.equal(ensureMp4Filename('   ', first.filename), first.filename);

// Test Auto-New-Name All Selected (Top -> Bottom order numbering)
assert.equal(
  generateAutoFilename({ item: videos[0], orderNumber: 1, prefix: 'clip', format: 'prefix_num', padDigits: 2 }),
  'clip_01.mp4'
);
assert.equal(
  generateAutoFilename({ item: videos[1], orderNumber: 2, prefix: 'clip', format: 'prefix_num', padDigits: 2 }),
  'clip_02.mp4'
);
assert.equal(
  generateAutoFilename({ item: videos[2], orderNumber: 3, prefix: 'scene', format: 'num_prefix', padDigits: 3 }),
  '003_scene.mp4'
);
assert.equal(
  generateAutoFilename({ item: videos[0], orderNumber: 1, prefix: '', format: 'num_only', padDigits: 2 }),
  '01.mp4'
);
assert.equal(
  generateAutoFilename({ item: videos[0], orderNumber: 1, prefix: 'clip', format: 'num_original', padDigits: 2 }),
  '01_902044508_1849482556051902_4641685168229180870_n.mp4'
);

// Test formatTargetFilename respects item.customFilename
const editedItem = { ...first, customFilename: 'hero_shot_final' };
assert.equal(formatTargetFilename(editedItem, 0), 'hero_shot_final.mp4');

// Test Local Storage persistence & Download History
saveVideoListToLocalStorage([
  { ...first, customFilename: 'clip_01.mp4', selected: true, status: 'downloading' }
]);
const loadedList = loadVideoListFromLocalStorage();
assert.equal(loadedList.length, 1);
assert.equal(loadedList[0].customFilename, 'clip_01.mp4');
assert.equal(loadedList[0].status, 'idle', 'Interrupted downloading state should reset to idle on reload');

recordCompletedDownloadInHistory(
  { ...first, customFilename: 'clip_01.mp4', totalBytes: 1048576 },
  'E:\\Meta_Videos'
);
const histMap = loadDownloadHistoryMap();
assert.ok(histMap[first.id], 'Video ID should be saved in Download History map');
assert.equal(histMap[first.id].savedFilename, 'clip_01.mp4');

clearDownloadHistoryStorage();
assert.equal(Object.keys(loadDownloadHistoryMap()).length, 0, 'History should be empty after clear');

console.log('✅ All parser, rename, filter, and Local Storage history assertions passed!');
