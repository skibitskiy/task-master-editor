import { TaskField } from '@app/shared';
export type TaskFieldTab =
  | TaskField.TITLE
  | TaskField.DESCRIPTION
  | TaskField.DETAILS
  | TaskField.DEPENDENCIES
  | TaskField.TEST_STRATEGY;
