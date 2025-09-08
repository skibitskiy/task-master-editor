declare module 'electron-log/main' {
  const log: {
    initialize: () => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
  export default log;
}

declare module 'electron-log/main.js' {
  const log: {
    initialize: () => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
  export default log;
}
