import { z } from 'zod';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  DEFERRED = 'deferred',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Task {
  id: number | string;
  title: string;
  description?: string;
  details?: string;
  status?: TaskStatus;
  testStrategy?: string;
  priority?: TaskPriority;
  dependencies?: Array<number | string>;
}

type Branch = string;

export interface TasksFile {
  [branch: Branch]: {
    tasks: Task[];
    metadata?: {
      created?: string;
      updated?: string;
      description?: string;
    };
  };
}

// Zod schemas
export const TaskSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().min(1),
  description: z.string().optional(),
  details: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'done', 'deferred', 'cancelled', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  testStrategy: z.string().optional(),
  dependencies: z.array(z.union([z.number(), z.string()])).optional(),
});

// Schema for branch object
const BranchSchema = z.object({
  tasks: z.array(TaskSchema),
  metadata: z
    .object({
      created: z.string().optional(),
      updated: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

// Schema for the entire tasks file - supports any branch names
export const TasksFileSchema = z.record(z.string(), BranchSchema);

export function validateTasksFile(raw: unknown): TasksFile {
  return TasksFileSchema.parse(raw) as unknown as TasksFile;
}

export function parseTasksJson(json: string): TasksFile {
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON: ${msg}`);
  }
  try {
    return validateTasksFile(obj);
  } catch (e) {
    if (e && typeof e === 'object' && 'issues' in e) {
      const issues = (e as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues ?? [];
      const detail = issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`Invalid schema: ${detail}`);
    }
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid schema: ${msg}`);
  }
}
