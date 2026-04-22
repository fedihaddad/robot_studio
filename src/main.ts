import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const iconCandidates = process.platform === 'win32'
    ? [
        path.join(process.cwd(), 'assets/icons/icon.ico'),
        path.join(__dirname, '../assets/icons/icon.ico'),
        path.join(__dirname, '../../assets/icons/icon.ico'),
        path.join(process.cwd(), 'assets/icons/icon.png'),
        path.join(__dirname, '../assets/icons/icon.png'),
        path.join(__dirname, '../../assets/icons/icon.png'),
      ]
    : [
        path.join(process.cwd(), 'assets/icons/icon.png'),
        path.join(__dirname, '../assets/icons/icon.png'),
        path.join(__dirname, '../../assets/icons/icon.png'),
      ];
  const iconPath = iconCandidates.find((candidate) => fs.existsSync(candidate));

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Remove the menu bar
  mainWindow.removeMenu();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Show maximized on startup.
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Open DevTools only in development mode.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }

  // Forward all console logs to terminal
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Forward renderer-side diagnostic logs to the terminal running Electron.
ipcMain.on('terminal-log', (_event, payload: { message: string; data?: unknown }) => {
  const timestamp = new Date().toISOString();
  if (payload?.data !== undefined) {
    console.log(`[${timestamp}] ${payload.message}`, payload.data);
  } else {
    console.log(`[${timestamp}] ${payload?.message ?? ''}`);
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
