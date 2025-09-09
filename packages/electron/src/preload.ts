import electron from 'electron';
const { contextBridge, ipcRenderer } = electron;
import {
  Channels,
  validateWorkspaceSelectOptions,
  validateWorkspaceSelectResult,
  validateFileReadInput,
  validateFileReadResult,
  validateFileWriteInput,
  validateFileWriteResult,
  validateSettingsUpdateInput,
  type PreloadAPI,
  type WorkspaceSelectOptions,
  type FileReadInput,
  type FileWriteInput,
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
};

// Expose logger to renderer process
const loggerApi = {
  debug: (message: string, ...args: unknown[]) => ipcRenderer.send('log:debug', message, ...args),
  info: (message: string, ...args: unknown[]) => ipcRenderer.send('log:info', message, ...args),
  warn: (message: string, ...args: unknown[]) => ipcRenderer.send('log:warn', message, ...args),
  error: (message: string, ...args: unknown[]) => ipcRenderer.send('log:error', message, ...args),
};

contextBridge.exposeInMainWorld('api', api);
contextBridge.exposeInMainWorld('electron', {
  log: loggerApi,
});
