import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import dataReducer, { updateTask, replaceTasksFile, loadFromPath, saveFile } from '../../src/redux/dataSlice';
import type { PreloadAPI, FileReadInput, FileReadResult, FileWriteInput, FileWriteResult, TasksFile, Task } from '@app/shared';

function makeStore() {
  return configureStore({ reducer: { data: dataReducer } });
}

describe('dataSlice: dirty, load/save, reducers', () => {
  beforeEach(() => {
    // fresh mock window.api each test with fully typed stub
    const api: PreloadAPI = {
      workspace: { select: async () => ({ paths: [] }) },
      file: {
        read: async (_input: FileReadInput): Promise<FileReadResult> => ({ data: '' }),
        write: async (_input: FileWriteInput): Promise<FileWriteResult> => ({ ok: true as const }),
      },
      settings: {
        get: async () => ({ settings: { recentPaths: [], preferences: {} } }),
        update: async ({ settings }) => ({ settings: { recentPaths: settings.recentPaths ?? [], preferences: settings.preferences ?? {} } }),
      },
    };
    (globalThis as unknown as { window: { api: PreloadAPI } }).window = { api };
  });

  it('updateTask marks dirty and updates errors', () => {
    const store = makeStore();
    const tf: TasksFile = { master: { tasks: [{ id: 1, title: 'ok' } as Task], metadata: {} } };
    store.dispatch(replaceTasksFile(tf));
    store.dispatch(updateTask({ id: 1, patch: { title: '' } }));
    const s = store.getState().data;
    expect(s.dirty.file).toBe(true);
    expect(s.dirty.byTaskId['1']).toBe(true);
    expect(Object.keys(s.errors.byTaskId)).toContain('1');
  });

  it('loadFromPath loads JSON and resets dirty; collects task errors', async () => {
    const store = makeStore();
    const json = JSON.stringify({ master: { tasks: [{ id: 1, title: '' }] } });
    const readMock: (input: FileReadInput) => Promise<FileReadResult> = vi.fn(async (_input) => ({ data: json }));
    (globalThis as unknown as { window: { api: PreloadAPI } }).window.api.file.read = readMock;

    await store.dispatch(loadFromPath('/tmp/tasks.json'));
    const s = store.getState().data;
    expect(s.filePath).toBe('/tmp/tasks.json');
    expect(s.dirty.file).toBe(false);
    expect(Object.keys(s.errors.byTaskId)).toContain('1');
  });

  it('loadFromPath failure records general error', async () => {
    const store = makeStore();
    const readFail: (input: FileReadInput) => Promise<FileReadResult> = vi.fn(async () => {
      throw new Error('fail');
    }) as unknown as (input: FileReadInput) => Promise<FileReadResult>;
    (globalThis as unknown as { window: { api: PreloadAPI } }).window.api.file.read = readFail;
    await store.dispatch(loadFromPath('/nope.json'));
    const s = store.getState().data;
    expect(s.errors.general.at(-1)).toMatch(/fail|Failed to load/);
  });

  it('saveFile success clears dirty; failure records error', async () => {
    const store = makeStore();
    // preload a file
    const tf2: TasksFile = { master: { tasks: [{ id: 1, title: 'ok' } as Task] } };
    store.dispatch(replaceTasksFile(tf2));
    // mark path and dirty
    store.dispatch({ type: 'data/setFilePath', payload: '/tmp/x.json' });
    // mock write
    const writeOk: (input: FileWriteInput) => Promise<FileWriteResult> = vi.fn(async (_input) => ({ ok: true as const }));
    (globalThis as unknown as { window: { api: PreloadAPI } }).window.api.file.write = writeOk;
    await store.dispatch(saveFile());
    expect(store.getState().data.dirty.file).toBe(false);

    // failure path
    store.dispatch(updateTask({ id: 1, patch: { title: 'changed' } }));
    const writeFail: (input: FileWriteInput) => Promise<FileWriteResult> = vi.fn(async () => {
      throw new Error('cant write');
    }) as unknown as (input: FileWriteInput) => Promise<FileWriteResult>;
    (globalThis as unknown as { window: { api: PreloadAPI } }).window.api.file.write = writeFail;
    await store.dispatch(saveFile());
    expect(store.getState().data.errors.general.at(-1)).toMatch(/cant write|Failed to save/);
  });
});
