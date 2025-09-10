import React from 'react';
import { useMarkdownEditor } from '@gravity-ui/markdown-editor';
import type { TaskFieldTab } from './types';

interface UseMarkdownFieldEditorParams {
  field: Extract<TaskFieldTab, 'description' | 'details' | 'testStrategy'>;
  initialValue: string;
  onChange: (field: TaskFieldTab, value: string) => void;
}

export const useMarkdownFieldEditor = ({ field, initialValue, onChange }: UseMarkdownFieldEditorParams) => {
  const editor = useMarkdownEditor({
    initial: { markup: initialValue },
  });

  React.useEffect(() => {
    const handler = (_: null) => onChange(field, editor.getValue());
    editor.on('change', handler);
    return () => editor.off('change', handler);
  }, [editor, field, onChange]);

  return editor;
};
