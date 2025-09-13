export const Channels = {
  workspaceSelect: 'workspace:select',
  fileRead: 'file:read',
  fileWrite: 'file:write',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  chatGetList: 'chat:get-list',
  chatCreate: 'chat:create',
  chatUpdateName: 'chat:update-name',
  chatDelete: 'chat:delete',
  chatAddMessage: 'chat:add-message',
  chatGetMessages: 'chat:get-messages',
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

// Settings
export interface CustomModel {
  id: string;
  name: string;
  value: string;
}

export interface SettingsData {
  recentPaths: string[];
  preferences?: Record<string, unknown>;
  customModels?: CustomModel[];
}

export interface SettingsGetInput {}
export interface SettingsGetResult {
  settings: SettingsData;
}

export interface SettingsUpdateInput {
  settings: Partial<SettingsData>;
}
export interface SettingsUpdateResult {
  settings: SettingsData;
}

// Chat types
export interface ChatMessage {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export interface Chat {
  id: string;
  name: string;
  projectPath: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatGetListInput {
  projectPath: string;
}

export interface ChatGetListResult {
  chats: Chat[];
}

export interface ChatCreateInput {
  projectPath: string;
  name?: string;
  withGreeting?: boolean;
}

export interface ChatCreateResult {
  chat: Chat;
}

export interface ChatUpdateNameInput {
  chatId: string;
  name: string;
}

export interface ChatUpdateNameResult {
  ok: true;
}

export interface ChatDeleteInput {
  chatId: string;
}

export interface ChatDeleteResult {
  ok: true;
}

export interface ChatAddMessageInput {
  chatId: string;
  content: string;
  sender: 'user' | 'ai';
}

export interface ChatAddMessageResult {
  message: ChatMessage;
}

export interface ChatGetMessagesInput {
  chatId: string;
}

export interface ChatGetMessagesResult {
  messages: ChatMessage[];
}

export interface PreloadAPI {
  workspace: {
    select: (options?: Partial<WorkspaceSelectOptions>) => Promise<WorkspaceSelectResult>;
  };
  file: {
    read: (input: FileReadInput) => Promise<FileReadResult>;
    write: (input: FileWriteInput) => Promise<FileWriteResult>;
  };
  settings: {
    get: (input?: SettingsGetInput) => Promise<SettingsGetResult>;
    update: (input: SettingsUpdateInput) => Promise<SettingsUpdateResult>;
  };
  chat: {
    getList: (input: ChatGetListInput) => Promise<ChatGetListResult>;
    create: (input: ChatCreateInput) => Promise<ChatCreateResult>;
    updateName: (input: ChatUpdateNameInput) => Promise<ChatUpdateNameResult>;
    delete: (input: ChatDeleteInput) => Promise<ChatDeleteResult>;
    addMessage: (input: ChatAddMessageInput) => Promise<ChatAddMessageResult>;
    getMessages: (input: ChatGetMessagesInput) => Promise<ChatGetMessagesResult>;
  };
}
// Runtime validators with defaults
export function validateWorkspaceSelectOptions(raw: unknown): WorkspaceSelectOptions {
  const o = (raw ?? {}) as Record<string, unknown>;
  const type = (o.type as unknown) ?? 'directory';
  if (type !== 'directory' && type !== 'file') {
    throw new Error('type must be "directory" or "file"');
  }
  const multiple = (o.multiple as unknown) ?? false;
  if (typeof multiple !== 'boolean') {
    throw new Error('multiple must be boolean');
  }
  return { type, multiple };
}

export function validateWorkspaceSelectResult(raw: unknown): WorkspaceSelectResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const paths = Array.isArray(o.paths) ? (o.paths as unknown[]) : [];
  if (!paths.every((p: unknown) => typeof p === 'string')) {
    throw new Error('paths must be string[]');
  }
  return { paths: paths as string[] };
}

export function validateFileReadInput(raw: unknown): FileReadInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const path = o.path as unknown;
  if (typeof path !== 'string' || path.length < 1) {
    throw new Error('path must be non-empty string');
  }
  const encoding = (o.encoding as unknown) ?? 'utf-8';
  if (encoding !== 'utf-8') {
    throw new Error('encoding must be "utf-8"');
  }
  return { path, encoding };
}

export function validateFileReadResult(raw: unknown): FileReadResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  if (typeof o.data !== 'string') {
    throw new Error('data must be string');
  }
  return { data: o.data };
}

export function validateFileWriteInput(raw: unknown): FileWriteInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const path = o.path as unknown;
  const data = o.data as unknown;
  if (typeof path !== 'string' || path.length < 1) {
    throw new Error('path must be non-empty string');
  }
  if (typeof data !== 'string') {
    throw new Error('data must be string');
  }
  const encoding = (o.encoding as unknown) ?? 'utf-8';
  if (encoding !== 'utf-8') {
    throw new Error('encoding must be "utf-8"');
  }
  return { path, data, encoding };
}

export function validateFileWriteResult(raw: unknown): FileWriteResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const ok = (o as Record<string, unknown>).ok;
  if (ok !== true) {
    throw new Error('ok must be true');
  }
  return { ok: true };
}

export function validateCustomModel(raw: unknown): CustomModel {
  const o = (raw ?? {}) as Record<string, unknown>;
  const id = o.id as unknown;
  const name = o.name as unknown;
  const value = o.value as unknown;

  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('CustomModel.id must be non-empty string');
  }
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('CustomModel.name must be non-empty string');
  }
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('CustomModel.value must be non-empty string');
  }

  return { id, name, value };
}

export function validateSettingsData(raw: unknown): SettingsData {
  const o = (raw ?? {}) as Record<string, unknown>;
  const recentPaths = Array.isArray(o.recentPaths) ? (o.recentPaths as unknown[]) : [];
  if (!recentPaths.every((p: unknown) => typeof p === 'string')) {
    throw new Error('recentPaths must be string[]');
  }
  const preferences = (o.preferences as Record<string, unknown> | undefined) ?? undefined;

  let customModels: CustomModel[] | undefined = undefined;
  if ('customModels' in o && o.customModels != null) {
    if (!Array.isArray(o.customModels)) {
      throw new Error('customModels must be array');
    }
    customModels = (o.customModels as unknown[]).map(validateCustomModel);
  }

  return { recentPaths: recentPaths as string[], preferences, customModels };
}

export function validateSettingsGetResult(raw: unknown): SettingsGetResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  return { settings: validateSettingsData(o.settings) };
}

export function validateSettingsUpdateInput(raw: unknown): SettingsUpdateInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const settingsObj = (o.settings ?? {}) as Record<string, unknown>;
  const partial = {} as Partial<SettingsData>;
  if ('recentPaths' in settingsObj) {
    partial.recentPaths = validateSettingsData({ recentPaths: settingsObj.recentPaths }).recentPaths;
  }
  if ('preferences' in settingsObj) {
    const prefs = settingsObj.preferences as Record<string, unknown>;
    if (prefs != null && typeof prefs !== 'object') {
      throw new Error('preferences must be object');
    }
    partial.preferences = prefs;
  }
  if ('customModels' in settingsObj) {
    partial.customModels = validateSettingsData({ customModels: settingsObj.customModels }).customModels;
  }
  return { settings: partial };
}

export function validateSettingsUpdateResult(raw: unknown): SettingsUpdateResult {
  return validateSettingsGetResult(raw);
}

// Chat validators
export function validateChatGetListInput(raw: unknown): ChatGetListInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const projectPath = o.projectPath as unknown;
  if (typeof projectPath !== 'string' || projectPath.length < 1) {
    throw new Error('projectPath must be non-empty string');
  }
  return { projectPath };
}

export function validateChatCreateInput(raw: unknown): ChatCreateInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const projectPath = o.projectPath as unknown;
  if (typeof projectPath !== 'string' || projectPath.length < 1) {
    throw new Error('projectPath must be non-empty string');
  }
  const name = o.name as unknown;
  if (name !== undefined && (typeof name !== 'string' || name.length < 1)) {
    throw new Error('name must be non-empty string or undefined');
  }
  const withGreeting = o.withGreeting as unknown;
  if (withGreeting !== undefined && typeof withGreeting !== 'boolean') {
    throw new Error('withGreeting must be boolean or undefined');
  }
  return {
    projectPath,
    name: name as string | undefined,
    withGreeting: withGreeting as boolean | undefined,
  };
}

export function validateChatUpdateNameInput(raw: unknown): ChatUpdateNameInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const chatId = o.chatId as unknown;
  const name = o.name as unknown;
  if (typeof chatId !== 'string' || chatId.length < 1) {
    throw new Error('chatId must be non-empty string');
  }
  if (typeof name !== 'string' || name.length < 1) {
    throw new Error('name must be non-empty string');
  }
  return { chatId, name };
}

export function validateChatDeleteInput(raw: unknown): ChatDeleteInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const chatId = o.chatId as unknown;
  if (typeof chatId !== 'string' || chatId.length < 1) {
    throw new Error('chatId must be non-empty string');
  }
  return { chatId };
}

export function validateChatAddMessageInput(raw: unknown): ChatAddMessageInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const chatId = o.chatId as unknown;
  const content = o.content as unknown;
  const sender = o.sender as unknown;

  if (typeof chatId !== 'string' || chatId.length < 1) {
    throw new Error('chatId must be non-empty string');
  }
  if (typeof content !== 'string' || content.length < 1) {
    throw new Error('content must be non-empty string');
  }
  if (sender !== 'user' && sender !== 'ai') {
    throw new Error('sender must be "user" or "ai"');
  }

  return { chatId, content, sender };
}

export function validateChatGetMessagesInput(raw: unknown): ChatGetMessagesInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const chatId = o.chatId as unknown;
  if (typeof chatId !== 'string' || chatId.length < 1) {
    throw new Error('chatId must be non-empty string');
  }
  return { chatId };
}
