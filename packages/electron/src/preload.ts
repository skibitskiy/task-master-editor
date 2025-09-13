import electron from 'electron';
const { contextBridge, ipcRenderer } = electron;
import {
  Channels,
  type ChatAddMessageInput,
  type ChatCreateInput,
  type ChatDeleteInput,
  type ChatGetListInput,
  type ChatGetMessagesInput,
  type ChatUpdateNameInput,
  type FileReadInput,
  type FileWriteInput,
  type PreloadAPI,
  validateChatAddMessageInput,
  validateChatCreateInput,
  validateChatDeleteInput,
  validateChatGetListInput,
  validateChatGetMessagesInput,
  validateChatUpdateNameInput,
  validateFileReadInput,
  validateFileReadResult,
  validateFileWriteInput,
  validateFileWriteResult,
  validateSettingsUpdateInput,
  validateWorkspaceSelectOptions,
  validateWorkspaceSelectResult,
  type WorkspaceSelectOptions,
} from '@app/shared';

const api: PreloadAPI = {
  workspace: {
    async select(options?: Partial<WorkspaceSelectOptions>) {
      const parsed = validateWorkspaceSelectOptions(options ?? {});
      const res = await ipcRenderer.invoke(Channels.workspaceSelect, parsed);
      return validateWorkspaceSelectResult(res);
    },
  },
  file: {
    async read(input: FileReadInput) {
      const parsed = validateFileReadInput(input);
      const res = await ipcRenderer.invoke(Channels.fileRead, parsed);
      return validateFileReadResult(res);
    },
    async write(input: FileWriteInput) {
      const parsed = validateFileWriteInput(input);
      const res = await ipcRenderer.invoke(Channels.fileWrite, parsed);
      return validateFileWriteResult(res);
    },
  },
  settings: {
    async get() {
      const res = await ipcRenderer.invoke(Channels.settingsGet, {});
      return res; // validated in main
    },
    async update(input) {
      const parsed = validateSettingsUpdateInput(input);
      const res = await ipcRenderer.invoke(Channels.settingsUpdate, parsed);
      return res; // validated in main
    },
  },
  chat: {
    async getList(input: ChatGetListInput) {
      const parsed = validateChatGetListInput(input);
      const res = await ipcRenderer.invoke(Channels.chatGetList, parsed);
      return res; // validated in main
    },
    async create(input: ChatCreateInput) {
      const parsed = validateChatCreateInput(input);
      const res = await ipcRenderer.invoke(Channels.chatCreate, parsed);
      return res; // validated in main
    },
    async updateName(input: ChatUpdateNameInput) {
      const parsed = validateChatUpdateNameInput(input);
      const res = await ipcRenderer.invoke(Channels.chatUpdateName, parsed);
      return res; // validated in main
    },
    async delete(input: ChatDeleteInput) {
      const parsed = validateChatDeleteInput(input);
      const res = await ipcRenderer.invoke(Channels.chatDelete, parsed);
      return res; // validated in main
    },
    async addMessage(input: ChatAddMessageInput) {
      const parsed = validateChatAddMessageInput(input);
      const res = await ipcRenderer.invoke(Channels.chatAddMessage, parsed);
      return res; // validated in main
    },
    async getMessages(input: ChatGetMessagesInput) {
      const parsed = validateChatGetMessagesInput(input);
      const res = await ipcRenderer.invoke(Channels.chatGetMessages, parsed);
      return res; // validated in main
    },
  },
};

// Expose logger to renderer process
const loggerApi = {
  debug: (message: string, ...args: unknown[]) => ipcRenderer.send('log:debug', message, ...args),
  info: (message: string, ...args: unknown[]) => ipcRenderer.send('log:info', message, ...args),
  warn: (message: string, ...args: unknown[]) => ipcRenderer.send('log:warn', message, ...args),
  error: (message: string, ...args: unknown[]) => ipcRenderer.send('log:error', message, ...args),
};

// Menu event handlers
const menuApi = {
  onOpenFile: (callback: (filePath: string) => void) => {
    // Remove any existing listeners first
    ipcRenderer.removeAllListeners('menu:open-file');
    ipcRenderer.on('menu:open-file', (_event, filePath: string) => callback(filePath));
  },
  onSave: (callback: () => void) => {
    // Remove any existing listeners first
    ipcRenderer.removeAllListeners('menu:save');
    ipcRenderer.on('menu:save', () => callback());
  },
  setDirtyState: (isDirty: boolean) => {
    ipcRenderer.send('editor:dirty-state', isDirty);
  },
};

contextBridge.exposeInMainWorld('api', api);
contextBridge.exposeInMainWorld('electron', {
  log: loggerApi,
  menu: menuApi,
});
