import { TaskFieldTab } from './types';

export const tabTypeGuard = (tab: string): tab is TaskFieldTab => {
  return ['title', 'description', 'details', 'dependencies', 'testStrategy'].includes(tab);
};
