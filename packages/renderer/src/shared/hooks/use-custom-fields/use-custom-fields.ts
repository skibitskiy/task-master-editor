import { CustomField } from '@app/shared';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../redux/store';

export const useCustomFields = (): CustomField[] => {
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const currentBranch = useSelector((state: RootState) => state.data.currentBranch);

  const branchData = tasksFile?.[currentBranch];

  return useMemo(() => branchData?.metadata?.customFields || [], [branchData]);
};
