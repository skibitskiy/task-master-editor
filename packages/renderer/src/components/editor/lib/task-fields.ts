import type { Task } from '@app/shared';
import { isString, TaskField } from '@app/shared';

export const getCurrentFieldContent = (task: Task, field: string): string => {
  switch (field) {
    case TaskField.TITLE:
      return task[field] || '';
    case TaskField.DESCRIPTION:
      return task[field] || '';
    case TaskField.DETAILS:
      return task[field] || '';
    case TaskField.DEPENDENCIES:
      return task[field] ? task[field].join(', ') : '';
    case TaskField.TEST_STRATEGY:
      return task[field] || '';
    default:
      return isString(task[field]) ? task[field] : '';
  }
};
