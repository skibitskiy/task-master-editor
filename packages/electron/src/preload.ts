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
};

contextBridge.exposeInMainWorld('api', api);
