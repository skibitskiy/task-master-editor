import { describe, it, expect } from 'vitest';
import { safeParseTasksFile, validateTask, collectTaskErrors } from '../../src/redux/helpers';
import type { TasksFile, Task } from '@app/shared';

describe('helpers: parsing and validation', () => {
  it('safeParseTasksFile parses valid tasks and has no errors', () => {
    const input = {
      master: {
        tasks: [
          { id: 1, title: 'A', status: 'pending' },
          { id: 2, title: 'B', description: 'x' },
        ],
      },
    };
    const { tasksFile, errors } = safeParseTasksFile(input);
    expect(tasksFile.master.tasks.length).toBe(2);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('safeParseTasksFile collects errors for invalid tasks but returns data', () => {
    const input = {
      master: {
        tasks: [
          { id: 3, title: '' }, // invalid title
          { id: 4, title: 'OK', dependencies: 'nope' }, // invalid deps
        ],
      },
    };
    const { tasksFile, errors } = safeParseTasksFile(input);
    expect(tasksFile.master.tasks.length).toBe(2);
    expect(Object.keys(errors)).toContain('3');
    expect(Object.keys(errors)).toContain('4');
  });

  it('validateTask detects basic issues', () => {
    expect(validateTask({ id: 1, title: 'ok' })).toHaveLength(0);
    expect(validateTask({ id: 1, title: '' })).toContain('title must be non-empty string');
    expect(validateTask({ title: 'x' })).toContain('id is required');
    expect(validateTask({ id: 2, title: 'x', dependencies: 'bad' })).toContain(
      'dependencies must be array',
    );
  });

  it('collectTaskErrors maps errors per task id', () => {
    const tf: TasksFile = {
      master: {
        tasks: [{ id: 1, title: 'ok' } as Task, { id: 2, title: '' } as Task],
      },
    };
    const map = collectTaskErrors(tf);
    expect(Object.keys(map)).toContain('2');
    expect(map['2'].length).toBeGreaterThan(0);
  });
});
