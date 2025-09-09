import { notifyError, notifyWarning } from './notify';

interface ErrorContext {
  source?: string;
  timestamp: number;
  userAgent: string;
}

function getErrorContext(source?: string): ErrorContext {
  return {
    source,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  };
}

function maskSensitiveInfo(text: string): string {
  const patterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
    /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
    /api[_-]?key[\s:=]+['"]?[A-Za-z0-9\-._~+/]+['"]?/gi,
    /password[\s:=]+['"]?[^\s'"]+['"]?/gi,
  ];

  let maskedText = text;
  patterns.forEach((pattern) => {
    maskedText = maskedText.replace(pattern, '[MASKED]');
  });

  return maskedText;
}

export function setupGlobalErrorHandlers(): void {
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMessage = typeof message === 'string' ? message : 'Unknown error';
    const maskedMessage = maskSensitiveInfo(errorMessage);

    console.error('Global error handler:', {
      message: maskedMessage,
      source,
      lineno,
      colno,
      error,
    });

    notifyError(
      'Произошла ошибка',
      maskedMessage.length > 100 ? maskedMessage.substring(0, 100) + '...' : maskedMessage,
    );

    if (window.electron?.log) {
      const context = getErrorContext('window.onerror');
      window.electron.log.error('Unhandled error', {
        message: maskedMessage,
        source: source ? maskSensitiveInfo(source) : undefined,
        line: lineno,
        column: colno,
        stack: error?.stack ? maskSensitiveInfo(error.stack) : undefined,
        context,
      });
    }

    return true;
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    let errorMessage = 'Необработанное отклонение промиса';

    if (reason instanceof Error) {
      errorMessage = reason.message;
    } else if (typeof reason === 'string') {
      errorMessage = reason;
    } else if (reason && typeof reason === 'object' && 'message' in reason) {
      errorMessage = String(reason.message);
    }

    const maskedMessage = maskSensitiveInfo(errorMessage);

    console.error('Unhandled promise rejection:', reason);

    notifyWarning(
      'Необработанное отклонение',
      maskedMessage.length > 100 ? maskedMessage.substring(0, 100) + '...' : maskedMessage,
    );

    if (window.electron?.log) {
      const context = getErrorContext('unhandledrejection');
      window.electron.log.warn('Unhandled promise rejection', {
        reason: maskedMessage,
        stack: reason instanceof Error ? maskSensitiveInfo(reason.stack || '') : undefined,
        context,
      });
    }

    event.preventDefault();
  });
}

export function logError(error: Error | string, context?: Record<string, unknown>): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const maskedMessage = maskSensitiveInfo(errorMessage);

  console.error('Application error:', error, context);

  if (window.electron?.log) {
    const maskedContext = context ? JSON.parse(maskSensitiveInfo(JSON.stringify(context))) : undefined;

    window.electron.log.error('Application error', {
      message: maskedMessage,
      stack: error instanceof Error ? maskSensitiveInfo(error.stack || '') : undefined,
      context: maskedContext,
      ...getErrorContext('application'),
    });
  }
}

export function logWarning(message: string, context?: Record<string, unknown>): void {
  const maskedMessage = maskSensitiveInfo(message);

  console.warn('Application warning:', message, context);

  if (window.electron?.log) {
    const maskedContext = context ? JSON.parse(maskSensitiveInfo(JSON.stringify(context))) : undefined;

    window.electron.log.warn('Application warning', {
      message: maskedMessage,
      context: maskedContext,
      ...getErrorContext('application'),
    });
  }
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  const maskedMessage = maskSensitiveInfo(message);

  console.info('Application info:', message, context);

  if (window.electron?.log) {
    const maskedContext = context ? JSON.parse(maskSensitiveInfo(JSON.stringify(context))) : undefined;

    window.electron.log.info('Application info', {
      message: maskedMessage,
      context: maskedContext,
      ...getErrorContext('application'),
    });
  }
}
