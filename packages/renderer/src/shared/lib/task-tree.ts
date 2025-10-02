import type { Task } from '@app/shared';

export interface FlattenedTask {
  task: Task;
  depth: number;
  parentId: string | null;
  path: string;
}

const buildTaskPath = (parentPath: string | null, id: Task['id']): string => {
  const selfId = String(id);
  return parentPath ? `${parentPath}/${selfId}` : selfId;
};

export const getTaskSubtasks = (task: Task): Task[] => {
  const maybe = (task as Task).subtasks;
  if (!Array.isArray(maybe)) {
    return [];
  }

  return maybe as Task[];
};

export const flattenTasks = (
  tasks: Task[],
  depth = 0,
  parentId: string | null = null,
  parentPath: string | null = null,
): FlattenedTask[] => {
  return tasks.flatMap((task) => {
    const path = buildTaskPath(parentPath, task.id);
    const current: FlattenedTask = {
      task,
      depth,
      parentId,
      path,
    };

    const children = getTaskSubtasks(task);

    if (!children.length) {
      return [current];
    }

    return [current, ...flattenTasks(children, depth + 1, String(task.id), path)];
  });
};

export interface TaskEntry {
  task: Task;
  parentList: Task[];
  index: number;
  parentId: string | null;
}

export const findTaskEntry = (tasks: Task[], id: string): TaskEntry | null => {
  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    if (String(task.id) === id) {
      return { task, parentList: tasks, index, parentId: null };
    }

    const subtasks = getTaskSubtasks(task);
    if (!subtasks.length) {
      continue;
    }

    const entry = findTaskEntryInSubtree(subtasks, id, task.id);
    if (entry) {
      return entry;
    }
  }

  return null;
};

const findTaskEntryInSubtree = (tasks: Task[], id: string, parentId: Task['id']): TaskEntry | null => {
  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];

    if (String(task.id) === id) {
      return { task, parentList: tasks, index, parentId: String(parentId) };
    }

    const subtasks = getTaskSubtasks(task);
    if (subtasks.length) {
      const entry = findTaskEntryInSubtree(subtasks, id, task.id);
      if (entry) {
        return entry;
      }
    }
  }

  return null;
};

export const findTaskEntryByPath = (tasks: Task[], path: string): TaskEntry | null => {
  const segments = path.split('/');
  let currentTasks = tasks;
  let parentId: string | null = null;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const taskIndex = currentTasks.findIndex((task) => String(task.id) === segment);
    if (taskIndex === -1) {
      return null;
    }

    const task = currentTasks[taskIndex];
    const isLast = index === segments.length - 1;

    if (isLast) {
      return {
        task,
        parentList: currentTasks,
        index: taskIndex,
        parentId,
      };
    }

    parentId = String(task.id);
    currentTasks = getTaskSubtasks(task);
  }

  return null;
};

const resolveEntry = (tasks: Task[], idOrPath: string): TaskEntry | null => {
  return idOrPath.includes('/') ? findTaskEntryByPath(tasks, idOrPath) : findTaskEntry(tasks, idOrPath);
};

export const updateTaskInPlace = (tasks: Task[], idOrPath: string, updater: (task: Task) => Task): Task | null => {
  const entry = resolveEntry(tasks, idOrPath);
  if (!entry) {
    return null;
  }

  const { parentList, index } = entry;
  const current = parentList[index];
  const next = updater(current);
  parentList[index] = next;
  return next;
};

export const deleteTaskInPlace = (tasks: Task[], idOrPath: string): boolean => {
  const entry = resolveEntry(tasks, idOrPath);
  if (!entry) {
    return false;
  }

  const { parentList, index } = entry;
  parentList.splice(index, 1);
  return true;
};

export const forEachTask = (
  tasks: Task[],
  iteratee: (task: Task, path: string) => void,
  parentPath: string | null = null,
): void => {
  tasks.forEach((task) => {
    const currentPath = buildTaskPath(parentPath, task.id);
    iteratee(task, currentPath);
    const subtasks = getTaskSubtasks(task);
    if (subtasks.length) {
      forEachTask(subtasks, iteratee, currentPath);
    }
  });
};

const parseTaskIdToParts = (id: Task['id']): number[] => {
  return String(id)
    .split('.')
    .map((part) => {
      const parsed = Number(part);
      return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
    });
};

const compareTaskIds = (a: Task, b: Task): number => {
  const aParts = parseTaskIdToParts(a.id);
  const bParts = parseTaskIdToParts(b.id);

  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const aPart = aParts[index] ?? 0;
    const bPart = bParts[index] ?? 0;

    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }

  return 0;
};

export const sortTasksRecursively = (tasks: Task[]): Task[] => {
  return [...tasks]
    .map((task) => {
      const subtasks = getTaskSubtasks(task);
      if (!subtasks.length) {
        return { ...task };
      }

      const sortedChildren = sortTasksRecursively(subtasks);
      return {
        ...task,
        subtasks: sortedChildren,
      };
    })
    .sort(compareTaskIds);
};
