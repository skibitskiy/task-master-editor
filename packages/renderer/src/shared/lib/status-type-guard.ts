import { TaskStatus } from '@app/shared';

export const statusTypeGuard = (status: string): status is TaskStatus => {
  return Object.values(TaskStatus).includes(status as TaskStatus);
};
