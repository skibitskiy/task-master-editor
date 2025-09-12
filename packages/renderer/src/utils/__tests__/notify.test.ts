import { Toaster } from '@gravity-ui/uikit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notify, notifyError, notifyInfo, notifySuccess, notifyWarning, setToasterInstance } from '../notify';

describe('notify utility', () => {
  let mockToaster: Toaster;
  let addSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addSpy = vi.fn();
    mockToaster = {
      add: addSpy,
    } as unknown as Toaster;
    setToasterInstance(mockToaster);
  });

  describe('notify', () => {
    it('should call toaster.add with correct options', () => {
      notify({
        title: 'Test Title',
        message: 'Test Message',
        theme: 'info',
        autoHiding: 3000,
      });

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          content: 'Test Message',
          theme: 'info',
          autoHiding: 3000,
        }),
      );
    });

    it('should generate unique names for notifications', () => {
      notify({ title: 'Test 1' });
      notify({ title: 'Test 2' });

      const firstCall = addSpy.mock.calls[0][0];
      const secondCall = addSpy.mock.calls[1][0];

      expect(firstCall.name).not.toBe(secondCall.name);
    });

    it('should handle actions correctly', () => {
      const onClick = vi.fn();
      notify({
        title: 'Test',
        actions: [{ label: 'Action 1', onClick }],
      });

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: [
            expect.objectContaining({
              label: 'Action 1',
              onClick,
              view: 'outlined',
              removeAfterClick: true,
            }),
          ],
        }),
      );
    });

    it('should not notify if toaster instance is not set', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      setToasterInstance(null as unknown as Toaster);

      notify({ title: 'Test' });

      expect(addSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Toaster instance not initialized. Call setToasterInstance first.');

      consoleSpy.mockRestore();
    });
  });

  describe('convenience methods', () => {
    it('notifySuccess should use success theme with 3000ms auto-hiding', () => {
      notifySuccess('Success', 'Success message');

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          content: 'Success message',
          theme: 'success',
          autoHiding: 3000,
        }),
      );
    });

    it('notifyError should use danger theme with no auto-hiding', () => {
      notifyError('Error', 'Error message');

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          content: 'Error message',
          theme: 'danger',
          autoHiding: false,
        }),
      );
    });

    it('notifyWarning should use warning theme with 5000ms auto-hiding', () => {
      notifyWarning('Warning', 'Warning message');

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Warning',
          content: 'Warning message',
          theme: 'warning',
          autoHiding: 5000,
        }),
      );
    });

    it('notifyInfo should use info theme with 5000ms auto-hiding', () => {
      notifyInfo('Info', 'Info message');

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Info',
          content: 'Info message',
          theme: 'info',
          autoHiding: 5000,
        }),
      );
    });
  });
});
