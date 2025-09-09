import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import dataReducer, { loadFromPath } from '../dataSlice';

// Mock the shared module
vi.mock('@app/shared', () => ({
  parseTasksJson: vi.fn(),
}));

// Mock the helpers
vi.mock('../helpers', () => ({
  collectTaskErrors: vi.fn(() => ({})),
  validateTask: vi.fn(() => []),
}));

import { parseTasksJson } from '@app/shared';
import { collectTaskErrors } from '../helpers';

const mockParseTasksJson = parseTasksJson as ReturnType<typeof vi.fn>;
const mockCollectTaskErrors = collectTaskErrors as ReturnType<typeof vi.fn>;

// Mock window.api
const mockFileRead = vi.fn();

// Set up window.api mock
Object.defineProperty(global, 'window', {
  value: {
    api: {
      file: {
        read: mockFileRead,
      },
    },
  },
  writable: true,
});

describe('dataSlice validation', () => {
  let store: ReturnType<typeof configureStore<{ data: ReturnType<typeof dataReducer> }>>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset window.api mock for each test
    Object.defineProperty(global, 'window', {
      value: {
        api: {
          file: {
            read: mockFileRead,
          },
        },
      },
      writable: true,
    });

    store = configureStore({
      reducer: {
        data: dataReducer,
      },
    });
  });

  describe('loadFromPath', () => {
    it('should successfully load valid tasks.json file', async () => {
      const validTasksFile = {
        master: {
          tasks: [
            {
              id: 1,
              title: 'Test Task',
              description: 'Test Description',
              status: 'pending',
              priority: 'high',
            },
          ],
          metadata: {
            created: '2023-01-01T00:00:00.000Z',
            updated: '2023-01-01T00:00:00.000Z',
            description: 'Test tasks',
          },
        },
      };

      mockFileRead.mockResolvedValue({ data: JSON.stringify(validTasksFile) });
      mockParseTasksJson.mockReturnValue(validTasksFile);
      mockCollectTaskErrors.mockReturnValue({});

      const result = await store.dispatch(loadFromPath('/path/to/valid/tasks.json'));

      expect(result.meta.requestStatus).toBe('fulfilled');
      if (loadFromPath.fulfilled.match(result)) {
        expect(result.payload).toEqual({
          path: '/path/to/valid/tasks.json',
          tasksFile: validTasksFile,
          errors: {},
        });
      }

      const state = store.getState().data;
      expect(state.filePath).toBe('/path/to/valid/tasks.json');
      expect(state.tasksFile).toEqual(validTasksFile);
      expect(state.errors.general).toHaveLength(0);
    });

    it('should handle invalid JSON with user-friendly error', async () => {
      const invalidJson = '{ invalid json';

      mockFileRead.mockResolvedValue({ data: invalidJson });
      mockParseTasksJson.mockImplementation(() => {
        throw new Error('Invalid JSON: Unexpected token i in JSON at position 2');
      });

      const result = await store.dispatch(loadFromPath('/path/to/invalid.json'));

      expect(result.meta.requestStatus).toBe('rejected');
      if (loadFromPath.rejected.match(result)) {
        expect(result.payload).toBe('Invalid JSON: Unexpected token i in JSON at position 2');
      }

      const state = store.getState().data;
      expect(state.errors.general).toContain(
        'Invalid JSON: Unexpected token i in JSON at position 2',
      );
    });

    it('should handle invalid schema with detailed error information', async () => {
      const invalidSchema = {
        master: {
          tasks: [
            {
              // Missing required 'id' field
              title: '', // Empty title (invalid)
              status: 'invalid-status', // Invalid status
            },
          ],
        },
      };

      mockFileRead.mockResolvedValue({ data: JSON.stringify(invalidSchema) });
      mockParseTasksJson.mockImplementation(() => {
        throw new Error(
          'Invalid schema: master.tasks.0.id: Required; master.tasks.0.title: String must contain at least 1 character(s); master.tasks.0.status: Invalid enum value',
        );
      });

      const result = await store.dispatch(loadFromPath('/path/to/invalid-schema.json'));

      expect(result.meta.requestStatus).toBe('rejected');
      if (loadFromPath.rejected.match(result)) {
        expect(result.payload).toContain('Invalid schema:');
        expect(result.payload).toContain('master.tasks.0.id: Required');
        expect(result.payload).toContain(
          'master.tasks.0.title: String must contain at least 1 character',
        );
      }
    });

    it('should handle missing preload API', async () => {
      // Mock missing API
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', {
        value: { api: null },
        writable: true,
      });

      const result = await store.dispatch(loadFromPath('/path/to/file.json'));

      expect(result.meta.requestStatus).toBe('rejected');
      if (loadFromPath.rejected.match(result)) {
        expect(result.payload).toBe('No preload API');
      }

      // Restore original window
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      });
    });

    it('should handle file read errors', async () => {
      // Ensure window.api exists for this test
      Object.defineProperty(global, 'window', {
        value: {
          api: {
            file: {
              read: mockFileRead,
            },
          },
        },
        writable: true,
      });

      mockFileRead.mockRejectedValue(new Error('File not found'));

      const result = await store.dispatch(loadFromPath('/path/to/nonexistent.json'));

      expect(result.meta.requestStatus).toBe('rejected');
      if (loadFromPath.rejected.match(result)) {
        expect(result.payload).toBe('File not found');
      }
    });

    it('should collect task validation errors even for valid schema', async () => {
      const tasksFileWithErrors = {
        master: {
          tasks: [
            {
              id: 1,
              title: 'Valid Task',
              status: 'pending',
            },
            {
              id: 2,
              title: 'Task with dependency issues',
              status: 'pending',
              dependencies: [999], // Non-existent dependency
            },
          ],
        },
      };

      const taskErrors = {
        '2': ['Invalid dependency: task 999 does not exist'],
      };

      mockFileRead.mockResolvedValue({ data: JSON.stringify(tasksFileWithErrors) });
      mockParseTasksJson.mockReturnValue(tasksFileWithErrors);
      mockCollectTaskErrors.mockReturnValue(taskErrors);

      const result = await store.dispatch(loadFromPath('/path/to/tasks-with-errors.json'));

      expect(result.meta.requestStatus).toBe('fulfilled');
      if (loadFromPath.fulfilled.match(result)) {
        expect(result.payload.errors).toEqual(taskErrors);
      }

      const state = store.getState().data;
      expect(state.errors.byTaskId).toEqual(taskErrors);
      expect(state.errors.general).toHaveLength(0);
    });

    it('should handle partial validation errors without crashing', async () => {
      const partiallyValidFile = {
        master: {
          tasks: [
            {
              id: 1,
              title: 'Valid Task',
              status: 'pending',
            },
            {
              id: 2,
              title: 'Task with minor issues',
              status: 'pending',
              priority: 'urgent', // Invalid priority value
            },
          ],
        },
      };

      // Simulate Zod allowing the file to pass but with some field coercion
      mockFileRead.mockResolvedValue({ data: JSON.stringify(partiallyValidFile) });
      mockParseTasksJson.mockReturnValue({
        ...partiallyValidFile,
        master: {
          ...partiallyValidFile.master,
          tasks: partiallyValidFile.master.tasks.map((task) => ({
            ...task,
            priority: task.priority === 'urgent' ? undefined : task.priority, // Zod coercion
          })),
        },
      });
      mockCollectTaskErrors.mockReturnValue({
        '2': ['Priority "urgent" is not valid, using default'],
      });

      const result = await store.dispatch(loadFromPath('/path/to/partial-errors.json'));

      expect(result.meta.requestStatus).toBe('fulfilled');
      if (loadFromPath.fulfilled.match(result)) {
        expect(result.payload.errors['2']).toContain(
          'Priority "urgent" is not valid, using default',
        );
      }
    });
  });
});
