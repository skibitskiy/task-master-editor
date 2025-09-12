import electron from 'electron';
const { ipcMain, dialog, app } = electron;
import { promises as fs } from 'node:fs';

import type { SettingsData } from '@app/shared';
import {
  Channels,
  parseTasksJson,
  validateFileReadInput,
  validateFileReadResult,
  validateFileWriteInput,
  validateFileWriteResult,
  validateSettingsData,
  validateSettingsGetResult,
  validateSettingsUpdateInput,
  validateSettingsUpdateResult,
  validateWorkspaceSelectOptions,
  validateWorkspaceSelectResult,
} from '@app/shared';
import log from 'electron-log/main.js';

import { atomicWriteTasksJsonWithBackup } from './fsAtomic.js';

type InternalSettings = SettingsData;

let cachedSettings: InternalSettings | null = null;
async function settingsPath(): Promise<string> {
  const dir = app.getPath('userData');
  const path = `${dir}/settings.json`;
  return path;
}

async function loadSettings(): Promise<InternalSettings> {
  if (cachedSettings) {
    return cachedSettings;
  }
  try {
    const p = await settingsPath();
    const raw = await fs.readFile(p, 'utf-8');
    cachedSettings = validateSettingsData(JSON.parse(raw));
  } catch (err) {
    cachedSettings = { recentPaths: [], preferences: {}, customModels: [] };
  }
  return cachedSettings!;
}

async function saveSettings(s: InternalSettings): Promise<void> {
  const p = await settingsPath();
  const data = JSON.stringify(s, null, 2);
  await fs.mkdir(p.substring(0, p.lastIndexOf('/')), { recursive: true });
  await fs.writeFile(p, data, 'utf-8');
  cachedSettings = s;
}

export function registerIpcHandlers() {
  ipcMain.handle(Channels.workspaceSelect, async (_event: unknown, rawOptions: unknown) => {
    try {
      const options = validateWorkspaceSelectOptions(rawOptions ?? {});
      const props: Array<'openDirectory' | 'openFile' | 'multiSelections'> = [];
      if (options.type === 'directory') {
        props.push('openDirectory');
      }
      if (options.type === 'file') {
        props.push('openFile');
      }
      if (options.multiple) {
        props.push('multiSelections');
      }

      const result = await dialog.showOpenDialog({ properties: props });
      const payload = { paths: result.canceled ? [] : result.filePaths };
      return validateWorkspaceSelectResult(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('workspace:select error', err);
      throw new Error(`workspace:select validation/error: ${msg}`);
    }
  });

  ipcMain.handle(Channels.fileRead, async (_event: unknown, rawInput: unknown) => {
    try {
      const input = validateFileReadInput(rawInput);
      const fileEncoding: BufferEncoding = 'utf8';
      const data = await fs.readFile(input.path, { encoding: fileEncoding });
      // validate JSON and schema for tasks file
      try {
        parseTasksJson(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(msg);
      }
      return validateFileReadResult({ data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('file:read error', err);
      throw new Error(`file:read validation/error: ${msg}`);
    }
  });

  ipcMain.handle(Channels.fileWrite, async (_event: unknown, rawInput: unknown) => {
    try {
      const input = validateFileWriteInput(rawInput);
      await atomicWriteTasksJsonWithBackup(input.path, input.data);
      return validateFileWriteResult({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('file:write error', err);
      throw new Error(`file:write validation/error: ${msg}`);
    }
  });

  ipcMain.handle(Channels.settingsGet, async () => {
    const settings = await loadSettings();
    return validateSettingsGetResult({ settings });
  });

  ipcMain.handle(Channels.settingsUpdate, async (_event: unknown, rawInput: unknown) => {
    const input = validateSettingsUpdateInput(rawInput);

    // Clear cache to ensure we read from file
    cachedSettings = null;

    const current = await loadSettings();
    const merged: InternalSettings = {
      recentPaths: input.settings.recentPaths ?? current.recentPaths,
      preferences: input.settings.preferences ?? current.preferences ?? {},
      customModels: input.settings.customModels ?? current.customModels ?? [],
    };
    await saveSettings(merged);
    return validateSettingsUpdateResult({ settings: merged });
  });
}
