import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DATA_DIRNAME = 'user-data';

function sanitizePathSegment(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getAppDataRoot() {
  return path.join(app.getPath('userData'), APP_DATA_DIRNAME);
}

function getUserDirectory(userId) {
  return path.join(getAppDataRoot(), 'users', sanitizePathSegment(userId));
}

function getDatasetFilePath(userId, key) {
  return path.join(getUserDirectory(userId), `${sanitizePathSegment(key)}.json`);
}

async function ensureDirectory(userId) {
  await fs.mkdir(getUserDirectory(userId), { recursive: true });
}

async function readDataset(userId, key) {
  const filePath = getDatasetFilePath(userId, key);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeDataset(userId, key, value) {
  await ensureDirectory(userId);
  const filePath = getDatasetFilePath(userId, key);
  const payload = JSON.stringify(value, null, 2);
  await fs.writeFile(filePath, payload, 'utf8');
  return filePath;
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    window.loadURL(devServerUrl);
    return;
  }

  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('desktop-storage:read-dataset', async (_event, payload) => {
    return readDataset(payload.userId, payload.key);
  });

  ipcMain.handle('desktop-storage:write-dataset', async (_event, payload) => {
    return writeDataset(payload.userId, payload.key, payload.value);
  });

  ipcMain.handle('desktop-storage:get-root-path', async () => {
    await fs.mkdir(getAppDataRoot(), { recursive: true });
    return getAppDataRoot();
  });

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
