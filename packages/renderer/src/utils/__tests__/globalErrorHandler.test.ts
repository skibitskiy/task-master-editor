import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalErrorHandlers, logError, logWarning, logInfo } from '../globalErrorHandler';
import * as notify from '../notify';

vi.mock('../notify', () => ({
  notifyError: vi.fn(),
  notifyWarning: vi.fn(),
}));

describe('globalErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.electron
    global.window = {
      ...global.window,
      electron: {
        log: {
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    // Clean up event listeners
    window.onerror = null;
  });

  describe('setupGlobalErrorHandlers', () => {
    it('should set up window.onerror handler', () => {
      setupGlobalErrorHandlers();

      const error = new Error('Test error');
      const result = window.onerror!('Test error', 'test.js', 10, 5, error);

      expect(result).toBe(true);
      expect(notify.notifyError).toHaveBeenCalledWith('Произошла ошибка', 'Test error');
      expect(window.electron!.log.error).toHaveBeenCalled();
    });

    it('should mask sensitive information in error messages', () => {
      setupGlobalErrorHandlers();

      const error = new Error('Error with email test@example.com');
      window.onerror!('Error with email test@example.com', 'test.js', 10, 5, error);

      expect(window.electron!.log.error).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          message: 'Error with email [MASKED]',
        }),
      );
    });

    it('should handle unhandledrejection events', () => {
      setupGlobalErrorHandlers();

      // Get the handler that was registered
      const addEventListenerCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock
        .calls;
      const unhandledRejectionCall = addEventListenerCalls.find(
        (call: unknown[]) => call[0] === 'unhandledrejection',
      );
      const handler = unhandledRejectionCall?.[1];

      const preventDefault = vi.fn();
      const event = {
        reason: new Error('Promise rejection'),
        preventDefault,
      };

      handler?.(event);

      expect(notify.notifyWarning).toHaveBeenCalledWith(
        'Необработанное отклонение',
        'Promise rejection',
      );
      expect(preventDefault).toHaveBeenCalled();
    });

    it('should handle string rejection reasons', () => {
      setupGlobalErrorHandlers();

      const addEventListenerCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock
        .calls;
      const unhandledRejectionCall = addEventListenerCalls.find(
        (call: unknown[]) => call[0] === 'unhandledrejection',
      );
      const handler = unhandledRejectionCall?.[1];

      const event = {
        reason: 'String rejection',
        preventDefault: vi.fn(),
      };

      handler?.(event);

      expect(notify.notifyWarning).toHaveBeenCalledWith(
        'Необработанное отклонение',
        'String rejection',
      );
    });

    it('should handle object rejection reasons with message', () => {
      setupGlobalErrorHandlers();

      const addEventListenerCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock
        .calls;
      const unhandledRejectionCall = addEventListenerCalls.find(
        (call: unknown[]) => call[0] === 'unhandledrejection',
      );
      const handler = unhandledRejectionCall?.[1];

      const event = {
        reason: { message: 'Object rejection' },
        preventDefault: vi.fn(),
      };

      handler?.(event);

      expect(notify.notifyWarning).toHaveBeenCalledWith(
        'Необработанное отклонение',
        'Object rejection',
      );
    });
  });

  describe('PII masking', () => {
    it('should mask email addresses', () => {
      logError('Error with email: user@example.com');

      expect(window.electron!.log.error).toHaveBeenCalledWith(
        'Application error',
        expect.objectContaining({
          message: 'Error with email: [MASKED]',
        }),
      );
    });

    it('should mask credit card numbers', () => {
      logError('Card number: 4111111111111111');

      expect(window.electron!.log.error).toHaveBeenCalledWith(
        'Application error',
        expect.objectContaining({
          message: 'Card number: [MASKED]',
        }),
      );
    });

    it('should mask API keys', () => {
      logError('API_KEY=sk-1234567890abcdef');

      expect(window.electron!.log.error).toHaveBeenCalledWith(
        'Application error',
        expect.objectContaining({
          message: '[MASKED]',
        }),
      );
    });

    it('should mask passwords', () => {
      logError('password: secretPassword123');

      expect(window.electron!.log.error).toHaveBeenCalledWith(
        'Application error',
        expect.objectContaining({
          message: '[MASKED]',
        }),
      );
    });

    it('should mask sensitive info in context objects', () => {
      logError('Error', {
        email: 'user@example.com',
        apiKey: 'api-key-12345',
      });

      const callArgs = (window.electron!.log.error as ReturnType<typeof vi.fn>).mock.calls[0];
      const context = callArgs[1].context;

      expect(JSON.stringify(context)).toContain('[MASKED]');
      expect(JSON.stringify(context)).not.toContain('user@example.com');
    });
  });

  describe('logging functions', () => {
    it('logError should log to console and electron', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      logError(error, { key: 'value' });

      expect(consoleSpy).toHaveBeenCalledWith('Application error:', error, { key: 'value' });
      expect(window.electron!.log.error).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('logWarning should log to console and electron', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logWarning('Warning message', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalledWith('Application warning:', 'Warning message', {
        key: 'value',
      });
      expect(window.electron!.log.warn).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('logInfo should log to console and electron', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logInfo('Info message', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalledWith('Application info:', 'Info message', {
        key: 'value',
      });
      expect(window.electron!.log.info).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('without electron API', () => {
    it('should handle missing electron.log gracefully', () => {
      global.window = {} as unknown as Window & typeof globalThis;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logError('Test error');

      expect(consoleSpy).toHaveBeenCalledWith('Application error:', 'Test error', undefined);

      consoleSpy.mockRestore();
    });
  });
});
