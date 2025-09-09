export interface TaskListProps {
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}
