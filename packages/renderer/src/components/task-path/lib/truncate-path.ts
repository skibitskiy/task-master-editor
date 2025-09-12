import { getProjectNameFromPath } from '../../../shared/lib/get-project-name-from-path';

export const truncatePath = (filePath: string, maxLength = 30): string => {
  const projectName = getProjectNameFromPath(filePath);

  if (projectName) {
    return projectName;
  }

  const splittedPath = filePath.split('/');

  if (filePath.length <= maxLength) {
    return filePath;
  }

  const lastThreeParts = splittedPath.slice(-3).join('/');

  if (splittedPath.length > 3) {
    return '.../' + lastThreeParts;
  }

  if (lastThreeParts.length > maxLength) {
    return '.../' + lastThreeParts.slice(-(maxLength - 3));
  }

  return lastThreeParts;
};
