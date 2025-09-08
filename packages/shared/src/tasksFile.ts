export interface TaskItem {
  id: number | string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dependencies?: Array<number | string>;
}

export interface TasksFile {
  master: {
    tasks: TaskItem[][]; // matches current JSON structure: array with one inner array
  };
}

export function parseTasksFile(json: string): TasksFile {
  const dataUnknown: unknown = JSON.parse(json);
  if (!dataUnknown || typeof dataUnknown !== 'object') throw new Error('Invalid JSON root');
  if (!('master' in dataUnknown)) throw new Error('Missing master');
  const masterUnknown = (dataUnknown as { master: unknown }).master;
  if (!masterUnknown || typeof masterUnknown !== 'object') throw new Error('Missing master');
  const master = masterUnknown as { tasks: unknown };
  if (!Array.isArray(master.tasks)) throw new Error('master.tasks must be an array');
  // ensure two-level array
  if (master.tasks.length === 0 || !Array.isArray(master.tasks[0])) {
    throw new Error('master.tasks should contain an inner array of tasks');
  }
  // minimal validation for first inner array items
  for (const t of master.tasks[0] as unknown[]) {
    if (typeof t !== 'object' || t == null) throw new Error('Task must be object');
    const task = t as Record<string, unknown>;
    if (!('id' in task)) throw new Error('Task.id required');
    if (!('title' in task)) throw new Error('Task.title required');
  }
  return dataUnknown as TasksFile;
}

export function serializeTasksFile(tf: TasksFile): string {
  // shallow validation similar to parse
  if (!tf || typeof tf !== 'object' || !tf.master || !Array.isArray(tf.master.tasks)) {
    throw new Error('Invalid TasksFile object');
  }
  return JSON.stringify(tf, null, 4);
}
