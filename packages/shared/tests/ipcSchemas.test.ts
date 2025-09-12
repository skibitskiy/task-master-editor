import { describe, expect, it } from 'vitest';

import {
  validateFileReadInput,
  validateFileReadResult,
  validateFileWriteInput,
  validateFileWriteResult,
  validateSettingsData,
  validateSettingsGetResult,
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

    it('should handle null input', () => {
      const result = validateSettingsUpdateInput(null);

      expect(result).toEqual({
        settings: {},
      });
    });

    it('should handle undefined input', () => {
      const result = validateSettingsUpdateInput(undefined);

      expect(result).toEqual({
        settings: {},
      });
    });

    it('should handle null settings property', () => {
      const input = {
        settings: null,
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {},
      });
    });

    it('should handle empty recentPaths array', () => {
      const input = {
        settings: {
          recentPaths: [],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          recentPaths: [],
        },
      });
    });

    it('should handle null recentPaths', () => {
      const input = {
        settings: {
          recentPaths: null,
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          recentPaths: [],
        },
      });
    });

    it('should handle non-array recentPaths', () => {
      const input = {
        settings: {
          recentPaths: 'not-an-array',
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          recentPaths: [],
        },
      });
    });

    it('should handle mixed valid and invalid paths in recentPaths', () => {
      const input = {
        settings: {
          recentPaths: ['/valid/path', null, '/another/valid/path'],
        },
      };

      expect(() => validateSettingsUpdateInput(input)).toThrow('recentPaths must be string[]');
    });

    it('should handle empty strings in recentPaths', () => {
      const input = {
        settings: {
          recentPaths: ['/valid/path', '', '/another/path'],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          recentPaths: ['/valid/path', '', '/another/path'],
        },
      });
    });

    it('should handle null preferences', () => {
      const input = {
        settings: {
          preferences: null,
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          preferences: null,
        },
      });
    });

    it('should handle empty preferences object', () => {
      const input = {
        settings: {
          preferences: {},
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          preferences: {},
        },
      });
    });

    it('should handle complex preferences object', () => {
      const input = {
        settings: {
          preferences: {
            mruEnabled: true,
            theme: 'dark',
            autoSave: false,
            maxRecentFiles: 10,
            nested: {
              key: 'value',
              number: 42,
            },
          },
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          preferences: {
            mruEnabled: true,
            theme: 'dark',
            autoSave: false,
            maxRecentFiles: 10,
            nested: {
              key: 'value',
              number: 42,
            },
          },
        },
      });
    });

    it('should handle preferences with primitive values', () => {
      const input = {
        settings: {
          preferences: 123,
        },
      };

      expect(() => validateSettingsUpdateInput(input)).toThrow('preferences must be object');
    });

    it('should handle preferences with array value', () => {
      const input = {
        settings: {
          preferences: ['not', 'an', 'object'],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          preferences: ['not', 'an', 'object'],
        },
      });
    });

    it('should ignore unknown properties in settings', () => {
      const input = {
        settings: {
          recentPaths: ['/path'],
          preferences: { key: 'value' },
          unknownProperty: 'should be ignored',
          anotherUnknown: 123,
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          recentPaths: ['/path'],
          preferences: { key: 'value' },
        },
      });
    });

    it('should handle very long recentPaths arrays', () => {
      const longPaths = Array.from({ length: 1000 }, (_, i) => `/path/to/file${i}.json`);
      const input = {
        settings: {
          recentPaths: longPaths,
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result.settings.recentPaths!).toHaveLength(1000);
      expect(result.settings.recentPaths![0]).toBe('/path/to/file0.json');
      expect(result.settings.recentPaths![999]).toBe('/path/to/file999.json');
    });

    it('should handle paths with special characters', () => {
      const input = {
        settings: {
          recentPaths: [
            '/path/with spaces/file.json',
            '/path/with-дashes/файл.json',
            '/path/with/émojis/🚀.json',
            '/path\\with\\backslashes\\file.json',
          ],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          recentPaths: [
            '/path/with spaces/file.json',
            '/path/with-дashes/файл.json',
            '/path/with/émojis/🚀.json',
            '/path\\with\\backslashes\\file.json',
          ],
        },
      });
    });

    it('should maintain order of recentPaths', () => {
      const input = {
        settings: {
          recentPaths: ['/third', '/first', '/second'],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result.settings.recentPaths).toEqual(['/third', '/first', '/second']);
    });

    it('should handle customModels', () => {
      const input = {
        settings: {
          customModels: [
            { id: '1', name: 'GPT-4 Turbo', value: 'openai/gpt-4-turbo' },
            { id: '2', name: 'Claude 3', value: 'anthropic/claude-3-opus' },
          ],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          customModels: [
            { id: '1', name: 'GPT-4 Turbo', value: 'openai/gpt-4-turbo' },
            { id: '2', name: 'Claude 3', value: 'anthropic/claude-3-opus' },
          ],
        },
      });
    });

    it('should handle empty customModels array', () => {
      const input = {
        settings: {
          customModels: [],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          customModels: [],
        },
      });
    });

    it('should handle null customModels', () => {
      const input = {
        settings: {
          customModels: null,
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          customModels: undefined,
        },
      });
    });

    it('should validate customModels structure', () => {
      const input = {
        settings: {
          customModels: [
            { id: '1', name: 'Valid Model', value: 'openai/gpt-4' },
            { id: '', name: 'Invalid Model', value: 'openai/gpt-3.5' },
          ],
        },
      };

      expect(() => validateSettingsUpdateInput(input)).toThrow('CustomModel.id must be non-empty string');
    });

    it('should validate customModels is array', () => {
      const input = {
        settings: {
          customModels: 'not-an-array',
        },
      };

      expect(() => validateSettingsUpdateInput(input)).toThrow('customModels must be array');
    });

    it('should handle all settings properties together', () => {
      const input = {
        settings: {
          recentPaths: ['/path1', '/path2'],
          preferences: { theme: 'dark', autoSave: true },
          customModels: [{ id: '1', name: 'GPT-4', value: 'openai/gpt-4' }],
        },
      };

      const result = validateSettingsUpdateInput(input);

      expect(result).toEqual({
        settings: {
          recentPaths: ['/path1', '/path2'],
          preferences: { theme: 'dark', autoSave: true },
          customModels: [{ id: '1', name: 'GPT-4', value: 'openai/gpt-4' }],
        },
      });
    });
  });

  describe('validateSettingsData', () => {
    it('should handle basic settings data', () => {
      const input = {
        recentPaths: ['/path1', '/path2'],
        preferences: { theme: 'dark' },
      };

      const result = validateSettingsData(input);

      expect(result).toEqual({
        recentPaths: ['/path1', '/path2'],
        preferences: { theme: 'dark' },
        customModels: undefined,
      });
    });

    it('should handle settings with customModels', () => {
      const input = {
        recentPaths: ['/path1'],
        preferences: { autoSave: true },
        customModels: [
          { id: '1', name: 'GPT-4 Turbo', value: 'openai/gpt-4-turbo' },
          { id: '2', name: 'Claude 3', value: 'anthropic/claude-3-opus' },
        ],
      };

      const result = validateSettingsData(input);

      expect(result).toEqual({
        recentPaths: ['/path1'],
        preferences: { autoSave: true },
        customModels: [
          { id: '1', name: 'GPT-4 Turbo', value: 'openai/gpt-4-turbo' },
          { id: '2', name: 'Claude 3', value: 'anthropic/claude-3-opus' },
        ],
      });
    });

    it('should handle empty customModels array', () => {
      const input = {
        recentPaths: [],
        preferences: {},
        customModels: [],
      };

      const result = validateSettingsData(input);

      expect(result).toEqual({
        recentPaths: [],
        preferences: {},
        customModels: [],
      });
    });

    it('should handle null customModels', () => {
      const input = {
        recentPaths: [],
        preferences: {},
        customModels: null,
      };

      const result = validateSettingsData(input);

      expect(result).toEqual({
        recentPaths: [],
        preferences: {},
        customModels: undefined,
      });
    });

    it('should validate customModel structure', () => {
      const input = {
        recentPaths: [],
        customModels: [
          { id: '', name: 'Invalid', value: 'openai/gpt-4' }, // Empty id should fail
        ],
      };

      expect(() => validateSettingsData(input)).toThrow('CustomModel.id must be non-empty string');
    });

    it('should validate all customModel fields', () => {
      const invalidModels = [
        { id: '', name: 'Valid', value: 'valid' }, // Empty id
        { id: 'valid', name: '', value: 'valid' }, // Empty name
        { id: 'valid', name: 'valid', value: '' }, // Empty value
        { name: 'Valid', value: 'valid' }, // Missing id
        { id: 'valid', value: 'valid' }, // Missing name
        { id: 'valid', name: 'valid' }, // Missing value
      ];

      invalidModels.forEach((invalidModel, index) => {
        const input = {
          recentPaths: [],
          customModels: [invalidModel],
        };

        expect(() => validateSettingsData(input), `Model ${index} should fail validation`).toThrow();
      });
    });

    it('should handle customModels with non-array value', () => {
      const input = {
        recentPaths: [],
        customModels: 'not-an-array',
      };

      expect(() => validateSettingsData(input)).toThrow('customModels must be array');
    });
  });

  describe('validateSettingsGetResult', () => {
    it('should validate complete settings get result', () => {
      const input = {
        settings: {
          recentPaths: ['/path1', '/path2'],
          preferences: { theme: 'dark', autoSave: true },
          customModels: [
            { id: '1', name: 'GPT-4', value: 'openai/gpt-4' },
            { id: '2', name: 'Claude', value: 'anthropic/claude-3-opus' },
          ],
        },
      };

      const result = validateSettingsGetResult(input);

      expect(result).toEqual({
        settings: {
          recentPaths: ['/path1', '/path2'],
          preferences: { theme: 'dark', autoSave: true },
          customModels: [
            { id: '1', name: 'GPT-4', value: 'openai/gpt-4' },
            { id: '2', name: 'Claude', value: 'anthropic/claude-3-opus' },
          ],
        },
      });
    });

    it('should validate settings get result without customModels', () => {
      const input = {
        settings: {
          recentPaths: ['/path1'],
          preferences: { theme: 'light' },
        },
      };

      const result = validateSettingsGetResult(input);

      expect(result).toEqual({
        settings: {
          recentPaths: ['/path1'],
          preferences: { theme: 'light' },
          customModels: undefined,
        },
      });
    });

    it('should validate empty settings get result', () => {
      const input = {
        settings: {
          recentPaths: [],
          preferences: {},
        },
      };

      const result = validateSettingsGetResult(input);

      expect(result).toEqual({
        settings: {
          recentPaths: [],
          preferences: {},
          customModels: undefined,
        },
      });
    });

    it('should handle missing settings object', () => {
      const input = {};

      const result = validateSettingsGetResult(input);

      expect(result).toEqual({
        settings: {
          recentPaths: [],
          preferences: undefined,
          customModels: undefined,
        },
      });
    });

    it('should validate and propagate customModel validation errors', () => {
      const input = {
        settings: {
          recentPaths: [],
          preferences: {},
          customModels: [
            { id: 'valid', name: 'valid', value: 'valid' },
            { id: '', name: 'invalid', value: 'valid' }, // This should fail
          ],
        },
      };

      expect(() => validateSettingsGetResult(input)).toThrow('CustomModel.id must be non-empty string');
    });

    it('should handle null input', () => {
      const result = validateSettingsGetResult(null);

      expect(result).toEqual({
        settings: {
          recentPaths: [],
          preferences: undefined,
          customModels: undefined,
        },
      });
    });
  });
});
