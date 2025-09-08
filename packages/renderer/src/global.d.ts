import type { PreloadAPI } from '@app/shared';

declare global {
  interface Window {
    api?: PreloadAPI;
  }
}
export {};
