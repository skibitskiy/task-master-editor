import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

import chat from './chatSlice.js';
import data from './dataSlice.js';
import editor from './editorSlice.js';
import settings from './settingsSlice.js';
import { taskSliceReducer } from './task/taskSlice.js';

export const store = configureStore({
  reducer: { data, settings, editor, chat, task: taskSliceReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
