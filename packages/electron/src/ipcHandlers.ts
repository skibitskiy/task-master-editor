import electron from 'electron';
const { ipcMain, dialog } = electron;
import { promises as fs } from 'node:fs';
import log from 'electron-log/main.js';
import {
  Channels,
  validateWorkspaceSelectOptions,
  validateWorkspaceSelectResult,
  validateFileReadInput,
  validateFileReadResult,
  validateFileWriteInput,
  validateFileWriteResult,
} from '@app/shared';

export function registerIpcHandlers() {
  ipcMain.handle(Channels.workspaceSelect, async (_event: unknown, rawOptions: unknown) => {
    try {
      const options = validateWorkspaceSelectOptions(rawOptions ?? {});
      const props: Array<'openDirectory' | 'openFile' | 'multiSelections'> = [];
      if (options.type === 'directory') props.push('openDirectory');
      if (options.type === 'file') props.push('openFile');
      if (options.multiple) props.push('multiSelections');

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
      const data = await fs.readFile(input.path, { encoding: input.encoding });
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
      await fs.writeFile(input.path, input.data, { encoding: input.encoding });
      return validateFileWriteResult({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('file:write error', err);
      throw new Error(`file:write validation/error: ${msg}`);
    }
  });
}
