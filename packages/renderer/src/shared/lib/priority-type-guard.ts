import { TaskPriority } from '@app/shared';

export const priorityTypeGuard = (priority: string): priority is TaskPriority => {
  return Object.values(TaskPriority).includes(priority as TaskPriority);
};
