import { TaskField } from '../model.js';

export const isTaskField = (value: string): value is TaskField => {
  return Object.values(TaskField).includes(value as TaskField);
};
