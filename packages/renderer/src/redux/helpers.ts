import type { Task, TasksFile } from '@app/shared';

export function validateTask(t: unknown): string[] {
  const errs: string[] = [];
  const o = (t ?? {}) as Record<string, unknown>;
  if (o.id == null) errs.push('id is required');
  if (typeof o.title !== 'string' || o.title.length === 0) errs.push('title must be non-empty string');
  if (o.dependencies && !Array.isArray(o.dependencies)) errs.push('dependencies must be array');
  return errs;
}

export function collectTaskErrors(tf: TasksFile): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const t of tf.master.tasks) {
    const errs = validateTask(t);
    if (errs.length) map[String((t as Task).id)] = errs;
  }
  return map;
}

export function safeParseTasksFile(raw: unknown): { tasksFile: TasksFile; errors: Record<string, string[]> } {
  const root = (raw ?? {}) as Record<string, unknown>;
  const master = (root.master as Record<string, unknown>) ?? {};
  const tasksRaw = Array.isArray(master.tasks) ? (master.tasks as unknown[]) : [];

  const tasks: Task[] = [];
  const errors: Record<string, string[]> = {};
  for (const item of tasksRaw) {
    const o = (item ?? {}) as Record<string, unknown>;
    const depRaw: unknown = Object.prototype.hasOwnProperty.call(o, 'dependencies')
      ? (o as Record<string, unknown>).dependencies
      : undefined;

    // Build with loose record to preserve raw dependencies for validation
    const tLoose: Record<string, unknown> = {
      id: o.id as number | string,
      title: typeof o.title === 'string' ? o.title : '',
      description: typeof o.description === 'string' ? o.description : undefined,
      details: typeof o.details === 'string' ? o.details : undefined,
      status: ((): Task['status'] => {
        const s = o.status as string | undefined;
        return s === 'pending' || s === 'in-progress' || s === 'done' || s === 'deferred' || s === 'cancelled' || s === 'blocked'
          ? (s as Task['status'])
          : undefined;
      })(),
      priority: ((): Task['priority'] => {
        const p = o.priority as string | undefined;
        return p === 'low' || p === 'medium' || p === 'high' ? (p as Task['priority']) : undefined;
      })(),
      dependencies: depRaw,
    };
    const errs = validateTask(tLoose);
    if (errs.length) errors[String(tLoose.id as number | string)] = errs;
    tasks.push(tLoose as unknown as Task);
  }

  const tf: TasksFile = { master: { tasks, metadata: (master.metadata as TasksFile['master']['metadata']) } };
  return { tasksFile: tf, errors };
}
