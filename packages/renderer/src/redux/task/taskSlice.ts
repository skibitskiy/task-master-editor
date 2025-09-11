import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TaskFieldTab } from '../../shared/editor-context/types';

export interface TaskState {
  selectedTaskId: string | null;
  activeFieldTab: TaskFieldTab;
}

const initialState: TaskState = {
  selectedTaskId: null,
  activeFieldTab: 'description',
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setSelectedTaskId(state, action: PayloadAction<string | null>) {
      state.selectedTaskId = action.payload;
    },
    clearSelectedTask(state) {
      state.selectedTaskId = null;
    },
    setActiveFieldTab(state, action: PayloadAction<TaskFieldTab>) {
      state.activeFieldTab = action.payload;
    },
  },
});

const taskSliceReducer = taskSlice.reducer;

const { setSelectedTaskId, clearSelectedTask, setActiveFieldTab } = taskSlice.actions;

export { setSelectedTaskId, clearSelectedTask, setActiveFieldTab, taskSliceReducer };
