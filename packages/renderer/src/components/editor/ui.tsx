import { isString, Task, TaskField } from '@app/shared';
import { TextInput } from '@gravity-ui/uikit';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { deleteTask, saveFile } from '../../redux/dataSlice';
import { toggleEditorMode } from '../../redux/editorSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import { clearSelectedTask, setActiveFieldTab } from '../../redux/task';
import { useEditorContext } from '../../shared/editor-context';
import { useCustomFields } from '../../shared/hooks';
import { notifyError, notifySuccess } from '../../utils/notify';
import { DeleteTaskModal } from '../delete-task-modal';
import { EditorPanelHeader } from '../editor-panel-header';
import { EditorPanelTabs } from '../editor-panel-tabs';
import { MarkdownEditorWrapper } from '../markdown-editor-wrapper';
import { useGetTabTypeGuard } from './lib/use-get-tab-type-guard';

type EditorProps = {
  task: Task;
};

export const Editor: React.FC<EditorProps> = ({ task }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const customFields = useCustomFields();

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
    return localValues[activeFieldTab] ?? '';
  }, [localValues, activeFieldTab]);

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

      notifySuccess('Изменения применены');
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
    { id: TaskField.TITLE, title: 'Заголовок', isDirty: fieldDirtyState.title, hasError: !!validationErrors.title },
    { id: TaskField.DESCRIPTION, title: 'Описание', isDirty: fieldDirtyState.description, hasError: false },
    { id: TaskField.DETAILS, title: 'Детали', isDirty: fieldDirtyState.details, hasError: false },
    {
      id: TaskField.DEPENDENCIES,
      title: 'Зависимости',
      isDirty: fieldDirtyState.dependencies,
      hasError: !!validationErrors.dependencies,
    },
    {
      id: TaskField.TEST_STRATEGY,
      title: 'Стратегия тестирования',
      isDirty: fieldDirtyState.testStrategy,
      hasError: false,
    },
    ...customFields.map((field) => ({
      id: field.key,
      title: field.name,
      isDirty: false, // TODO: implement dirty tracking for custom fields
      hasError: false,
    })),
  ];

  const { tabTypeGuard } = useGetTabTypeGuard();

  const handleTabsChange = (tab: string) => {
    const isCustomField = customFields.some((field) => field.key === tab);
    if (tabTypeGuard(tab) || isCustomField) {
      dispatch(setActiveFieldTab(tab));
    }
  };

  // Render custom field editor if active tab is a custom field
  const renderCustomFieldEditor = () => {
    const customField = customFields.find((field) => field.key === activeFieldTab);
    if (!customField) {
      return null;
    }

    const value = localValues?.[customField.key];
    const initialValue = isString(value) ? value : '';

    return (
      <MarkdownEditorWrapper
        editorMode={editorMode}
        field={customField.key}
        initialValue={initialValue}
        onChange={handleFieldChange}
        autofocus
        stickyToolbar
        key={`${customField.key}-editor`}
      />
    );
  };

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      handleFieldChange(TaskField.TITLE, newTitle);
    },
    [handleFieldChange],
  );

  const handleTitleBlur = useCallback(() => {
    const currentTitle = localValues?.title || '';
    const error = validateField(TaskField.TITLE, currentTitle);
    if (error) {
      setValidationErrors((prev) => ({ ...prev, title: error }));
    } else {
      setValidationErrors((prev) => {
        const result = { ...prev };

        delete result.title;

        return result;
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
          <MarkdownEditorWrapper
            field={TaskField.TEST_STRATEGY}
            initialValue={localValues?.testStrategy || ''}
            onChange={handleFieldChange}
            editorMode={editorMode}
            autofocus
            stickyToolbar
            key="test-strategy-editor"
          />
        ) : activeFieldTab === 'description' ? (
          <MarkdownEditorWrapper
            field={TaskField.DESCRIPTION}
            initialValue={localValues?.description || ''}
            onChange={handleFieldChange}
            editorMode={editorMode}
            autofocus
            stickyToolbar
            key="description-editor"
          />
        ) : customFields.some((field) => field.key === activeFieldTab) ? (
          renderCustomFieldEditor()
        ) : (
          <MarkdownEditorWrapper
            field={TaskField.DETAILS}
            initialValue={localValues?.details || ''}
            onChange={handleFieldChange}
            editorMode={editorMode}
            autofocus
            stickyToolbar
            key="details-editor"
          />
        )}
      </div>

      <DeleteTaskModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleConfirmDelete}
        taskId={String(task?.id)}
        taskTitle={task?.title || ''}
      />
    </div>
  );
};
