import { describe, expect, it } from 'vitest';

import dataReducer, { deleteTask, updateTask } from '../dataSlice';

describe('dataSlice subtasks interactions', () => {
  it('clears dirty and error state for deleted subtasks', () => {
    const baseState = dataReducer(undefined, { type: '@@INIT' });

    const stateWithSubtasks = {
      ...baseState,
      tasksFile: {
        master: {
          tasks: [
            {
              id: '1',
              title: 'Parent',
              subtasks: [
                {
                  id: '1.1',
                  title: 'Child A',
                },
                {
                  id: '1.2',
                  title: 'Child B',
                },
              ],
            },
          ],
        },
      },
      dirty: {
        file: true,
        byTaskId: {
          '1': true,
          '1/1.1': true,
          '1/1.2': true,
        },
      },
      errors: {
        general: [],
        byTaskId: {
          '1': ['err'],
          '1/1.1': ['child'],
          '1/1.2': ['child2'],
        },
      },
    };

    const nextState = dataReducer(stateWithSubtasks, deleteTask('1'));

    expect(nextState.tasksFile?.master.tasks).toHaveLength(0);
    expect(nextState.dirty.byTaskId).not.toHaveProperty('1');
    expect(nextState.dirty.byTaskId).not.toHaveProperty('1/1.1');
    expect(nextState.dirty.byTaskId).not.toHaveProperty('1/1.2');
    expect(nextState.errors.byTaskId).not.toHaveProperty('1');
    expect(nextState.errors.byTaskId).not.toHaveProperty('1/1.1');
    expect(nextState.errors.byTaskId).not.toHaveProperty('1/1.2');
    expect(nextState.dirty.file).toBe(true);
  });

  it('updates subtasks using composite path keys without touching parent tasks', () => {
    const baseState = dataReducer(undefined, { type: '@@INIT' });

    const stateWithDuplicateIds = {
      ...baseState,
      tasksFile: {
        master: {
          tasks: [
            {
              id: 1,
              title: 'Root 1',
            },
            {
              id: 2,
              title: 'Root 2',
              subtasks: [
                {
                  id: 1,
                  title: 'Nested 1',
                },
              ],
            },
          ],
        },
      },
    };

    const updatedState = dataReducer(
      stateWithDuplicateIds,
      updateTask({
        id: 1,
        path: '2/1',
        patch: { title: 'Nested 1 updated' },
      }),
    );

    const masterTasks = updatedState.tasksFile?.master.tasks ?? [];
    expect(masterTasks[0]?.title).toBe('Root 1');
    expect(masterTasks[1]?.title).toBe('Root 2');
    expect(masterTasks[1]?.subtasks?.[0]?.title).toBe('Nested 1 updated');
  });
});
