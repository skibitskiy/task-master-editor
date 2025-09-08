import * as electron from 'electron';
const { app, BrowserWindow } = electron;
import log from 'electron-log/main.js';
import { createWindow } from './main.js';
import { registerIpcHandlers } from './ipcHandlers.js';

log.initialize();
log.info('Task Master Editor starting');

// Register IPC handlers early
registerIpcHandlers();

app.on('ready', () => {
  createWindow();
  if (process.env.APP_AUTO_QUIT === '1') {
    setTimeout(() => {
      app.quit();
    }, 1000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

process.on('uncaughtException', (err) => {
  log.error('Uncaught exception', err);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection', reason);
});
