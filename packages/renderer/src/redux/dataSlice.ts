import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Task, TasksFile } from '@app/shared';
import { parseTasksJson } from '@app/shared';
import { collectTaskErrors, validateTask } from './helpers.js';

export interface DataState {
  filePath: string | null;
  tasksFile: TasksFile | null;
  dirty: { file: boolean; byTaskId: Record<string, boolean> };
  errors: { general: string[]; byTaskId: Record<string, string[]> };
}

const initialState: DataState = {
  filePath: null,
  tasksFile: null,
  dirty: { file: false, byTaskId: {} },
  errors: { general: [], byTaskId: {} },
};

export const loadFromPath = createAsyncThunk(
  'data/loadFromPath',
  async (path: string, { rejectWithValue }) => {
    try {
      const res = await window.api?.file.read({ path });
      if (!res) throw new Error('No preload API');

      // Use proper Zod validation from shared package
      const tasksFile = parseTasksJson(res.data);

      // Still collect task-level validation errors for the UI
      const errors = collectTaskErrors(tasksFile);

      return { path, tasksFile, errors };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load file';
      return rejectWithValue(msg);
    }
  },
);

export const saveFile = createAsyncThunk(
  'data/saveFile',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { data: DataState };
    if (!state.data.filePath || !state.data.tasksFile) return rejectWithValue('No file to save');
    try {
      const data = JSON.stringify(state.data.tasksFile, null, 2);
      const res = await window.api?.file.write({ path: state.data.filePath, data });
      if (!res?.ok) throw new Error('Write failed');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save file';
      return rejectWithValue(msg);
    }
  },
);

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    updateTask(state, action: PayloadAction<{ id: number | string; patch: Partial<Task> }>) {
      if (!state.tasksFile) return;
      const { id, patch } = action.payload;
      const idStr = String(id);
      const idx = state.tasksFile.master.tasks.findIndex((t: Task) => String(t.id) === idStr);
      if (idx === -1) return;
      const prev = state.tasksFile.master.tasks[idx];
      const next: Task = { ...prev, ...patch };
      state.tasksFile.master.tasks[idx] = next;
      state.dirty.file = true;
      state.dirty.byTaskId[idStr] = true;
      const errs = validateTask(next);
      if (errs.length) state.errors.byTaskId[idStr] = errs;
      else delete state.errors.byTaskId[idStr];
    },
    replaceTasksFile(state, action: PayloadAction<TasksFile>) {
      state.tasksFile = action.payload;
      state.dirty = { file: true, byTaskId: {} };
      state.errors = { general: [], byTaskId: collectTaskErrors(action.payload) };
    },
    setFilePath(state, action: PayloadAction<string | null>) {
      state.filePath = action.payload;
    },
    addGeneralError(state, action: PayloadAction<string>) {
      state.errors.general.push(action.payload);
    },
    clearGeneralErrors(state) {
      state.errors.general = [];
    },
  },
  extraReducers(builder) {
    builder.addCase(loadFromPath.fulfilled, (state, action) => {
      state.filePath = action.payload.path;
      state.tasksFile = action.payload.tasksFile;
      state.errors.general = [];
      state.errors.byTaskId = action.payload.errors;
      state.dirty = { file: false, byTaskId: {} };
    });
    builder.addCase(loadFromPath.rejected, (state, action) => {
      if (typeof action.payload === 'string') state.errors.general.push(action.payload);
      else state.errors.general.push('Failed to load file');
    });
    builder.addCase(saveFile.fulfilled, (state) => {
      state.dirty = { file: false, byTaskId: {} };
    });
    builder.addCase(saveFile.rejected, (state, action) => {
      if (typeof action.payload === 'string') state.errors.general.push(action.payload);
      else state.errors.general.push('Failed to save file');
    });
  },
});

export const { updateTask, replaceTasksFile, setFilePath, addGeneralError, clearGeneralErrors } =
  dataSlice.actions;
export default dataSlice.reducer;
