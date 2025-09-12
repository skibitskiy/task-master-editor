import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EditorState {
  mode: 'editor' | 'preview';
}

const initialState: EditorState = {
  mode: 'preview',
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setEditorMode(state, action: PayloadAction<'editor' | 'preview'>) {
      state.mode = action.payload;
    },
    toggleEditorMode(state) {
      state.mode = state.mode === 'editor' ? 'preview' : 'editor';
    },
  },
});

export const { setEditorMode, toggleEditorMode } = editorSlice.actions;
export default editorSlice.reducer;
