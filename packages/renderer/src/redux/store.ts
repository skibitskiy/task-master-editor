import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import data from './dataSlice.js';
import settings from './settingsSlice.js';
import editor from './editorSlice.js';
import { taskSliceReducer } from './task/taskSlice.js';

export const store = configureStore({
  reducer: { data, settings, editor, task: taskSliceReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
