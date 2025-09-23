import { RootState } from '@/redux/store';

export const findTask = ({
  taskId,
  tasksFile,
  currentBranch,
}: {
  taskId: RootState['task']['selectedTaskId'];
  tasksFile: RootState['data']['tasksFile'];
  currentBranch: RootState['data']['currentBranch'];
}) => {
  return taskId && tasksFile && tasksFile[currentBranch]
    ? tasksFile[currentBranch].tasks.find((t) => String(t.id) === taskId) || null
    : null;
};
