import { RootState } from '@/redux/store';
import { findTaskEntryByPath } from '@/shared/lib';

export const findTask = ({
  taskId,
  tasksFile,
  currentBranch,
}: {
  taskId: RootState['task']['selectedTaskId'];
  tasksFile: RootState['data']['tasksFile'];
  currentBranch: RootState['data']['currentBranch'];
}) => {
  if (!taskId || !tasksFile || !tasksFile[currentBranch]) {
    return null;
  }

  const entry = findTaskEntryByPath(tasksFile[currentBranch].tasks, taskId);

  return entry?.task ?? null;
};
