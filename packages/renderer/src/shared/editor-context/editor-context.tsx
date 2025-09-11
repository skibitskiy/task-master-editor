import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { Task } from '@app/shared';
import { setTaskDirty, updateTask } from '../../redux/dataSlice';
import type { AppDispatch } from '../../redux/store';
import { useDebounce, useEventCallback } from '../hooks';
import type { EditorContextType, TaskFieldTab } from './types';
import { useCurrentTask } from '../../redux/task';

const EditorContext = createContext<EditorContextType | null>(null);

interface EditorProviderProps {
  children: React.ReactNode;
}

const getCurrentFieldContent = (task: Task, field: TaskFieldTab): string => {
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
};

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { task, taskId } = useCurrentTask();

  const [localValues, setLocalValues] = useState<Record<TaskFieldTab, string>>({
    title: '',
    description: '',
    details: '',
    dependencies: '',
    testStrategy: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  const handleFieldChange = useCallback(
    (field: TaskFieldTab, value: string) => {
      setLocalValues((prev) => ({ ...prev, [field]: value }));

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
    },
    [validateField],
  );

  const isFieldDirty = useCallback(
    (field: TaskFieldTab, value: string): boolean => {
      if (!task) {
        return false;
      }
      const originalValue = getCurrentFieldContent(task, field);
      return value !== originalValue;
    },
    [task],
  );

  useEffect(() => {
    if (task) {
      setLocalValues({
        title: task.title || '',
        description: task.description || '',
        details: task.details || '',
        dependencies: task.dependencies ? task.dependencies.join(', ') : '',
        testStrategy: task.testStrategy || '',
      });
    } else {
      setLocalValues({
        title: '',
        description: '',
        details: '',
        dependencies: '',
        testStrategy: '',
      });
    }

    // Clear validation errors when switching tasks
    setValidationErrors({});
  }, [task]);

  const clearLocalValues = useCallback(() => {
    setLocalValues({
      title: '',
      description: '',
      details: '',
      dependencies: '',
      testStrategy: '',
    });
    setValidationErrors({});
  }, []);

  const resetToTaskValues = useCallback(() => {
    if (task) {
      setLocalValues({
        title: task.title || '',
        description: task.description || '',
        details: task.details || '',
        dependencies: task.dependencies ? task.dependencies.join(', ') : '',
        testStrategy: task.testStrategy || '',
      });
    }
    setValidationErrors({});
  }, [task]);

  // Calculate dirty state for each field
  const fieldDirtyState = useMemo(
    () => ({
      title: isFieldDirty('title', localValues.title),
      description: isFieldDirty('description', localValues.description),
      details: isFieldDirty('details', localValues.details),
      dependencies: isFieldDirty('dependencies', localValues.dependencies),
      testStrategy: isFieldDirty('testStrategy', localValues.testStrategy),
    }),
    [isFieldDirty, localValues],
  );

  // Debounced dirty state update to Redux
  const setTaskDirtyCallback = useCallback(() => {
    if (!taskId || !task) {
      return;
    }

    const isDirty = Object.values(fieldDirtyState).some(Boolean);
    dispatch(setTaskDirty({ taskId, isDirty }));
  }, [fieldDirtyState, taskId, dispatch, task]);

  useDebounce(setTaskDirtyCallback, [fieldDirtyState, taskId, dispatch, task], 300);

  const updateCurrentTask = useEventCallback(() => {
    if (!taskId || !task) {
      throw new Error('Задача не найдена');
    }
    dispatch(
      updateTask({
        id: parseInt(taskId),
        patch: {
          title: localValues.title,
          description: localValues.description,
          details: localValues.details,
          dependencies: localValues.dependencies
            .split(',')
            .map((d) => parseInt(d.trim()))
            .filter((d) => !isNaN(d)),
          testStrategy: localValues.testStrategy,
        },
      }),
    );
  });

  const value = useMemo(
    () => ({
      task,
      taskId,
      localValues,
      validationErrors,
      fieldDirtyState,
      handleFieldChange,
      validateField,
      setValidationErrors,
      clearLocalValues,
      resetToTaskValues,
      updateCurrentTask,
    }),
    [
      task,
      taskId,
      localValues,
      validationErrors,
      fieldDirtyState,
      handleFieldChange,
      validateField,
      clearLocalValues,
      resetToTaskValues,
      updateCurrentTask,
    ],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditorContext = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
};
