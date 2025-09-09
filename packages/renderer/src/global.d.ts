import type { PreloadAPI } from '@app/shared';

declare global {
  interface Window {
    api?: PreloadAPI;
    electron?: {
      log: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
      };
    };
  }
}
export {};
