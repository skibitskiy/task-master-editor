import type { Task, TasksFile } from '@app/shared';

export function validateTask(t: unknown): string[] {
  const errs: string[] = [];
  const o = (t ?? {}) as Record<string, unknown>;
  if (o.id == null) errs.push('id is required');
  if (typeof o.title !== 'string' || o.title.length === 0)
    errs.push('title must be non-empty string');
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

