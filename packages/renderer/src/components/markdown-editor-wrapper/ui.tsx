import { TaskField } from '@app/shared';
import { MarkdownEditorView } from '@gravity-ui/markdown-editor';
import React, { useEffect } from 'react';

import { useMarkdownFieldEditor } from '../editor/lib/use-markdown-field-editor';
import styles from './styles.module.css';

interface MarkdownEditorWrapperProps {
  field: TaskField | string;
  initialValue: string;
  onChange: (field: string, value: string) => void;
  editorMode: 'preview' | 'editor';
  autofocus?: boolean;
  stickyToolbar?: boolean;
  editorKey?: string;
}

export const MarkdownEditorWrapper: React.FC<MarkdownEditorWrapperProps> = ({
  field,
  initialValue,
  onChange,
  editorMode,
  autofocus = false,
  stickyToolbar = false,
  editorKey,
}) => {
  const fieldEditorData = useMarkdownFieldEditor({
    field,
    initialValue,
    onChange: (_, value: string) => onChange(field, value),
  });

  const fieldEditor = fieldEditorData.editor;

  useEffect(() => {
    if (editorMode === 'preview') {
      fieldEditor.setEditorMode('wysiwyg');
    } else if (editorMode === 'editor') {
      fieldEditor.setEditorMode('markup');
    }
  }, [editorMode, fieldEditor]);

  return (
    <div className={styles.markdownEditorWrapper}>
      <MarkdownEditorView
        key={editorKey || `${field}-editor`}
        editor={fieldEditor}
        autofocus={autofocus}
        stickyToolbar={stickyToolbar}
        wysiwygToolbarConfig={fieldEditorData.toolbarConfigs.wysiwyg}
        markupToolbarConfig={fieldEditorData.toolbarConfigs.markup}
      />
    </div>
  );
};
