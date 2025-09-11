export interface DeleteTaskModalProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  taskId: string;
  taskTitle: string;
}
