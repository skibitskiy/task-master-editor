import type { Task } from '@app/shared';

export type TaskFieldTab = Extract<keyof Task, 'title' | 'description' | 'details' | 'dependencies' | 'testStrategy'>;
