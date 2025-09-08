import { app, BrowserWindow } from 'electron';
import log from 'electron-log/main';
import { createWindow } from './main';

log.initialize();
log.info('Task Master Editor starting');

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
