import * as electron from 'electron';
const { app, BrowserWindow, ipcMain } = electron;
import { logger } from './logger.js';
import { createWindow } from './main.js';
import { registerIpcHandlers } from './ipcHandlers.js';

logger.info('Task Master Editor starting');

// Register IPC handlers early
registerIpcHandlers();

// Register logging IPC handlers
ipcMain.on('log:debug', (_event, message, ...args) => {
  logger.debug(`[Renderer] ${message}`, ...args);
});

ipcMain.on('log:info', (_event, message, ...args) => {
  logger.info(`[Renderer] ${message}`, ...args);
});

ipcMain.on('log:warn', (_event, message, ...args) => {
  logger.warn(`[Renderer] ${message}`, ...args);
});

ipcMain.on('log:error', (_event, message, ...args) => {
  logger.error(`[Renderer] ${message}`, ...args);
});

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

// Process error handlers are already set up in logger.ts
