declare global {
  interface Window {
    api?: {
      ping: () => boolean;
    };
  }
}
export {};
