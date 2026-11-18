# Implementation Tasks (`tasks.md`)

A step-by-step full-stack implementation checklist for the **Meta.AI Video Downloader Chrome Extension (Manifest V3)**.

---

## Phase 1: Project Scaffolding & Manifest V3 Setup
- [x] **1.1. Initialize Extension Directory Structure**
  - Created folders: `src/background/`, `src/content/`, `src/sidepanel/`, `src/utils/`, `assets/icons/`, and `test/`.
- [x] **1.2. Configure `manifest.json` (Manifest V3)**
  - Registered `permissions`: `["sidePanel", "downloads", "storage", "activeTab", "scripting", "tabs"]`.
  - Registered `host_permissions`: `["*://*.meta.ai/*", "*://*.fbcdn.net/*", "<all_urls>"]`.
  - Configured `side_panel.default_path` to `src/sidepanel/index.html`.
  - Configured `background.service_worker` to `src/background/service-worker.js` (`type: "module"`).
  - Configured `content_scripts` matching `*://*.meta.ai/*`.
- [x] **1.3. Setup Action Button & Side Panel Behavior**
  - Configured `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` inside `src/background/service-worker.js`.

---

## Phase 2: Meta.AI DOM Scanner & Live Video Sniffer (`src/content/content-scanner.js`)
- [x] **2.1. Implement `<video>` Element Scanner**
  - Queries all `<video>` and `<source>` elements in the current DOM.
  - Reads `.src` / `.currentSrc` / `getAttribute('src')`, decoding `&amp;` entities into `&` while preserving signed `_nc_ht`, `_nc_ohc`, `oh`, `oe` parameters.
  - Extracts clean `.mp4` filename (`902044508_1849482556051902_4641685168229180870_n.mp4`).
- [x] **2.2. Implement Raw HTML Fallback Parser**
  - Added regex scanner on `document.documentElement.innerHTML` and standalone HTML paste drawer (`extractVideosFromHtmlString` in `src/utils/url-parser.js`).
- [x] **2.3. Attach `MutationObserver` for Infinite Scroll**
  - Observes DOM mutations in Meta.ai's virtualized feed and caches discovered videos in `Map<videoId, VideoMeta>` (`VIDEO_LIST_UPDATED` broadcast).
- [x] **2.4. Add Visual "Highlight on Page" Helper**
  - Added `HIGHLIGHT_VIDEO` command to scroll `<video>` into view and flash a cyan outline when clicking `🎯` in the Side Panel.

---

## Phase 3: Folder Selection Engine (`src/utils/folder-manager.js`)
- [x] **3.1. Implement Native OS Folder Picker (`window.showDirectoryPicker`)**
  - Added **"Select Folder..."** button in the Side Panel that opens the native OS directory picker for any local folder/drive.
- [x] **3.2. Persist Directory Handle in IndexedDB**
  - Persists `FileSystemDirectoryHandle` in IndexedDB (`meta_ai_video_downloader_db`) and verifies write permissions via `queryPermission` / `requestPermission`.
- [x] **3.3. Implement Fallback Subfolder Mode (`chrome.downloads`)**
  - Added toggleable **Downloads Subfolder** mode (`Downloads/<Subfolder>/<filename>.mp4`) via `chrome.downloads.download()`.
- [x] **3.4. Add Per-Clip Rename & Bulk Auto-Rename (Top → Bottom Order)**
  - Added inline editable filename input (`.card-filename-input`) on every video card with automatic `.mp4` suffix handling and individual `↺` reset button.
  - Added **Auto-Rename Selected (Top → Bottom Order)** section with configurable Base Name (`clip`), Order Format (`{name}_{num}.mp4`, `{num}_{name}.mp4`, `{num}.mp4`, `{num}_{original}`), Start `#`, Digits padding (`01`, `001`, `1`), one-click **✨ Auto New Name All Selected (Top → Bottom)** button, and live **Auto-renumber on select** toggle.

---

## Phase 4: Video List & Selection UI (`src/sidepanel/`)
- [x] **4.1. Build Side Panel Layout (`index.html` & `styles.css`)**
  - Built sticky header, Paste HTML drawer, Destination Folder card, Auto-Rename Selected card, Selection toolbar, scrollable video preview list, and Queue Control footer.
- [x] **4.2. Implement Interactive Selection Controls (`Select All / Deselect All`)**
  - Added master **All** checkbox (with indeterminate state), explicit **☑ Select All** and **☐ Deselect All** buttons, **⇄ Invert**, **⏳ Select New**, `Shift + Click` range selection, and top-to-bottom sequence badge (`#01`, `#02`, ...) on every selected clip.
- [x] **4.3. Implement Local Storage History & File View Filters (`src/utils/storage-history.js`)**
  - Persists both the active video list (`meta_ai_dl_video_list_v1`) and long-term completed download history (`meta_ai_dl_history_map_v1`) in `localStorage` and `chrome.storage.local`.
  - Automatically recognizes previously downloaded videos across sessions (`🕒 History` badge + auto-unselect already downloaded clips on scan).
  - Added interactive filter tabs with live counters: **All**, **Selected**, **Unselected**, **Pending / New**, **Downloaded / History**, **Renamed**, and **Failed**.

---

## Phase 5: Sequential Auto-Download Queue Engine (`src/utils/queue-engine.js`)
- [x] **5.1. Build File-by-File State Machine (`concurrency = 1`)**
  - Processes selected items strictly one by one (`idle` -> `queued` -> `downloading` -> `completed` | `failed` | `skipped`).
- [x] **5.2. Implement Stream Piping & Real-Time Byte Progress**
  - Tracks downloaded bytes via `response.body.getReader()` while streaming to `fileHandle.createWritable()`, updating per-card and overall progress bars.
- [x] **5.3. Add Polite Cooldown Delay & Auto-Retry**
  - Configurable inter-file delay (`default: 500ms`) and automatic retry with backoff (`1s`, `2s`).
- [x] **5.4. Implement Queue Controls (`Pause`, `Resume`, `Skip`, `Stop`, `Retry Failed`)**
  - Full interactive queue controls wired to `AbortController` and `chrome.downloads`.

---

## Phase 6: Testing & Verification (`test/`)
- [x] **6.1. Verify URL Signature Expiration Check (`oe` Parameter)**
  - Parses hex `oe` query parameter on `fbcdn.net` URLs and displays an expiration warning badge if expired.
- [x] **6.2. Handle Duplicate Filename Conflicts**
  - Implemented `Auto-Rename (file (1).mp4)`, `Skip Existing File`, and `Overwrite File` in `resolveTargetFileHandle()`.
- [x] **6.3. Automated Parser Test & Local Meta.AI Feed Simulation**
  - Created `test/mock-meta-ai.html` and `test/verify-parser.mjs` — all assertions passed.
