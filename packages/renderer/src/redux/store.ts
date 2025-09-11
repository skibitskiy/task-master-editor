import { configureStore } from '@reduxjs/toolkit';
import data from './dataSlice.js';
import settings from './settingsSlice.js';
import { taskSliceReducer } from './task/taskSlice.js';

export const store = configureStore({
  reducer: { data, settings, task: taskSliceReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
