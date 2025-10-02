import { type CustomField, isString, type Task, TaskField } from '@app/shared';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { setTaskDirty, updateTask } from '../../redux/dataSlice';
import type { AppDispatch } from '../../redux/store';
import { useCurrentTask } from '../../redux/task';
import { useCustomFields, useDebounce, useEventCallback } from '../hooks';
import type { EditorContextType, TaskFieldTab } from './types';

const EditorContext = createContext<EditorContextType | null>(null);

interface EditorProviderProps {
  children: React.ReactNode;
}

const getCurrentFieldContent = (task: Task, field: TaskFieldTab): string => {
  switch (field) {
    case TaskField.TITLE:
      return task.title || '';
    case TaskField.DESCRIPTION:
      return task.description || '';
    case TaskField.DETAILS:
      return task.details || '';
    case TaskField.DEPENDENCIES:
      return task.dependencies ? task.dependencies.join(', ') : '';
    case TaskField.TEST_STRATEGY:
      return task.testStrategy || '';
    default:
      return '';
  }
};

const REQUIRED_TASK_FIELDS = [
  TaskField.TITLE,
  TaskField.DESCRIPTION,
  TaskField.DETAILS,
  TaskField.DEPENDENCIES,
  TaskField.TEST_STRATEGY,
];

const getTaskValues = (
  task: Record<string, unknown> | null | undefined,
  customFields: CustomField[],
): Record<string, string> => {
  const fields = [...REQUIRED_TASK_FIELDS, ...customFields.map((field) => field.key)];

  return fields.reduce(
    (acc, field) => {
      const value = task?.[field];

      if (Array.isArray(value)) {
        acc[field] = value.join(', ');
      } else {
        acc[field] = isString(value) ? value : '';
      }

      return acc;
    },
    {} as Record<string, string>,
  );
};

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();

  const customFields = useCustomFields();

  const { task, taskId } = useCurrentTask();

  const [localValues, setLocalValues] = useState<Record<string, string>>(() => getTaskValues(task, customFields));

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
    setLocalValues(getTaskValues(task, customFields));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customFields]);

  useEffect(() => {
    setLocalValues(getTaskValues(task, customFields));

    // Clear validation errors when switching tasks
    setValidationErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.[TaskField.ID]]);

  const clearLocalValues = useCallback(() => {
    setLocalValues(getTaskValues(null, customFields));
    setValidationErrors({});
  }, [customFields]);

  const resetToTaskValues = useCallback(() => {
    if (task) {
      setLocalValues(getTaskValues(task, customFields));
    }
    setValidationErrors({});
  }, [task, customFields]);

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
    const values = getTaskValues(localValues, customFields);

    const normalizedId = task.id;
    const dependencies = values.dependencies
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((dep) => (/^\d+$/.test(dep) ? Number(dep) : dep));

    dispatch(
      updateTask({
        id: normalizedId,
        path: taskId,
        patch: {
          ...values,
          dependencies,
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
