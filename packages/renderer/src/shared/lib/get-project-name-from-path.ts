export const getProjectNameFromPath = (filePath: string) => {
  const splittedPath = filePath.split('/');

  const taskMasterIndex = splittedPath.indexOf('.taskmaster');

  if (taskMasterIndex !== -1) {
    const projectName = splittedPath[taskMasterIndex - 1];

    if (projectName) {
      return projectName;
    }
  }

  return null;
};
