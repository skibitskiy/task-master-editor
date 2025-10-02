import type { Task } from '@app/shared';

export interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  isSubtask: boolean;
  isTaskDirty: boolean;
  taskPath: string;
  onSelectTask: (taskPath: string) => void;
}
