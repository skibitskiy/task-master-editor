export const Channels = {
  workspaceSelect: 'workspace:select',
  fileRead: 'file:read',
  fileWrite: 'file:write',
} as const;

// Types
export interface WorkspaceSelectOptions {
  type: 'directory' | 'file';
  multiple?: boolean;
}

export interface WorkspaceSelectResult {
  paths: string[];
}

export interface FileReadInput {
  path: string;
  encoding?: 'utf-8';
}

export interface FileReadResult {
  data: string;
}

export interface FileWriteInput {
  path: string;
  data: string;
  encoding?: 'utf-8';
}

export interface FileWriteResult {
  ok: true;
}

export interface PreloadAPI {
  workspace: {
    select: (options?: Partial<WorkspaceSelectOptions>) => Promise<WorkspaceSelectResult>;
  };
  file: {
    read: (input: FileReadInput) => Promise<FileReadResult>;
    write: (input: FileWriteInput) => Promise<FileWriteResult>;
  };
}
// Runtime validators with defaults
export function validateWorkspaceSelectOptions(raw: unknown): WorkspaceSelectOptions {
  const o = (raw ?? {}) as Record<string, unknown>;
  const type = (o.type as unknown) ?? 'directory';
  if (type !== 'directory' && type !== 'file') throw new Error('type must be "directory" or "file"');
  const multiple = (o.multiple as unknown) ?? false;
  if (typeof multiple !== 'boolean') throw new Error('multiple must be boolean');
  return { type, multiple };
}

export function validateWorkspaceSelectResult(raw: unknown): WorkspaceSelectResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const paths = Array.isArray(o.paths) ? (o.paths as unknown[]) : [];
  if (!paths.every((p: unknown) => typeof p === 'string')) throw new Error('paths must be string[]');
  return { paths: paths as string[] };
}

export function validateFileReadInput(raw: unknown): FileReadInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const path = o.path as unknown;
  if (typeof path !== 'string' || path.length < 1) throw new Error('path must be non-empty string');
  const encoding = (o.encoding as unknown) ?? 'utf-8';
  if (encoding !== 'utf-8') throw new Error('encoding must be "utf-8"');
  return { path, encoding };
}

export function validateFileReadResult(raw: unknown): FileReadResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  if (typeof o.data !== 'string') throw new Error('data must be string');
  return { data: o.data };
}

export function validateFileWriteInput(raw: unknown): FileWriteInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const path = o.path as unknown;
  const data = o.data as unknown;
  if (typeof path !== 'string' || path.length < 1) throw new Error('path must be non-empty string');
  if (typeof data !== 'string') throw new Error('data must be string');
  const encoding = (o.encoding as unknown) ?? 'utf-8';
  if (encoding !== 'utf-8') throw new Error('encoding must be "utf-8"');
  return { path, data, encoding };
}

export function validateFileWriteResult(raw: unknown): FileWriteResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const ok = (o as Record<string, unknown>).ok;
  if (ok !== true) throw new Error('ok must be true');
  return { ok: true };
}
