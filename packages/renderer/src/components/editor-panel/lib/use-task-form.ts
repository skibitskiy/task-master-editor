import React, { useEffect } from 'react';
import type { Task } from '@app/shared';
import type { TaskFieldTab } from './types';
import { getCurrentFieldContent } from './task-fields';

interface UseTaskFormParams {
  task: Task | null | undefined;
}

export const useTaskForm = ({ task }: UseTaskFormParams) => {
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
    [task, validateField],
  );

  const isFieldDirty = React.useCallback(
    (field: TaskFieldTab): boolean => {
      if (!task) return false;
      const originalValue = getCurrentFieldContent(task, field);
      return localValues[field] !== originalValue;
    },
    [task, localValues],
  );

  useEffect(() => {
    if (task) {
      setLocalValuesFromTask(task);
    }
  }, [task?.id]);

  return {
    localValues,
    validationErrors,
    setValidationErrors,
    handleFieldChange,
    isFieldDirty,
    validateField,
  } as const;
};
