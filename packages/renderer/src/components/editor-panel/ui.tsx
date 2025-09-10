import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Flex, Text, Button, TextInput, TabProvider, TabList, Tab } from '@gravity-ui/uikit';
import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { FloppyDisk, Eye, Code, CircleExclamation } from '@gravity-ui/icons';
import type { Task } from '@app/shared';
import type { RootState, AppDispatch } from '../../redux/store';
import { updateTask, saveFile } from '../../redux/dataSlice';
import { notifySuccess, notifyError } from '../../utils/notify';

interface EditorPanelProps {
  taskId: string | null;
}

type TaskFieldTab = Extract<keyof Task, 'title' | 'description' | 'details' | 'dependencies' | 'testStrategy'>;

export const EditorPanel: React.FC<EditorPanelProps> = ({ taskId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeFieldTab, setActiveFieldTab] = useState<TaskFieldTab>('description');
  const [editorMode, setEditorMode] = useState<'editor' | 'preview'>('editor');
  const [localValues, setLocalValues] = useState<Record<TaskFieldTab, string>>({
    title: '',
    description: '',
    details: '',
    dependencies: '',
    testStrategy: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const dirtyState = useSelector((state: RootState) => state.data.dirty);
  const task = taskId ? tasksFile?.master.tasks.find((t) => String(t.id) === taskId) : null;
  const isTaskDirty = taskId ? dirtyState.byTaskId[taskId] : false;

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

  // Initialize local values when task changes
  useEffect(() => {
    if (task) {
      setLocalValues({
        title: task.title || '',
        description: task.description || '',
        details: task.details || '',
        dependencies: task.dependencies ? task.dependencies.join(', ') : '',
        testStrategy: task.testStrategy || '',
      });
    }
  }, [task?.id]);

  // Get current content for the active field
  const currentContent = React.useMemo(() => {
    return localValues[activeFieldTab];
  }, [localValues, activeFieldTab]);

  // Always initialize the markdown editor (hooks must be called unconditionally)
  const editor = useMarkdownEditor({});

  // Validate field value - moved before other callbacks to maintain hook order
  const validateField = useCallback((field: TaskFieldTab, value: string): string | null => {
    if (field === 'title' && !value.trim()) {
      return 'Название задачи обязательно';
    }
    if (field === 'dependencies') {
      const deps = value
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      for (const dep of deps) {
        if (!/^\d+(\.\d+)*$/.test(dep)) {
          return `Неверный формат зависимости: ${dep}`;
        }
      }
    }
    return null;
  }, []);

  // Handle field changes with real-time store updates
  const handleFieldChange = useCallback(
    (field: TaskFieldTab, value: string) => {
      // Update local state
      setLocalValues((prev) => ({ ...prev, [field]: value }));

      // Validate
      const error = validateField(field, value);
      if (error) {
        setValidationErrors((prev) => ({ ...prev, [field]: error }));
      } else {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }

      // Update Redux store
      if (!error && task && taskId) {
        const patch: Partial<Task> = {};

        switch (field) {
          case 'title':
            patch.title = value;
            break;
          case 'description':
            patch.description = value || undefined;
            break;
          case 'details':
            patch.details = value || undefined;
            break;
          case 'dependencies': {
            const deps = value
              .split(',')
              .map((d) => d.trim())
              .filter(Boolean);
            patch.dependencies = deps.length > 0 ? deps : undefined;
            break;
          }
          case 'testStrategy':
            patch.testStrategy = value || undefined;
            break;
        }

        dispatch(updateTask({ id: taskId, patch }));
      }
    },
    [task, taskId, dispatch, validateField],
  );

  // Listen to markdown editor changes - always set up effect but conditionally execute
  useEffect(() => {
    const handleEditorChange = () => {
      // Only handle editor changes for markdown fields
      if (activeFieldTab !== 'title' && activeFieldTab !== 'dependencies') {
        const value = editor.getValue();
        handleFieldChange(activeFieldTab, value);
      }
    };

    // Always set up the interval but it will only do work for markdown fields
    const interval = setInterval(handleEditorChange, 500);
    return () => clearInterval(interval);
  }, [activeFieldTab, editor, handleFieldChange]);

  // Handle save button click
  const handleSave = useCallback(async () => {
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      // Dispatch save action and wait for completion
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

  // Check if field has been modified - must be defined before early return
  const isFieldDirty = useCallback(
    (field: TaskFieldTab): boolean => {
      if (!task) return false;
      const originalValue = getCurrentFieldContent(task, field);
      return localValues[field] !== originalValue;
    },
    [task, localValues, getCurrentFieldContent],
  );

  // Early return after all hooks have been called
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
            <Button view="action" size="m" onClick={handleSave} disabled={Object.keys(validationErrors).length > 0}>
              <Button.Icon>
                <FloppyDisk />
              </Button.Icon>
              Сохранить
              {isTaskDirty && <span style={{ marginLeft: '8px', color: 'var(--g-color-text-warning)' }}>●</span>}
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
                <Flex gap={1} alignItems="center">
                  {tab.title}
                  {tab.isDirty && <span style={{ color: 'var(--g-color-text-warning)', fontSize: '12px' }}>●</span>}
                  {tab.hasError && (
                    <CircleExclamation width={16} height={16} style={{ color: 'var(--g-color-text-danger)' }} />
                  )}
                </Flex>
              </Tab>
            ))}
          </TabList>
        </TabProvider>
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
