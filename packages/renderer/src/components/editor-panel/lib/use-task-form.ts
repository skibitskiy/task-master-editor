import React, { useEffect } from 'react';
import type { Task } from '@app/shared';
import { useDispatch } from 'react-redux';

import type { TaskFieldTab } from './types';
import { getCurrentFieldContent } from './task-fields';
import type { AppDispatch } from '../../../redux/store';
import { setTaskDirty } from '../../../redux/dataSlice';
import { useDebounce } from '../../../shared/hooks';

interface UseTaskFormParams {
  task: Task | null | undefined;
  taskId?: string | null;
}

export const useTaskForm = ({ task, taskId }: UseTaskFormParams) => {
  const dispatch = useDispatch<AppDispatch>();

  const [localValues, setLocalValues] = React.useState<Record<TaskFieldTab, string>>({
    title: task?.title || '',
    description: task?.description || '',
    details: task?.details || '',
    dependencies: task?.dependencies ? task.dependencies.join(', ') : '',
    testStrategy: task?.testStrategy || '',
  });

  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const setLocalValuesFromTask = React.useCallback((t: Task) => {
    setLocalValues({
      title: t.title || '',
      description: t.description || '',
      details: t.details || '',
      dependencies: t.dependencies ? t.dependencies.join(', ') : '',
      testStrategy: t.testStrategy || '',
    });
  }, []);

  const validateField = React.useCallback((field: TaskFieldTab, value: string): string | null => {
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

  const handleFieldChange = React.useCallback(
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

  const isFieldDirty = React.useCallback(
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
      setLocalValuesFromTask(task);
    }
  }, [setLocalValuesFromTask, task]);

  // Calculate dirty state for each field individually
  const titleDirty = React.useMemo(() => isFieldDirty('title', localValues.title), [isFieldDirty, localValues.title]);
  const descriptionDirty = React.useMemo(
    () => isFieldDirty('description', localValues.description),
    [isFieldDirty, localValues.description],
  );
  const detailsDirty = React.useMemo(
    () => isFieldDirty('details', localValues.details),
    [isFieldDirty, localValues.details],
  );
  const dependenciesDirty = React.useMemo(
    () => isFieldDirty('dependencies', localValues.dependencies),
    [isFieldDirty, localValues.dependencies],
  );
  const testStrategyDirty = React.useMemo(
    () => isFieldDirty('testStrategy', localValues.testStrategy),
    [isFieldDirty, localValues.testStrategy],
  );

  const fieldDirtyState = React.useMemo(
    () => ({
      title: titleDirty,
      description: descriptionDirty,
      details: detailsDirty,
      dependencies: dependenciesDirty,
      testStrategy: testStrategyDirty,
    }),
    [titleDirty, descriptionDirty, detailsDirty, dependenciesDirty, testStrategyDirty],
  );

  const setTaskDirtyCallback = React.useCallback(() => {
    if (!taskId || !task) {
      return;
    }

    const isDirty = titleDirty || descriptionDirty || detailsDirty || dependenciesDirty || testStrategyDirty;

    dispatch(setTaskDirty({ taskId, isDirty }));
  }, [titleDirty, descriptionDirty, detailsDirty, dependenciesDirty, testStrategyDirty, taskId, dispatch, task]);

  useDebounce(
    setTaskDirtyCallback,
    [titleDirty, descriptionDirty, detailsDirty, dependenciesDirty, testStrategyDirty, taskId, dispatch, task],
    300,
  );

  return {
    localValues,
    validationErrors,
    setValidationErrors,
    handleFieldChange,
    isFieldDirty,
    validateField,
    fieldDirtyState,
  } as const;
};
