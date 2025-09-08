import { contextBridge } from 'electron';

// Minimal, safe API placeholder (real IPC/API comes in task 2)
contextBridge.exposeInMainWorld('api', {
  ping: () => true,
});
