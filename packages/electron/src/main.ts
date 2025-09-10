import electron from 'electron';
const { BrowserWindow, shell } = electron;
import type { WebContents, BrowserWindowConstructorOptions } from 'electron';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import log from 'electron-log/main.js';
import { existsSync } from 'node:fs';
import { isUrlAllowed } from './security.js';

const isDev = process.env.NODE_ENV === 'development';

// Debug logging
log.info('Electron startup:', {
  NODE_ENV: process.env.NODE_ENV,
  isDev,
  VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL,
});

export function setupSecurityHandlers(contents: WebContents) {
  contents.setWindowOpenHandler(({ url }: { url: string }) => {
    if (isUrlAllowed(url)) {
      shell.openExternal(url);
    } else {
      log.warn('Blocked window.open to URL:', url);
    }
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event: Electron.Event, url: string) => {
    const isLocal = url.startsWith('file://') || url.startsWith('http://localhost:5173');
    if (!isLocal) {
      event.preventDefault();
      if (isUrlAllowed(url)) {
        shell.openExternal(url);
      } else {
        log.warn('Blocked navigation to URL:', url);
      }
    }
  });
}

// Resolve dirname for both ESM (tsc) and bundled CJS (webpack)
const __DIRNAME = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export function getBrowserWindowOptions(): BrowserWindowConstructorOptions {
  const preloadPath = path.join(__DIRNAME, 'preload.cjs');

  // Debug: Log preload path and check if file exists
  log.info('🔧 Preload configuration:', {
    isDev,
    __DIRNAME,
    preloadPath,
    fileExists: existsSync(preloadPath),
  });

  return {
    width: 1024,
    height: 768,
    show: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      preload: preloadPath,
    },
  };
}

export function createWindow() {
  const win = new BrowserWindow(getBrowserWindowOptions());

  setupSecurityHandlers(win.webContents);

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
    log.info('Loading dev URL:', devUrl);
    void win.loadURL(devUrl);
    // Open DevTools in development
    win.webContents.openDevTools();
  } else {
    const indexHtml = path.resolve(__DIRNAME, '../../renderer/dist/index.html');
    log.info('Loading production file:', indexHtml);
    void win.loadFile(indexHtml);
  }

  return win;
}
