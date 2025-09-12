import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { SettingsData, SettingsGetResult } from '@app/shared';

export interface SettingsState {
  data: SettingsData;
  loaded: boolean;
}

const initialState: SettingsState = {
  data: { recentPaths: [], preferences: {} },
  loaded: false,
};

export const initSettings = createAsyncThunk('settings/init', async () => {
  const res: SettingsGetResult | undefined = await window.api?.settings.get();
  return res?.settings ?? { recentPaths: [], preferences: {} };
});

export const updateMRU = createAsyncThunk('settings/updateMRU', async (path: string, { getState }) => {
  const state = getState() as { settings: SettingsState };
  const list = state.settings.data.recentPaths.filter((p) => p !== path);
  list.unshift(path);
  const recentPaths = list.slice(0, 10);
  const res = await window.api?.settings.update({ settings: { recentPaths } });
  return res?.settings ?? { recentPaths, preferences: state.settings.data.preferences };
});

export const removeFromMRU = createAsyncThunk('settings/removeFromMRU', async (pathToRemove: string, { getState }) => {
  const state = getState() as { settings: SettingsState };
  console.log('🗑️ Redux removeFromMRU - current state:', state.settings.data);
  console.log('🗑️ Redux removeFromMRU - pathToRemove:', pathToRemove);

  const recentPaths = state.settings.data.recentPaths.filter((p) => p !== pathToRemove);
  console.log('🗑️ Redux removeFromMRU - filtered paths:', recentPaths);

  const updatePayload = { settings: { recentPaths } };
  console.log('🗑️ Redux removeFromMRU - sending to API:', updatePayload);

  const res = await window.api?.settings.update(updatePayload);
  console.log('🗑️ Redux removeFromMRU - API response:', res);

  const finalResult = res?.settings ?? { recentPaths, preferences: state.settings.data.preferences };
  console.log('🗑️ Redux removeFromMRU - returning:', finalResult);

  return finalResult;
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings(state, action: PayloadAction<SettingsData>) {
      state.data = action.payload;
      state.loaded = true;
    },
  },
  extraReducers(builder) {
    builder.addCase(initSettings.fulfilled, (state, action) => {
      state.data = action.payload;
      state.loaded = true;
    });
    builder.addCase(updateMRU.fulfilled, (state, action) => {
      state.data = action.payload;
    });
    builder.addCase(removeFromMRU.fulfilled, (state, action) => {
      state.data = action.payload;
    });
  },
});

export const { setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
