import { z } from 'zod';

import type { CustomField } from './ipc.js';

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

export enum TaskField {
  ID = 'id',
  TITLE = 'title',
  DESCRIPTION = 'description',
  DETAILS = 'details',
  STATUS = 'status',
  TEST_STRATEGY = 'testStrategy',
  DEPENDENCIES = 'dependencies',
  PRIORITY = 'priority',
  SUBTASKS = 'subtasks',
}

export interface Task {
  [TaskField.ID]: number | string;
  [TaskField.TITLE]: string;
  [TaskField.DESCRIPTION]?: string;
  [TaskField.DETAILS]?: string;
  [TaskField.STATUS]?: TaskStatus;
  [TaskField.TEST_STRATEGY]?: string;
  [TaskField.PRIORITY]?: TaskPriority;
  [TaskField.DEPENDENCIES]?: Array<number | string>;
  [TaskField.SUBTASKS]?: SubTask[];
  [key: string]: unknown;
}

export type SubTask = Omit<Task, 'subtasks'>;

type Branch = string;

export interface TasksFile {
  [branch: Branch]: {
    tasks: Task[];
    metadata?: {
      created?: string;
      updated?: string;
      description?: string;
      customFields?: CustomField[];
    };
  };
}

// Zod schemas
const CustomFieldSchema = z.object({
  name: z.string(),
  key: z.string(),
  type: z.literal('text'),
});

// Базовая схема задачи без поля subtasks
const BaseTaskSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().min(1),
  description: z.string().optional(),
  details: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'done', 'deferred', 'cancelled', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  testStrategy: z.string().optional(),
  dependencies: z.array(z.union([z.number(), z.string()])).optional(),
});

// Схема подзадачи - базовая схема без поля subtasks
export const SubTaskSchema = BaseTaskSchema.passthrough();

// Схема основной задачи - базовая схема с добавлением поля subtasks
export const TaskSchema = SubTaskSchema.extend({
  subtasks: z.array(SubTaskSchema).optional(),
}).passthrough(); // Allow additional properties

// Schema for branch object
const BranchSchema = z.object({
  tasks: z.array(TaskSchema),
  metadata: z
    .object({
      created: z.string().optional(),
      updated: z.string().optional(),
      description: z.string().optional(),
      customFields: z.array(CustomFieldSchema).optional(),
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
