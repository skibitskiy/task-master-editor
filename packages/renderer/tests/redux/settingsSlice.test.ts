import type { PreloadAPI, SettingsGetResult, SettingsUpdateResult } from '@app/shared';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import settingsReducer, { initSettings, updateMRU } from '../../src/redux/settingsSlice';

function makeStore() {
  return configureStore({ reducer: { settings: settingsReducer } });
}

describe('settingsSlice: init and MRU', () => {
  beforeEach(() => {
    const api: PreloadAPI = {
      workspace: { select: async () => ({ paths: [] }) },
      file: {
        read: async () => ({ data: '' }),
        write: async () => ({ ok: true as const }),
      },
      settings: {
        get: async (): Promise<SettingsGetResult> => ({
          settings: { recentPaths: [], preferences: {} },
        }),
        update: async (): Promise<SettingsUpdateResult> => ({
          settings: { recentPaths: [], preferences: {} },
        }),
      },
      chat: {
        getList: async () => ({ chats: [] }),
        create: async () => ({
          chat: { id: 'test', name: 'Test', projectPath: '', messages: [], createdAt: 0, updatedAt: 0 },
        }),
        updateName: async () => ({ ok: true }),
        delete: async () => ({ ok: true }),
        addMessage: async () => ({ message: { id: 1, content: '', sender: 'user' as const, timestamp: 0 } }),
        getMessages: async () => ({ messages: [] }),
      },
    };
    (globalThis as unknown as { window: { api: PreloadAPI } }).window = { api };
  });

  it('initSettings loads settings or defaults', async () => {
    const store = makeStore();
    const getMock: () => Promise<SettingsGetResult> = vi.fn(async () => ({
      settings: { recentPaths: ['/a'], preferences: { mruEnabled: true } },
    }));
    (globalThis as unknown as { window: { api: PreloadAPI } }).window.api.settings.get = getMock;
    await store.dispatch(initSettings());
    expect(store.getState().settings.data.recentPaths).toEqual(['/a']);

    // with empty response -> defaults
    const store2 = makeStore();
    const getEmpty: () => Promise<SettingsGetResult> = vi.fn(async () => ({
      settings: { recentPaths: [], preferences: {} },
    }));
    (globalThis as unknown as { window: { api: PreloadAPI } }).window.api.settings.get = getEmpty;
    await store2.dispatch(initSettings());
    expect(store2.getState().settings.data.recentPaths).toEqual([]);
  });

  it('updateMRU dedups, prepends and limits to 10', async () => {
    const store = makeStore();
    // seed state
    store.dispatch({
      type: 'settings/setSettings',
      payload: { recentPaths: ['/b', '/c'], preferences: {} },
    });
    const updateMock: ({
      settings,
    }: {
      settings: { recentPaths?: string[]; preferences?: Record<string, unknown> };
    }) => Promise<SettingsUpdateResult> = vi.fn(async ({ settings }) => ({
      settings: {
        recentPaths: settings.recentPaths ?? [],
        preferences: settings.preferences ?? {},
      },
    }));
    (globalThis as unknown as { window: { api: PreloadAPI } }).window.api.settings.update = updateMock;

    await store.dispatch(updateMRU('/a'));
    expect(store.getState().settings.data.recentPaths).toEqual(['/a', '/b', '/c']);

    await store.dispatch(updateMRU('/b'));
    expect(store.getState().settings.data.recentPaths.slice(0, 2)).toEqual(['/b', '/a']);

    // fill to >10
    for (let i = 0; i < 15; i++) {
      await store.dispatch(updateMRU(`/x${i}`));
    }
    expect(store.getState().settings.data.recentPaths.length).toBe(10);
  });
});
