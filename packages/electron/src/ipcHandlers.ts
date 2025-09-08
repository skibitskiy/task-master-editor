import * as electron from 'electron';
const { ipcMain, dialog } = electron;
import { promises as fs } from 'node:fs';
import log from 'electron-log/main.js';
// Inline channels and validators to avoid requiring ESM from CJS
const Channels = {
  workspaceSelect: 'workspace:select',
  fileRead: 'file:read',
  fileWrite: 'file:write',
} as const;

function validateWorkspaceSelectOptions(raw: unknown) {
  const o = (raw ?? {}) as Record<string, unknown>;
  const type = (o.type as unknown) ?? 'directory';
  if (type !== 'directory' && type !== 'file') throw new Error('type must be "directory" or "file"');
  const multiple = (o.multiple as unknown) ?? false;
  if (typeof multiple !== 'boolean') throw new Error('multiple must be boolean');
  return { type: type as 'directory' | 'file', multiple: multiple as boolean };
}
function validateWorkspaceSelectResult(raw: unknown) {
  const o = (raw ?? {}) as Record<string, unknown>;
  const paths = Array.isArray(o.paths) ? (o.paths as unknown[]) : [];
  if (!paths.every((p: unknown) => typeof p === 'string')) throw new Error('paths must be string[]');
  return { paths: paths as string[] };
}
function validateFileReadInput(raw: unknown) {
  const o = (raw ?? {}) as Record<string, unknown>;
  const path = o.path as unknown;
  if (typeof path !== 'string' || path.length < 1) throw new Error('path must be non-empty string');
  const encoding = (o.encoding as unknown) ?? 'utf-8';
  if (encoding !== 'utf-8') throw new Error('encoding must be "utf-8"');
  return { path: path as string, encoding: encoding as 'utf-8' };
}
function validateFileReadResult(raw: unknown) {
  const o = (raw ?? {}) as Record<string, unknown>;
  if (typeof o.data !== 'string') throw new Error('data must be string');
  return { data: o.data as string };
}
function validateFileWriteInput(raw: unknown) {
  const o = (raw ?? {}) as Record<string, unknown>;
  const path = o.path as unknown;
  const data = o.data as unknown;
  if (typeof path !== 'string' || path.length < 1) throw new Error('path must be non-empty string');
  if (typeof data !== 'string') throw new Error('data must be string');
  const encoding = (o.encoding as unknown) ?? 'utf-8';
  if (encoding !== 'utf-8') throw new Error('encoding must be "utf-8"');
  return { path: path as string, data: data as string, encoding: encoding as 'utf-8' };
}
function validateFileWriteResult(raw: unknown) {
  const o = (raw ?? {}) as Record<string, unknown>;
  const ok = (o as Record<string, unknown>).ok;
  if (ok !== true) throw new Error('ok must be true');
  return { ok: true as const };
}

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
