import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Flex, Text, TextInput } from '@gravity-ui/uikit';
import { MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { Code } from '@gravity-ui/icons';
import type { RootState, AppDispatch } from '../../redux/store';
import { saveFile, updateTask } from '../../redux/dataSlice';
import { notifySuccess, notifyError } from '../../utils/notify';
import { EditorPanelHeader } from '../editor-panel-header';
import { EditorPanelTabs } from '../editor-panel-tabs';
import { useTaskForm } from './lib/use-task-form';
import type { TaskFieldTab } from './lib/types';
import { useMarkdownFieldEditor } from './lib/use-markdown-field-editor';
import { tabTypeGuard } from './lib/tab-type-guard';

interface EditorPanelProps {
  taskId: string | null;
  onSave?: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ taskId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeFieldTab, setActiveFieldTab] = useState<TaskFieldTab>('description');
  const [editorMode, setEditorMode] = useState<'editor' | 'preview'>('editor');

  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const dirtyState = useSelector((state: RootState) => state.data.dirty);
  const task = taskId ? tasksFile?.master.tasks.find((t) => String(t.id) === taskId) : null;
  const isTaskDirty = taskId ? dirtyState.byTaskId[taskId] : false;

  const { localValues, validationErrors, setValidationErrors, handleFieldChange, isFieldDirty, validateField } =
    useTaskForm({ task });

  // Get current content for the active field
  const currentContent = React.useMemo(() => {
    return localValues[activeFieldTab];
  }, [localValues, activeFieldTab]);

  // Initialize individual markdown editors for each markdown field
  const descriptionEditor = useMarkdownFieldEditor({
    field: 'description',
    initialValue: localValues.description,
    onChange: handleFieldChange,
  });
  const detailsEditor = useMarkdownFieldEditor({
    field: 'details',
    initialValue: localValues.details,
    onChange: handleFieldChange,
  });
  const testStrategyEditor = useMarkdownFieldEditor({
    field: 'testStrategy',
    initialValue: localValues.testStrategy,
    onChange: handleFieldChange,
  });

  // Handle save button click
  const handleSave = useCallback(async () => {
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      // Dispatch save action and wait for completion
      if (!taskId) throw new Error('Отсутствует ID задачи');

      const dependencies = localValues.dependencies
        .split(',')
        .map((d) => parseInt(d.trim()))
        .filter(Boolean);

      dispatch(
        updateTask({
          id: parseInt(taskId),
          patch: {
            title: localValues.title,
            description: localValues.description,
            details: localValues.details,
            dependencies: dependencies.length > 0 ? dependencies : undefined,
            testStrategy: localValues.testStrategy,
            id: parseInt(taskId),
            priority: task?.priority,
            status: task?.status,
          },
        }),
      );

      const result = await dispatch(saveFile());

      if (saveFile.fulfilled.match(result)) {
        notifySuccess('Сохранено', 'Все изменения успешно сохранены');
      } else if (saveFile.rejected.match(result)) {
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Неизвестная ошибка';
        notifyError('Ошибка сохранения', errorMessage);
      }
    } catch (error) {
      console.error('Save error:', error);
      notifyError('Ошибка сохранения', 'Произошла неожиданная ошибка при сохранении файла');
    }
  }, [dispatch, validationErrors]);

  // EditorPanelTabs props
  const availableTabs = [
    { id: 'title', title: 'Заголовок', isDirty: isFieldDirty('title'), hasError: !!validationErrors.title },
    { id: 'description', title: 'Описание', isDirty: isFieldDirty('description'), hasError: false },
    { id: 'details', title: 'Детали', isDirty: isFieldDirty('details'), hasError: false },
    {
      id: 'dependencies',
      title: 'Зависимости',
      isDirty: isFieldDirty('dependencies'),
      hasError: !!validationErrors.dependencies,
    },
    { id: 'testStrategy', title: 'Стратегия тестирования', isDirty: isFieldDirty('testStrategy'), hasError: false },
  ];

  const handleTabsChange = (tab: string) => {
    if (tabTypeGuard(tab)) {
      setActiveFieldTab(tab);
    }
  };

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

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <EditorPanelHeader
          taskId={String(task.id)}
          taskTitle={task.title}
          editorMode={editorMode}
          showModeToggle={activeFieldTab !== 'title' && activeFieldTab !== 'dependencies'}
          onToggleMode={() => setEditorMode(editorMode === 'editor' ? 'preview' : 'editor')}
          onSave={handleSave}
          isTaskDirty={!!isTaskDirty}
          hasErrors={Object.keys(validationErrors).length > 0}
        />
      </div>

      <div className="editor-tabs">
        <EditorPanelTabs active={activeFieldTab} tabs={availableTabs} onChange={handleTabsChange} />
      </div>

      <div className="editor-content">
        {activeFieldTab === 'title' ? (
          <div className="title-editor">
            <TextInput
              value={currentContent}
              placeholder="Введите название задачи..."
              size="l"
              view="normal"
              validationState={validationErrors.title ? 'invalid' : undefined}
              errorMessage={validationErrors.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              onBlur={() => {
                const error = validateField('title', currentContent);
                if (error) {
                  setValidationErrors((prev) => ({ ...prev, title: error }));
                }
              }}
            />
          </div>
        ) : activeFieldTab === 'dependencies' ? (
          <div className="dependencies-editor">
            <TextInput
              value={currentContent}
              placeholder="Введите зависимости через запятую (например: 1, 2, 3)"
              size="l"
              view="normal"
              validationState={validationErrors.dependencies ? 'invalid' : undefined}
              errorMessage={validationErrors.dependencies}
              onChange={(e) => handleFieldChange('dependencies', e.target.value)}
            />
          </div>
        ) : activeFieldTab === 'testStrategy' ? (
          <div className="test-strategy-editor">
            <MarkdownEditorView key={'test-strategy-editor'} editor={testStrategyEditor} autofocus stickyToolbar />
          </div>
        ) : activeFieldTab === 'description' ? (
          <div className="markdown-editor-wrapper">
            <MarkdownEditorView key={'description-editor'} editor={descriptionEditor} autofocus stickyToolbar />
          </div>
        ) : (
          <div className="markdown-editor-wrapper">
            <MarkdownEditorView key={'details-editor'} editor={detailsEditor} autofocus stickyToolbar />
          </div>
        )}
      </div>
    </div>
  );
};
