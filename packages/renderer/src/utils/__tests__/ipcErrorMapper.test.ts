import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  mapIPCError, 
  handleIPCError, 
  createIPCErrorHandler,
  withIPCErrorHandling 
} from '../ipcErrorMapper';
import * as notify from '../notify';
import * as globalErrorHandler from '../globalErrorHandler';

vi.mock('../notify', () => ({
  notifyError: vi.fn(),
  notifyWarning: vi.fn(),
}));

vi.mock('../globalErrorHandler', () => ({
  logError: vi.fn(),
}));

describe('ipcErrorMapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapIPCError', () => {
    it('should map known error codes to user-friendly messages', () => {
      expect(mapIPCError({ code: 'FILE_NOT_FOUND', message: '', details: null }))
        .toBe('Файл не найден. Проверьте путь к файлу.');
      
      expect(mapIPCError({ code: 'PERMISSION_DENIED', message: '', details: null }))
        .toBe('Недостаточно прав для выполнения операции.');
    });

    it('should return the error message if code is unknown', () => {
      expect(mapIPCError({ code: 'UNKNOWN_CODE', message: 'Custom error', details: null }))
        .toBe('Custom error');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      expect(mapIPCError(error)).toBe('Test error');
    });

    it('should handle Error objects with code property', () => {
      const error = new Error('Test error') as Error & { code: string };
      error.code = 'FILE_NOT_FOUND';
      expect(mapIPCError(error)).toBe('Файл не найден. Проверьте путь к файлу.');
    });

    it('should handle string errors', () => {
      expect(mapIPCError('String error')).toBe('String error');
    });

    it('should handle null/undefined errors', () => {
      expect(mapIPCError(null)).toBe('Произошла неизвестная ошибка. Попробуйте еще раз.');
      expect(mapIPCError(undefined)).toBe('Произошла неизвестная ошибка. Попробуйте еще раз.');
    });

    it('should handle objects without code or message', () => {
      expect(mapIPCError({})).toBe('Произошла неизвестная ошибка. Попробуйте еще раз.');
    });
  });

  describe('handleIPCError', () => {
    it('should notify and log the error', () => {
      const error = { code: 'FILE_NOT_FOUND', message: 'File not found', details: null };
      
      handleIPCError(error, 'Loading file');

      expect(notify.notifyError).toHaveBeenCalledWith(
        'Ошибка: Loading file',
        'Файл не найден. Проверьте путь к файлу.'
      );

      expect(globalErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'Loading file',
          originalError: error,
        })
      );
    });

    it('should handle errors without context', () => {
      const error = new Error('Test error');
      
      handleIPCError(error);

      expect(notify.notifyError).toHaveBeenCalledWith(
        'Ошибка операции',
        'Test error'
      );
    });
  });

  describe('createIPCErrorHandler', () => {
    it('should create a handler function that uses the provided context', () => {
      const handler = createIPCErrorHandler('Test context');
      const error = { code: 'TIMEOUT', message: '', details: null };

      handler(error);

      expect(notify.notifyError).toHaveBeenCalledWith(
        'Ошибка: Test context',
        'Превышено время ожидания операции. Попробуйте еще раз.'
      );
    });
  });

  describe('withIPCErrorHandling', () => {
    it('should return the result on success', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await withIPCErrorHandling(operation, 'Test operation');

      expect(result).toBe('success');
      expect(notify.notifyError).not.toHaveBeenCalled();
    });

    it('should handle errors and return null', async () => {
      const error = new Error('Operation failed');
      const operation = vi.fn().mockRejectedValue(error);
      
      const result = await withIPCErrorHandling(operation, 'Test operation');

      expect(result).toBeNull();
      expect(notify.notifyError).toHaveBeenCalledWith(
        'Ошибка: Test operation',
        'Operation failed'
      );
    });

    it('should show warning instead of error when specified', async () => {
      const error = new Error('Warning');
      const operation = vi.fn().mockRejectedValue(error);
      
      const result = await withIPCErrorHandling(operation, 'Test operation', true);

      expect(result).toBeNull();
      expect(notify.notifyWarning).toHaveBeenCalledWith(
        'Test operation',
        'Warning'
      );
      expect(notify.notifyError).not.toHaveBeenCalled();
    });
  });
});