import { TaskField } from '@app/shared';

import { TaskFieldTab } from '@/shared/editor-context';

export const tabTypeGuard = (tab: string): tab is TaskFieldTab => {
  return [
    TaskField.TITLE,
    TaskField.DESCRIPTION,
    TaskField.DETAILS,
    TaskField.DEPENDENCIES,
    TaskField.TEST_STRATEGY,
  ].includes(tab as TaskField);
};
