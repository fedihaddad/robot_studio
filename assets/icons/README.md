Put your application icons in this folder using these exact names:

- icon.ico   (Windows package/installer icon)
- icon.icns  (macOS package icon)
- icon.png   (Linux package + BrowserWindow runtime icon)

Notes:

- In `forge.config.ts`, packager icon is configured as `assets/icons/icon` (no extension).
- In `src/main.ts`, window icon uses `assets/icons/icon.png` when present.
- After adding icons, run:
  - `npm run package` or `npm run make`
