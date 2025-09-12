import type { Task } from '@app/shared';

export interface TaskItemProps {
  task: Task;
  isActive: boolean;
  isSelected: boolean;
  isTaskDirty: boolean;
  onSelectTask: (taskId: string) => void;
}
