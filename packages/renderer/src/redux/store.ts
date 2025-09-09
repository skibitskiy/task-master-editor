import { configureStore } from '@reduxjs/toolkit';
import data from './dataSlice.js';
import settings from './settingsSlice.js';

export const store = configureStore({
  reducer: { data, settings },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
