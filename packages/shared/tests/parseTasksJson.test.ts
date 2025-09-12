import { describe, expect, it } from 'vitest';

import { parseTasksJson } from '../src/model';

describe('parseTasksJson', () => {
  it('should parse valid JSON with master branch', () => {
    const input = JSON.stringify({
      master: {
        tasks: [
          {
            id: 1,
            title: 'Test task',
            description: 'Test description',
            status: 'pending',
          },
        ],
      },
    });

    const result = parseTasksJson(input);
    expect(result.master).toBeDefined();
    expect(result.master.tasks).toHaveLength(1);
    expect(result.master.tasks[0].title).toBe('Test task');
  });

  it('should parse valid JSON with custom branch names', () => {
    const input = JSON.stringify({
      azaza: {
        tasks: [],
      },
      'feature-auth': {
        tasks: [
          {
            id: 'auth-1',
            title: 'Implement login',
            status: 'in-progress',
          },
        ],
      },
    });

    const result = parseTasksJson(input);
    expect(result.azaza).toBeDefined();
    expect(result.azaza.tasks).toHaveLength(0);
    expect(result['feature-auth']).toBeDefined();
    expect(result['feature-auth'].tasks).toHaveLength(1);
    expect(result['feature-auth'].tasks[0].title).toBe('Implement login');
  });

  it('should parse branches with metadata', () => {
    const input = JSON.stringify({
      dev: {
        tasks: [],
        metadata: {
          created: '2024-01-01',
          description: 'Development branch',
        },
      },
    });

    const result = parseTasksJson(input);
    expect(result.dev.metadata).toBeDefined();
    expect(result.dev.metadata?.created).toBe('2024-01-01');
    expect(result.dev.metadata?.description).toBe('Development branch');
  });

  it('should parse multiple branches with different task types', () => {
    const input = JSON.stringify({
      master: {
        tasks: [
          {
            id: 1,
            title: 'Numeric ID task',
          },
        ],
      },
      dev: {
        tasks: [
          {
            id: 'string-id',
            title: 'String ID task',
            priority: 'high',
            dependencies: [1, 'other-task'],
          },
        ],
      },
    });

    const result = parseTasksJson(input);
    expect(result.master.tasks[0].id).toBe(1);
    expect(result.dev.tasks[0].id).toBe('string-id');
    expect(result.dev.tasks[0].priority).toBe('high');
    expect(result.dev.tasks[0].dependencies).toEqual([1, 'other-task']);
  });

  it('should handle empty file (no branches)', () => {
    const input = JSON.stringify({});
    const result = parseTasksJson(input);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should throw on invalid JSON', () => {
    const input = 'invalid json {';
    expect(() => parseTasksJson(input)).toThrow('Invalid JSON');
  });

  it('should throw on invalid task structure', () => {
    const input = JSON.stringify({
      master: {
        tasks: [
          {
            // Missing required title field
            id: 1,
            description: 'Task without title',
          },
        ],
      },
    });

    expect(() => parseTasksJson(input)).toThrow('Invalid schema');
  });

  it('should throw on invalid branch structure', () => {
    const input = JSON.stringify({
      master: {
        // Missing required tasks field
        metadata: {
          created: '2024-01-01',
        },
      },
    });

    expect(() => parseTasksJson(input)).toThrow('Invalid schema');
  });

  it('should throw on invalid task status', () => {
    const input = JSON.stringify({
      master: {
        tasks: [
          {
            id: 1,
            title: 'Task with invalid status',
            status: 'invalid-status',
          },
        ],
      },
    });

    expect(() => parseTasksJson(input)).toThrow('Invalid schema');
  });

  it('should handle all valid task statuses', () => {
    const statuses = ['pending', 'in-progress', 'done', 'deferred', 'cancelled', 'blocked'];

    statuses.forEach((status) => {
      const input = JSON.stringify({
        test: {
          tasks: [
            {
              id: 1,
              title: `Task with ${status} status`,
              status,
            },
          ],
        },
      });

      expect(() => parseTasksJson(input)).not.toThrow();
      const result = parseTasksJson(input);
      expect(result.test.tasks[0].status).toBe(status);
    });
  });

  it('should handle branches with special characters in names', () => {
    const input = JSON.stringify({
      'feature/user-auth': {
        tasks: [],
      },
      'hotfix-2024.1': {
        tasks: [],
      },
      test_branch: {
        tasks: [],
      },
    });

    const result = parseTasksJson(input);
    expect(result['feature/user-auth']).toBeDefined();
    expect(result['hotfix-2024.1']).toBeDefined();
    expect(result['test_branch']).toBeDefined();
  });
});
