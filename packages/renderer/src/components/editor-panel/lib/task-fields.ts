import type { Task } from '@app/shared';
import type { TaskFieldTab } from './types';

export const getCurrentFieldContent = (task: Task, field: TaskFieldTab): string => {
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
