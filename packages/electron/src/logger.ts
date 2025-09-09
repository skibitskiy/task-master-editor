import log from 'electron-log';
import { app } from 'electron';
import path from 'path';

// Configure log file location
log.transports.file.resolvePathFn = () => {
  return path.join(app.getPath('userData'), 'logs', 'main.log');
};

// Set log levels
log.transports.file.level = 'info';
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

// Configure log format
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}';
log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';

// Maximum log file size: 5MB
log.transports.file.maxSize = 5 * 1024 * 1024;

// Archive old logs
log.transports.file.archiveLogFn = (oldLogFile: { path: string }) => {
  const info = path.parse(oldLogFile.path);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(info.dir, `${info.name}-${timestamp}${info.ext}`);
};

// Patterns for masking sensitive information
const SENSITIVE_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone numbers
  /\b(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\b/g,
  // Social Security Numbers
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // Credit card numbers
  /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
  // API keys and tokens
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
  /api[_-]?key[\s:=]+['"]?[A-Za-z0-9\-._~+/]+['"]?/gi,
  /token[\s:=]+['"]?[A-Za-z0-9\-._~+/]+['"]?/gi,
  // Passwords
  /password[\s:=]+['"]?[^\s'"]+['"]?/gi,
  // File paths with user names (Windows)
  /C:\\Users\\[^\\]+/gi,
  // File paths with user names (Mac/Linux)
  /\/(?:home|Users)\/[^/]+/gi,
];

/**
 * Masks sensitive information in text
 */
function maskSensitiveInfo(text: string): string {
  if (typeof text !== 'string') {
    return text;
  }

  let maskedText = text;
  SENSITIVE_PATTERNS.forEach(pattern => {
    maskedText = maskedText.replace(pattern, '[MASKED]');
  });

  return maskedText;
}

/**
 * Processes log arguments to mask sensitive information
 */
function processLogArgs(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return maskSensitiveInfo(arg);
    }
    
    if (typeof arg === 'object' && arg !== null) {
      try {
        const jsonStr = JSON.stringify(arg);
        const maskedStr = maskSensitiveInfo(jsonStr);
        return JSON.parse(maskedStr);
      } catch {
        return arg;
      }
    }
    
    return arg;
  });
}

// Create wrapped logger with PII masking
export const logger = {
  debug: (...args: unknown[]) => log.debug(...processLogArgs(args)),
  info: (...args: unknown[]) => log.info(...processLogArgs(args)),
  warn: (...args: unknown[]) => log.warn(...processLogArgs(args)),
  error: (...args: unknown[]) => log.error(...processLogArgs(args)),
  
  // Original unmasked logger for development only
  raw: process.env.NODE_ENV === 'development' ? log : {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  },
};

// Set up uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error.message, error.stack);
  // In production, we might want to restart the app
  if (process.env.NODE_ENV !== 'development') {
    app.relaunch();
    app.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log app lifecycle events
app.on('ready', () => {
  logger.info('Application started', {
    version: app.getVersion(),
    node: process.versions.node,
    electron: process.versions.electron,
    platform: process.platform,
    arch: process.arch,
  });
});

app.on('quit', () => {
  logger.info('Application quit');
});

app.on('window-all-closed', () => {
  logger.info('All windows closed');
});

export default logger;