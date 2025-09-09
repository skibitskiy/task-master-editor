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

export const updateMRU = createAsyncThunk(
  'settings/updateMRU',
  async (path: string, { getState }) => {
    const state = getState() as { settings: SettingsState };
    const list = state.settings.data.recentPaths.filter((p) => p !== path);
    list.unshift(path);
    const recentPaths = list.slice(0, 10);
    const res = await window.api?.settings.update({ settings: { recentPaths } });
    return res?.settings ?? { recentPaths, preferences: state.settings.data.preferences };
  },
);

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
  },
});

export const { setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
