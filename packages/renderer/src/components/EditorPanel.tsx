import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Flex, Text, Button } from '@gravity-ui/uikit';
import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { FloppyDisk, Eye, Code } from '@gravity-ui/icons';
import type { RootState } from '../redux/store';

interface EditorPanelProps {
  taskId: string | null;
  onSave: (content: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ taskId, onSave }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const task = taskId ? tasksFile?.master.tasks.find((t) => String(t.id) === taskId) : null;

  const editor = useMarkdownEditor({});

  const handleSave = React.useCallback(() => {
    const value = editor.getValue();
    onSave(value);
  }, [editor, onSave]);

  if (!task) {
    return (
      <div className="editor-panel">
        <div className="editor-placeholder">
          <Flex direction="column" alignItems="center" gap={3}>
            <div style={{ color: 'var(--g-color-text-secondary)' }}>
              <Code width={48} height={48} />
            </div>
            <Text variant="header-2" color="secondary">
              Выберите задачу для редактирования
            </Text>
            <Text color="secondary">
              Выберите задачу из списка слева, чтобы начать редактирование
            </Text>
          </Flex>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <Flex alignItems="center" justifyContent="space-between">
          <Text variant="header-2">{task.title}</Text>
          <Flex gap={2}>
            <Button
              view="outlined"
              size="m"
              onClick={() => setActiveTab(activeTab === 'editor' ? 'preview' : 'editor')}
            >
              <Button.Icon>{activeTab === 'editor' ? <Eye /> : <Code />}</Button.Icon>
              {activeTab === 'editor' ? 'Предпросмотр' : 'Редактор'}
            </Button>
            <Button view="action" size="m" onClick={handleSave}>
              <Button.Icon>
                <FloppyDisk />
              </Button.Icon>
              Сохранить
            </Button>
          </Flex>
        </Flex>
      </div>

      <div className="editor-content">
        <div className="markdown-editor-wrapper">
          <MarkdownEditorView editor={editor} autofocus stickyToolbar />
        </div>
      </div>
    </div>
  );
};
