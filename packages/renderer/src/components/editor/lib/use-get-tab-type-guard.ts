import { useCallback } from 'react';

import { useCustomFields } from '../../../shared/hooks';
import { tabTypeGuard as taskFieldTabTypeGuard } from './tab-type-guard';

export const useGetTabTypeGuard = () => {
  const customFields = useCustomFields();

  const tabTypeGuard = useCallback(
    (tab: string) => {
      return taskFieldTabTypeGuard(tab) || customFields.some((field) => field.key === tab);
    },
    [customFields],
  );

  return {
    tabTypeGuard,
  };
};
