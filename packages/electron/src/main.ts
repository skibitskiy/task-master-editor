import { app, BrowserWindow, shell, WebContents, BrowserWindowConstructorOptions } from 'electron';
import * as path from 'node:path';
import log from 'electron-log/main';
import { isUrlAllowed } from './security';

const isDev = process.env.NODE_ENV === 'development';

export function setupSecurityHandlers(contents: WebContents) {
  contents.setWindowOpenHandler(({ url }) => {
    if (isUrlAllowed(url)) {
      shell.openExternal(url);
    } else {
      log.warn('Blocked window.open to URL:', url);
    }
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
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

export function getBrowserWindowOptions(): BrowserWindowConstructorOptions {
  return {
    width: 1024,
    height: 768,
    show: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  };
}

export function createWindow() {
  const win = new BrowserWindow(getBrowserWindowOptions());

  setupSecurityHandlers(win.webContents);

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
    log.info('Loading dev URL:', devUrl);
    void win.loadURL(devUrl);
  } else {
    const indexHtml = path.resolve(__dirname, '../../renderer/dist/index.html');
    log.info('Loading production file:', indexHtml);
    void win.loadFile(indexHtml);
  }

  return win;
}
 
