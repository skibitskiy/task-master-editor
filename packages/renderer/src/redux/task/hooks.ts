import { useSelector } from 'react-redux';
import type { Task } from '@app/shared';
import type { RootState } from '../store';
import { useMemo } from 'react';

export const useCurrentTask = (): { task: Task | null; taskId: string | null } => {
  const selectedTaskId = useSelector((state: RootState) => state.task?.selectedTaskId || null);
  const tasksFile = useSelector((state: RootState) => state.data.tasksFile);

  const task = useMemo(
    () =>
      selectedTaskId && tasksFile ? tasksFile.master.tasks.find((t) => String(t.id) === selectedTaskId) || null : null,
    [selectedTaskId, tasksFile],
  );

  return {
    task,
    taskId: selectedTaskId,
  };
};
