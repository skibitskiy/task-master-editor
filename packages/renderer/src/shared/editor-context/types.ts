import type { Task, TaskField } from '@app/shared';

export type TaskFieldTab =
  | TaskField.TITLE
  | TaskField.DESCRIPTION
  | TaskField.DETAILS
  | TaskField.DEPENDENCIES
  | TaskField.TEST_STRATEGY
  | string;

export interface EditorContextType {
  // Current task
  task: Task | null;
  taskId: string | null;

  // Local values (frequently changing)
  localValues: Record<string, string>;

  // Validation
  validationErrors: Record<string, string>;

  // Dirty state tracking
  fieldDirtyState: Record<string, boolean>;

  // Actions
  handleFieldChange: (field: string, value: string) => void;
  validateField: (field: TaskFieldTab, value: string) => string | null;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  clearLocalValues: () => void;
  resetToTaskValues: () => void;
  updateCurrentTask: () => void;
}
