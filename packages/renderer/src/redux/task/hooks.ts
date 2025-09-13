import type { Task } from '@app/shared';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from '../store';

export const useCurrentTask = (): { task: Task | null; taskId: string | null } => {
  const selectedTaskId = useSelector((state: RootState) => state.task?.selectedTaskId || null);
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);
  const currentBranch = useSelector((state: RootState) => state.data.currentBranch);

  const task = useMemo(
    () =>
      selectedTaskId && tasksFile && tasksFile[currentBranch]
        ? tasksFile[currentBranch].tasks.find((t) => String(t.id) === selectedTaskId) || null
        : null,
    [selectedTaskId, tasksFile, currentBranch],
  );

  return {
    task,
    taskId: selectedTaskId,
  };
};
