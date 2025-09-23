import type { Task } from '@app/shared';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from '../store';
import { findTask } from './lib/find-task';

export const useCurrentTask = (): { task: Task | null; taskId: string | null } => {
  const selectedTaskId = useSelector((state: RootState) => state.task?.selectedTaskId || null);
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const currentBranch = useSelector((state: RootState) => state.data.currentBranch);

  const task = useMemo(
    () => findTask({ taskId: selectedTaskId, tasksFile, currentBranch }),
    [selectedTaskId, tasksFile, currentBranch],
  );

  return {
    task,
    taskId: selectedTaskId,
  };
};
