export const truncatePath = (filePath: string, maxLength = 30): string => {
  const splittedPath = filePath.split('/');

  const taskMasterIndex = splittedPath.indexOf('.taskmaster');

  if (taskMasterIndex !== -1) {
    const projectName = splittedPath[taskMasterIndex - 1];

    if (projectName) {
      return projectName;
    }
  }

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
