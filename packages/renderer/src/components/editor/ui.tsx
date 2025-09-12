import { Task } from '@app/shared';
import { MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { TextInput } from '@gravity-ui/uikit';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { deleteTask, saveFile } from '../../redux/dataSlice';
import { toggleEditorMode } from '../../redux/editorSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import { clearSelectedTask, setActiveFieldTab } from '../../redux/task';
import { useEditorContext } from '../../shared/editor-context';
import { notifyError, notifySuccess } from '../../utils/notify';
import { DeleteTaskModal } from '../delete-task-modal';
import { EditorPanelHeader } from '../editor-panel-header';
import { EditorPanelTabs } from '../editor-panel-tabs';
import { GptSettingsModal } from '../gpt-settings';
import { tabTypeGuard } from './lib/tab-type-guard';
import { useMarkdownFieldEditor } from './lib/use-markdown-field-editor';

type EditorProps = {
  task: Task;
};

export const Editor: React.FC<EditorProps> = ({ task }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [gptSettingsOpen, setGptSettingsOpen] = useState(false);

  const editorMode = useSelector((state: RootState) => state.editor.mode);

  const taskId = task?.id.toString();

  const activeFieldTab = useSelector((state: RootState) => {
    return state.task.activeFieldTab;
  });

  const dirtyState = useSelector((state: RootState) => state.data.dirty);
  const isTaskDirty = taskId ? dirtyState.byTaskId[taskId] : false;

  const {
    localValues,
    validationErrors,
    setValidationErrors,
    handleFieldChange,
    validateField,
    fieldDirtyState,
    updateCurrentTask,
  } = useEditorContext();

  // Get current content for the active field
  const currentContent = React.useMemo(() => {
    return localValues[activeFieldTab];
  }, [localValues, activeFieldTab]);

  // Initialize individual markdown editors for each markdown field
  const descriptionEditorData = useMarkdownFieldEditor({
    field: 'description',
    initialValue: task?.description || '',
    onChange: handleFieldChange,
  });
  const detailsEditorData = useMarkdownFieldEditor({
    field: 'details',
    initialValue: task?.details || '',
    onChange: handleFieldChange,
  });
  const testStrategyEditorData = useMarkdownFieldEditor({
    field: 'testStrategy',
    initialValue: task?.testStrategy || '',
    onChange: handleFieldChange,
  });

  // Extract editors for compatibility
  const descriptionEditor = descriptionEditorData.editor;
  const detailsEditor = detailsEditorData.editor;
  const testStrategyEditor = testStrategyEditorData.editor;

  useEffect(() => {
    if (editorMode === 'preview') {
      descriptionEditor.setEditorMode('wysiwyg');
      detailsEditor.setEditorMode('wysiwyg');
      testStrategyEditor.setEditorMode('wysiwyg');
    } else if (editorMode === 'editor') {
      descriptionEditor.setEditorMode('markup');
      detailsEditor.setEditorMode('markup');
      testStrategyEditor.setEditorMode('markup');
    }
  }, [editorMode, descriptionEditor, detailsEditor, testStrategyEditor]);

  // Handle save button click - only update Redux, don't auto-save to file
  const handleSave = useCallback(async () => {
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      // Only dispatch updateTask, don't auto-save to file
      if (!taskId) {
        throw new Error('Отсутствует ID задачи');
      }

      updateCurrentTask();
      dispatch(saveFile());

      notifySuccess('Изменения применены', 'Изменения сохранены в памяти. Используйте Cmd+S для сохранения в файл');
    } catch (error) {
      console.error('Update task error:', error);
      notifyError('Ошибка обновления', 'Произошла неожиданная ошибка при обновлении задачи');
    }
  }, [validationErrors, taskId, updateCurrentTask, dispatch]);

  // Handle delete button click
  const handleDelete = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (!taskId) {
      return;
    }

    try {
      dispatch(deleteTask(task.id));
      dispatch(clearSelectedTask());
      dispatch(saveFile());
      notifySuccess('Задача удалена', 'Задача была успешно удалена');
    } catch (error) {
      console.error('Delete task error:', error);
      notifyError('Ошибка удаления', 'Произошла ошибка при удалении задачи');
    }
  }, [taskId, task.id, dispatch]);

  // EditorPanelTabs props
  const availableTabs = [
    { id: 'title', title: 'Заголовок', isDirty: fieldDirtyState.title, hasError: !!validationErrors.title },
    { id: 'description', title: 'Описание', isDirty: fieldDirtyState.description, hasError: false },
    { id: 'details', title: 'Детали', isDirty: fieldDirtyState.details, hasError: false },
    {
      id: 'dependencies',
      title: 'Зависимости',
      isDirty: fieldDirtyState.dependencies,
      hasError: !!validationErrors.dependencies,
    },
    { id: 'testStrategy', title: 'Стратегия тестирования', isDirty: fieldDirtyState.testStrategy, hasError: false },
  ];

  const handleTabsChange = (tab: string) => {
    if (tabTypeGuard(tab)) {
      dispatch(setActiveFieldTab(tab));
    }
  };

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      handleFieldChange('title', newTitle);
    },
    [handleFieldChange],
  );

  const handleTitleBlur = useCallback(() => {
    const currentTitle = localValues?.title || '';
    const error = validateField('title', currentTitle);
    if (error) {
      setValidationErrors((prev) => ({ ...prev, title: error }));
    } else {
      setValidationErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, ...rest } = prev;
        return rest;
      });
    }
  }, [localValues?.title, validateField, setValidationErrors]);

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <EditorPanelHeader
          taskId={String(task?.id)}
          taskTitle={localValues?.title || ''}
          editorMode={editorMode}
          showModeToggle={activeFieldTab !== 'title' && activeFieldTab !== 'dependencies'}
          onToggleMode={() => dispatch(toggleEditorMode())}
          onSave={handleSave}
          onDelete={handleDelete}
          onGptSettings={() => setGptSettingsOpen(true)}
          onTitleChange={handleTitleChange}
          onTitleBlur={handleTitleBlur}
          titleError={validationErrors.title}
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
            <MarkdownEditorView
              key={'test-strategy-editor'}
              editor={testStrategyEditor}
              autofocus
              stickyToolbar
              wysiwygToolbarConfig={testStrategyEditorData.toolbarConfigs.wysiwyg}
              markupToolbarConfig={testStrategyEditorData.toolbarConfigs.markup}
            />
          </div>
        ) : activeFieldTab === 'description' ? (
          <div className="markdown-editor-wrapper">
            <MarkdownEditorView
              key={'description-editor'}
              editor={descriptionEditor}
              autofocus
              stickyToolbar
              wysiwygToolbarConfig={descriptionEditorData.toolbarConfigs.wysiwyg}
              markupToolbarConfig={descriptionEditorData.toolbarConfigs.markup}
            />
          </div>
        ) : (
          <div className="markdown-editor-wrapper">
            <MarkdownEditorView
              key={'details-editor'}
              editor={detailsEditor}
              autofocus
              stickyToolbar
              wysiwygToolbarConfig={detailsEditorData.toolbarConfigs.wysiwyg}
              markupToolbarConfig={detailsEditorData.toolbarConfigs.markup}
            />
          </div>
        )}
      </div>

      <DeleteTaskModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleConfirmDelete}
        taskId={String(task?.id)}
        taskTitle={task?.title || ''}
      />
      <GptSettingsModal open={gptSettingsOpen} onClose={() => setGptSettingsOpen(false)} />
    </div>
  );
};
