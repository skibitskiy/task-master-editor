import type { Task, TasksFile } from '@app/shared';
import { describe, expect, it } from 'vitest';

import { collectTaskErrors, validateTask } from '../../src/redux/helpers';

describe('helpers: parsing and validation', () => {
  it('validateTask detects basic issues', () => {
    expect(validateTask({ id: 1, title: 'ok' })).toHaveLength(0);
    expect(validateTask({ id: 1, title: '' })).toContain('title must be non-empty string');
    expect(validateTask({ title: 'x' })).toContain('id is required');
    expect(validateTask({ id: 2, title: 'x', dependencies: 'bad' })).toContain('dependencies must be array');
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
