import type { Task } from '@app/shared';

export interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  isSubtask: boolean;
  isTaskDirty: boolean;
  onSelectTask: (taskId: string) => void;
}
