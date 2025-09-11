import type { Task } from '@app/shared';

export type TaskFieldTab = 'title' | 'description' | 'details' | 'dependencies' | 'testStrategy';

export interface EditorContextType {
  // Current task
  task: Task | null;
  taskId: string | null;

  // Local values (frequently changing)
  localValues: Record<TaskFieldTab, string>;

  // Validation
  validationErrors: Record<string, string>;

  // Dirty state tracking
  fieldDirtyState: Record<TaskFieldTab, boolean>;

  // Actions
  handleFieldChange: (field: TaskFieldTab, value: string) => void;
  validateField: (field: TaskFieldTab, value: string) => string | null;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  clearLocalValues: () => void;
  resetToTaskValues: () => void;
  updateCurrentTask: () => void;
}
