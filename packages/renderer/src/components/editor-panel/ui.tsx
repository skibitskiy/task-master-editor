import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Flex, Text, Button, TextInput, TabProvider, TabList, Tab } from '@gravity-ui/uikit';
import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { FloppyDisk, Eye, Code } from '@gravity-ui/icons';
import type { Task } from '@app/shared';
import type { RootState } from '../../redux/store';

interface EditorPanelProps {
  taskId: string | null;
  onSave: (content: string) => void;
}

type TaskFieldTab = Extract<keyof Task, 'title' | 'description' | 'details' | 'dependencies' | 'testStrategy'>;

export const EditorPanel: React.FC<EditorPanelProps> = ({ taskId, onSave }) => {
  const [activeFieldTab, setActiveFieldTab] = useState<TaskFieldTab>('description');
  const [editorMode, setEditorMode] = useState<'editor' | 'preview'>('editor');

  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const task = taskId ? tasksFile?.master.tasks.find((t) => String(t.id) === taskId) : null;

  // Get current field content
  const getCurrentFieldContent = React.useCallback((task: Task, field: TaskFieldTab) => {
    switch (field) {
      case 'title':
        return task.title || '';
      case 'description':
        return task.description || '';
      case 'details':
        return task.details || '';
      case 'dependencies':
        return task.dependencies ? task.dependencies.join(', ') : '';
      case 'testStrategy':
        return task.testStrategy || '';
      default:
        return '';
    }
  }, []);

  // Get current content for the active field
  const currentContent = React.useMemo(() => {
    if (!task) return '';
    return getCurrentFieldContent(task, activeFieldTab);
  }, [task, activeFieldTab, getCurrentFieldContent]);

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
            <Text color="secondary">Выберите задачу из списка слева, чтобы начать редактирование</Text>
          </Flex>
        </div>
      </div>
    );
  }

  const availableTabs = [
    { id: 'title', title: 'Заголовок' },
    { id: 'description', title: 'Описание' },
    { id: 'details', title: 'Детали' },
    { id: 'dependencies', title: 'Зависимости' },
    { id: 'testStrategy', title: 'Стратегия тестирования' },
  ];

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <Flex alignItems="center" justifyContent="space-between">
          <Text variant="header-2">
            #{task.id} {task.title}
          </Text>
          <Flex gap={2}>
            {activeFieldTab !== 'title' && activeFieldTab !== 'dependencies' && (
              <Button
                view="outlined"
                size="m"
                onClick={() => setEditorMode(editorMode === 'editor' ? 'preview' : 'editor')}
              >
                <Button.Icon>{editorMode === 'editor' ? <Eye /> : <Code />}</Button.Icon>
                {editorMode === 'editor' ? 'Предпросмотр' : 'Редактор'}
              </Button>
            )}
            <Button view="action" size="m" onClick={handleSave}>
              <Button.Icon>
                <FloppyDisk />
              </Button.Icon>
              Сохранить
            </Button>
          </Flex>
        </Flex>
      </div>

      {/* Task field tabs using gravity-ui tabs */}
      <div className="editor-tabs">
        <TabProvider value={activeFieldTab} onUpdate={(value) => setActiveFieldTab(value as TaskFieldTab)}>
          <TabList>
            {availableTabs.map((tab) => (
              <Tab key={tab.id} value={tab.id}>
                {tab.title}
              </Tab>
            ))}
          </TabList>
        </TabProvider>
      </div>

      <div className="editor-content">
        {activeFieldTab === 'title' ? (
          <div className="title-editor">
            <TextInput value={currentContent} placeholder="Введите название задачи..." size="l" view="normal" />
          </div>
        ) : activeFieldTab === 'dependencies' ? (
          <div className="dependencies-editor">
            <TextInput
              value={currentContent}
              placeholder="Введите зависимости через запятую (например: 1, 2, 3)"
              size="l"
              view="normal"
            />
          </div>
        ) : activeFieldTab === 'testStrategy' ? (
          <div className="test-strategy-editor">
            <MarkdownEditorView editor={editor} autofocus stickyToolbar />
          </div>
        ) : (
          <div className="markdown-editor-wrapper">
            <MarkdownEditorView editor={editor} autofocus stickyToolbar />
          </div>
        )}
      </div>
    </div>
  );
};
