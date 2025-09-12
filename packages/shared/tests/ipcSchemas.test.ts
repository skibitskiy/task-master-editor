import { describe, expect, it } from 'vitest';

import {
  validateFileReadInput,
  validateFileReadResult,
  validateFileWriteInput,
  validateFileWriteResult,
  validateSettingsUpdateInput,
  validateWorkspaceSelectOptions,
  validateWorkspaceSelectResult,
} from '../src/ipc';

describe('IPC schemas', () => {
  it('validates workspace select options', () => {
    expect(() => validateWorkspaceSelectOptions({ type: 'directory' })).not.toThrow();
    expect(() => validateWorkspaceSelectOptions({ type: 'file', multiple: true })).not.toThrow();
    expect(() => validateWorkspaceSelectOptions({ type: 'nope' })).toThrow();
  });

  it('validates workspace select result', () => {
    expect(() => validateWorkspaceSelectResult({ paths: [] })).not.toThrow();
    expect(() => validateWorkspaceSelectResult({ paths: ['a'] })).not.toThrow();
    expect(() => validateWorkspaceSelectResult({ paths: [1] })).toThrow();
  });

  it('validates file read/write payloads', () => {
    expect(() => validateFileReadInput({ path: '/tmp/x' })).not.toThrow();
    expect(() => validateFileReadResult({ data: 'ok' })).not.toThrow();
    expect(() => validateFileWriteInput({ path: '/tmp/x', data: 'x' })).not.toThrow();
    expect(() => validateFileWriteResult({ ok: true })).not.toThrow();
    expect(() => validateFileReadInput({})).toThrow();
  });

  describe('validateSettingsUpdateInput', () => {
    it('should handle settings with recentPaths', () => {
      const input = {
        settings: {
          recentPaths: ['/path1', '/path2'],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          recentPaths: ['/path1', '/path2'],
        },
      });
    });

    it('should handle settings with preferences', () => {
      const input = {
        settings: {
          preferences: { mruEnabled: true },
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          preferences: { mruEnabled: true },
        },
      });
    });

    it('should handle settings with both recentPaths and preferences', () => {
      const input = {
        settings: {
          recentPaths: ['/path1'],
          preferences: { mruEnabled: false },
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          recentPaths: ['/path1'],
          preferences: { mruEnabled: false },
        },
      });
    });

    it('should handle empty settings object', () => {
      const input = {
        settings: {},
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {},
      });
    });

    it('should handle missing settings property', () => {
      const input = {};

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {},
      });
    });

    it('should handle the exact case from Redux', () => {
      const input = {
        settings: {
          recentPaths: [
            '/Users/moskibitskiy/pets/task-master-editor/.taskmaster/tasks/tasks.json',
            '/Users/moskibitskiy/dev/another-project/tasks.json',
          ],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result.settings.recentPaths).toBeDefined();
      expect(result.settings.recentPaths).toHaveLength(2);
      expect(result).toEqual({
        settings: {
          recentPaths: [
            '/Users/moskibitskiy/pets/task-master-editor/.taskmaster/tasks/tasks.json',
            '/Users/moskibitskiy/dev/another-project/tasks.json',
          ],
        },
      });
    });

    it('should validate recentPaths are strings', () => {
      const input = {
        settings: {
          recentPaths: ['/valid', 123, '/another'],
        },
      };

      expect(() => validateSettingsUpdateInput(input)).toThrow('recentPaths must be string[]');
    });

    it('should handle invalid preferences gracefully', () => {
      const input = {
        settings: {
          preferences: 'invalid',
        },
      };

      expect(() => validateSettingsUpdateInput(input)).toThrow('preferences must be object');
    });
  });
});
