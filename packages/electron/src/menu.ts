import electron from 'electron';
const { Menu, app, dialog } = electron;
import type { BrowserWindow as BrowserWindowType, MenuItemConstructorOptions } from 'electron';

import { logger } from './logger.js';

let mainWindow: BrowserWindowType | null = null;
let isDirty = false;

export function setMainWindow(window: BrowserWindowType | null) {
  mainWindow = window;
}

export function setDirtyState(dirty: boolean) {
  isDirty = dirty;
  updateMenuState();
}

function updateMenuState() {
  const menu = Menu.getApplicationMenu();
  if (!menu) {
    return;
  }

  const saveItem = menu.getMenuItemById('save');
  if (saveItem) {
    saveItem.enabled = isDirty;
  }
}

async function handleOpenFile() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    if (!mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('menu:open-file', result.filePaths[0]);
    }
  }
}

function handleSave() {
  if (!mainWindow || !isDirty || mainWindow.isDestroyed()) {
    return;
  }

  if (mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('menu:save');
  }
}

function handleExit() {
  app.quit();
}

export function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const fileMenu: MenuItemConstructorOptions = {
    label: 'File',
    submenu: [
      {
        id: 'open',
        label: 'Open File...',
        accelerator: 'CmdOrCtrl+O',
        click: handleOpenFile,
      },
      {
        id: 'save',
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        enabled: false,
        click: handleSave,
      },
      { type: 'separator' },
      {
        id: 'exit',
        label: isMac ? 'Quit' : 'Exit',
        accelerator: isMac ? 'Cmd+Q' : 'Ctrl+Q',
        click: handleExit,
      },
    ],
  };

  const template: MenuItemConstructorOptions[] = [];

  if (isMac) {
    template.push({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Cmd+Q',
          click: handleExit,
        },
      ],
    });
  }

  template.push(fileMenu);

  if (isMac) {
    template.push({
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    });
  }

  if (process.env.NODE_ENV === 'development') {
    template.push({
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  logger.info('Application menu created');
}
