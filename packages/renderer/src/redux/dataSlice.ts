import type { CustomField, Task, TasksFile } from '@app/shared';
import { parseTasksJson } from '@app/shared';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { collectTaskErrors, validateTask } from './helpers.js';

export interface DataState {
  filePath: string | null;
  tasksFile: TasksFile | null;
  currentBranch: string;
  dirty: { file: boolean; byTaskId: Record<string, boolean> };
  errors: { general: string[]; byTaskId: Record<string, string[]> };
}

const initialState: DataState = {
  filePath: null,
  tasksFile: null,
  currentBranch: 'master',
  dirty: { file: false, byTaskId: {} },
  errors: { general: [], byTaskId: {} },
};

export const loadFromPath = createAsyncThunk('data/loadFromPath', async (path: string, { rejectWithValue }) => {
  try {
    const res = await window.api?.file.read({ path });
    if (!res) {
      throw new Error('No preload API');
    }

    // Use proper Zod validation from shared package
    const tasksFile = parseTasksJson(res.data);

    // Still collect task-level validation errors for the UI
    const errors = collectTaskErrors(tasksFile);

    return { path, tasksFile, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load file';
    return rejectWithValue(msg);
  }
});

export const saveFile = createAsyncThunk('data/saveFile', async (_, { getState, rejectWithValue }) => {
  const state = getState() as { data: DataState };
  if (!state.data.filePath || !state.data.tasksFile) {
    return rejectWithValue('No file to save');
  }
  try {
    const data = JSON.stringify(state.data.tasksFile, null, 2);
    const res = await window.api?.file.write({ path: state.data.filePath, data });
    if (!res?.ok) {
      throw new Error('Write failed');
    }
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save file';
    return rejectWithValue(msg);
  }
});

export const createBranch = createAsyncThunk(
  'data/createBranch',
  async (branchName: string, { getState, rejectWithValue }) => {
    const state = getState() as { data: DataState };
    if (!state.data.tasksFile) {
      return rejectWithValue('No tasks file loaded');
    }
    if (state.data.tasksFile[branchName]) {
      return rejectWithValue(`Branch '${branchName}' already exists`);
    }

    // Create empty branch
    const newBranch = {
      tasks: [],
    };

    const updatedTasksFile = {
      ...state.data.tasksFile,
      [branchName]: newBranch,
    };

    // Save to disk
    if (state.data.filePath) {
      try {
        const data = JSON.stringify(updatedTasksFile, null, 2);
        const res = await window.api?.file.write({ path: state.data.filePath, data });
        if (!res?.ok) {
          throw new Error('Write failed');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save file';
        return rejectWithValue(msg);
      }
    }

    return { branchName, tasksFile: updatedTasksFile };
  },
);

export const addNewTaskAsync = createAsyncThunk(
  'data/addNewTaskAsync',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState() as { data: DataState };
    if (!state.data.tasksFile || !state.data.tasksFile[state.data.currentBranch]) {
      return rejectWithValue('No tasks file loaded or invalid branch');
    }

    const currentBranchTasks = state.data.tasksFile[state.data.currentBranch].tasks;

    // Generate next ID by finding the maximum existing ID and adding 1
    let nextId = 1;
    if (currentBranchTasks.length > 0) {
      const maxId = Math.max(
        ...currentBranchTasks.map((task) => {
          const taskId = typeof task.id === 'string' ? parseInt(task.id, 10) : task.id;
          return isNaN(taskId) ? 0 : taskId;
        }),
      );
      nextId = maxId + 1;
    }

    const newTask: Task = {
      id: nextId,
      title: 'Новая задача',
    };

    // Add task to state via regular action
    dispatch(addNewTask(newTask));

    // Save to file
    try {
      await dispatch(saveFile()).unwrap();
    } catch (error) {
      return rejectWithValue('Failed to save file');
    }

    return { taskId: nextId };
  },
);

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    updateTask(state, action: PayloadAction<{ id: number | string; patch: Partial<Task> }>) {
      if (!state.tasksFile) {
        return;
      }

      const { id, patch } = action.payload;
      const idStr = String(id);
      const currentBranchTasks = state.tasksFile[state.currentBranch]?.tasks || [];
      const idx = currentBranchTasks.findIndex((t: Task) => String(t.id) === idStr);

      if (idx === -1) {
        return;
      }

      const prev = currentBranchTasks[idx];
      const next: Task = { ...prev, ...patch };

      state.tasksFile[state.currentBranch].tasks[idx] = next;
      state.dirty.file = true;
      state.dirty.byTaskId[idStr] = true;

      const errs = validateTask(next);

      if (errs.length) {
        state.errors.byTaskId[idStr] = errs;
      } else {
        delete state.errors.byTaskId[idStr];
      }
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
    setTaskDirty(state, action: PayloadAction<{ taskId: string; isDirty: boolean }>) {
      const { taskId, isDirty } = action.payload;
      if (isDirty) {
        state.dirty.byTaskId[taskId] = true;
        state.dirty.file = true;
      } else {
        delete state.dirty.byTaskId[taskId];
        // Check if any tasks are still dirty
        const hasAnyDirtyTasks = Object.keys(state.dirty.byTaskId).length > 0;
        if (!hasAnyDirtyTasks) {
          state.dirty.file = false;
        }
      }
    },
    switchBranch(state, action: PayloadAction<string>) {
      const branchName = action.payload;
      if (state.tasksFile && state.tasksFile[branchName]) {
        state.currentBranch = branchName;
        // Clear dirty state when switching branches
        state.dirty = { file: false, byTaskId: {} };
        // Clear errors when switching branches
        state.errors = { general: [], byTaskId: {} };
      }
    },
    addNewTask(state, action: PayloadAction<Task>) {
      if (!state.tasksFile || !state.tasksFile[state.currentBranch]) {
        return;
      }

      const newTask = action.payload;
      const taskIdStr = String(newTask.id);

      state.tasksFile[state.currentBranch].tasks.push(newTask);
      state.dirty.file = true;
      state.dirty.byTaskId[taskIdStr] = true;
    },
    deleteTask(state, action: PayloadAction<number | string>) {
      if (!state.tasksFile || !state.tasksFile[state.currentBranch]) {
        return;
      }

      const taskId = action.payload;
      const idStr = String(taskId);
      const currentBranchTasks = state.tasksFile[state.currentBranch].tasks;
      const taskIndex = currentBranchTasks.findIndex((t: Task) => String(t.id) === idStr);

      if (taskIndex === -1) {
        return;
      }

      // Remove task from the list
      state.tasksFile[state.currentBranch].tasks.splice(taskIndex, 1);

      // Mark file as dirty
      state.dirty.file = true;

      // Remove task from dirty tracking and errors
      delete state.dirty.byTaskId[idStr];
      delete state.errors.byTaskId[idStr];
    },
    updateCustomFields(state, action: PayloadAction<CustomField[]>) {
      if (!state.tasksFile || !state.tasksFile[state.currentBranch]) {
        return;
      }

      // Ensure metadata exists
      if (!state.tasksFile[state.currentBranch].metadata) {
        state.tasksFile[state.currentBranch].metadata = {};
      }

      // Update custom fields
      state.tasksFile[state.currentBranch].metadata!.customFields = action.payload;
      state.dirty.file = true;
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
      if (typeof action.payload === 'string') {
        state.errors.general.push(action.payload);
      } else {
        state.errors.general.push('Failed to load file');
      }
    });
    builder.addCase(saveFile.fulfilled, (state) => {
      state.dirty = { file: false, byTaskId: {} };
    });
    builder.addCase(saveFile.rejected, (state, action) => {
      if (typeof action.payload === 'string') {
        state.errors.general.push(action.payload);
      } else {
        state.errors.general.push('Failed to save file');
      }
    });
    builder.addCase(createBranch.fulfilled, (state, action) => {
      state.tasksFile = action.payload.tasksFile;
      state.currentBranch = action.payload.branchName;
      state.dirty = { file: false, byTaskId: {} };
    });
    builder.addCase(createBranch.rejected, (state, action) => {
      if (typeof action.payload === 'string') {
        state.errors.general.push(action.payload);
      } else {
        state.errors.general.push('Failed to create branch');
      }
    });
  },
});

export const {
  updateTask,
  replaceTasksFile,
  setFilePath,
  addGeneralError,
  clearGeneralErrors,
  setTaskDirty,
  switchBranch,
  addNewTask,
  deleteTask,
  updateCustomFields,
} = dataSlice.actions;

// Selectors
export const selectDataPath = (state: { data: DataState }) => state.data.filePath;

export default dataSlice.reducer;
