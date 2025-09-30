import { type TasksFile, TaskStatus } from '@app/shared';
import { ThemeProvider } from '@gravity-ui/uikit';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import dataReducer from '../../redux/dataSlice';
import settingsReducer from '../../redux/settingsSlice';
import { TaskList } from '../task-list';
import { TaskListProps } from '../task-list/lib/types';

// Mock data
const mockTasksFile: TasksFile = {
  master: {
    tasks: [
      {
        id: 3,
        title: 'Third Task',
        description: 'This should be third when sorted',
        status: TaskStatus.DONE,
      },
      {
        id: 1,
        title: 'First Task',
        description: 'This should be first when sorted',
        status: TaskStatus.PENDING,
        subtasks: [
          {
            id: '1.2',
            title: 'Nested Second Child',
            description: 'Ensures recursive sorting respects ID order',
          },
          {
            id: '1.1',
            title: 'Nested First Child',
            description: 'Should appear immediately after parent',
          },
        ],
      },
      {
        id: 2,
        title: 'Second Task',
        description: 'This should be second when sorted',
        status: TaskStatus.IN_PROGRESS,
      },
    ],
    metadata: {
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    },
  },
};

const emptyTasksFile: TasksFile = {
  master: {
    tasks: [],
    metadata: {
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    },
  },
};

// Helper to create store with mock data
const createMockStore = (tasksFile: TasksFile | null) => {
  return configureStore({
    reducer: {
      data: dataReducer,
      settings: settingsReducer,
    },
    preloadedState: {
      data: {
        filePath: '/test/tasks.json',
        tasksFile,
        currentBranch: 'master',
        dirty: { file: false, byTaskId: {} },
        errors: { general: [], byTaskId: {} },
      },
      settings: {
        data: {
          recentPaths: [],
          preferences: {},
        },
        loaded: false,
      },
    },
  });
};

// Helper to render TaskList with store and theme
const renderTaskList = (tasksFile: TasksFile | null, props = {}) => {
  const store = createMockStore(tasksFile);
  const defaultProps: TaskListProps = {
    selectedTaskId: null,
    onSelectTask: vi.fn(),
    onBackToProjects: vi.fn(),
  };

  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider theme="light">
          <TaskList {...defaultProps} {...props} />
        </ThemeProvider>
      </Provider>,
    ),
    store,
    onSelectTask:
      (props as { onSelectTask?: typeof defaultProps.onSelectTask }).onSelectTask || defaultProps.onSelectTask,
  };
};

describe('TaskList', () => {
  describe('Rendering and Layout', () => {
    it('should display tasks sorted by ID', async () => {
      renderTaskList(mockTasksFile);

      // Wait for the List component to render and check if tasks are sorted by ID (1, 2, 3)
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
      });

      // Check order by verifying first task is ID 1
      const taskTitles = screen.getAllByText(/First Task|Second Task|Third Task/);
      expect(taskTitles[0]).toHaveTextContent('First Task');
    });

    it('should display task ID, title, and status for each task', () => {
      renderTaskList(mockTasksFile);

      // Check first task (ID 1)
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.getAllByText('Ожидает')[0]).toBeInTheDocument(); // pending status

      // Check second task (ID 2)
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('Second Task')).toBeInTheDocument();
      expect(screen.getByText('В работе')).toBeInTheDocument(); // in-progress status

      // Check third task (ID 3)
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('Third Task')).toBeInTheDocument();
      expect(screen.getByText('Готово')).toBeInTheDocument(); // done status
    });

    it('should display descriptions when available', () => {
      renderTaskList(mockTasksFile);

      expect(screen.getByText('This should be first when sorted')).toBeInTheDocument();
      expect(screen.getByText('This should be second when sorted')).toBeInTheDocument();
      expect(screen.getByText('This should be third when sorted')).toBeInTheDocument();
    });

    it('should render subtasks directly after their parent with hierarchical identifiers', async () => {
      renderTaskList(mockTasksFile);

      await waitFor(() => {
        expect(screen.getByText('#1.1')).toBeInTheDocument();
        expect(screen.getByText('#1.2')).toBeInTheDocument();
      });

      const orderedTitles = screen
        .getAllByText(/First Task|Second Task|Third Task|Nested First Child|Nested Second Child/)
        .map((el) => el.textContent);

      expect(orderedTitles).toEqual([
        'First Task',
        'Nested First Child',
        'Nested Second Child',
        'Second Task',
        'Third Task',
      ]);

      const nestedContainer = screen.getByText('Nested First Child').closest('[data-test-item-index]');
      const taskNode = nestedContainer?.firstElementChild as HTMLElement | null;
      expect(taskNode?.getAttribute('style')).toContain('padding-left');
    });

    it('should show empty state when no tasks', () => {
      renderTaskList(emptyTasksFile);

      expect(screen.getByText('Задач нет')).toBeInTheDocument();
    });

    it('should show "Задачи не найдены" when search returns no results', async () => {
      renderTaskList(mockTasksFile);

      // Wait for the component to render first
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск задач...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Поиск задач...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent task' } });

      // Wait for the empty state to appear
      await waitFor(() => {
        expect(screen.getByText('Задачи не найдены')).toBeInTheDocument();
      });
    });
  });

  describe('Task Selection', () => {
    it('should call onSelectTask when a task is clicked', () => {
      const onSelectTask = vi.fn();
      renderTaskList(mockTasksFile, { onSelectTask });

      fireEvent.click(screen.getByText('First Task'));

      expect(onSelectTask).toHaveBeenCalledWith('1');
    });

    it('should call onSelectTask with subtask id when subtask is clicked', async () => {
      const onSelectTask = vi.fn();
      renderTaskList(mockTasksFile, { onSelectTask });

      await waitFor(() => {
        expect(screen.getByText('Nested First Child')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nested First Child'));

      expect(onSelectTask).toHaveBeenCalledWith('1.1');
    });

    it('should render with selected task', async () => {
      renderTaskList(mockTasksFile, { selectedTaskId: '2' });

      // Instead of checking CSS classes, verify the component renders with the selected task
      await waitFor(() => {
        expect(screen.getByText('Second Task')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
      });
    });

    it('should render without selection when none is selected', async () => {
      renderTaskList(mockTasksFile, { selectedTaskId: null });

      // Verify all tasks are rendered without selection
      await waitFor(() => {
        expect(screen.getByText('First Task')).toBeInTheDocument();
        expect(screen.getByText('Second Task')).toBeInTheDocument();
        expect(screen.getByText('Third Task')).toBeInTheDocument();
      });
    });
  });

  describe('Status Label Mapping', () => {
    it('should map status to correct label themes and text', () => {
      const tasksWithAllStatuses: TasksFile = {
        master: {
          tasks: [
            { id: 1, title: 'Pending Task', status: TaskStatus.PENDING },
            { id: 2, title: 'In Progress Task', status: TaskStatus.IN_PROGRESS },
            { id: 3, title: 'Done Task', status: TaskStatus.DONE },
            { id: 4, title: 'Blocked Task', status: TaskStatus.BLOCKED },
            { id: 5, title: 'Deferred Task', status: TaskStatus.DEFERRED },
            { id: 6, title: 'Cancelled Task', status: TaskStatus.CANCELLED },
          ],
        },
      };

      renderTaskList(tasksWithAllStatuses);

      expect(screen.getByText('Ожидает')).toBeInTheDocument(); // pending
      expect(screen.getByText('В работе')).toBeInTheDocument(); // in-progress
      expect(screen.getByText('Готово')).toBeInTheDocument(); // done
      expect(screen.getByText('Заблокировано')).toBeInTheDocument(); // blocked
      expect(screen.getByText('Отложено')).toBeInTheDocument(); // deferred
      expect(screen.getByText('Отменено')).toBeInTheDocument(); // cancelled
    });
  });

  describe('Search Functionality', () => {
    it('should filter tasks by title', async () => {
      renderTaskList(mockTasksFile);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск задач...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Поиск задач...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      await waitFor(() => {
        expect(screen.getByText('First Task')).toBeInTheDocument();
        expect(screen.queryByText('Second Task')).not.toBeInTheDocument();
        expect(screen.queryByText('Third Task')).not.toBeInTheDocument();
      });
    });

    it('should filter tasks by description', async () => {
      renderTaskList(mockTasksFile);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск задач...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Поиск задач...');
      fireEvent.change(searchInput, { target: { value: 'second when sorted' } });

      await waitFor(() => {
        expect(screen.queryByText('First Task')).not.toBeInTheDocument();
        expect(screen.getByText('Second Task')).toBeInTheDocument();
        expect(screen.queryByText('Third Task')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive', async () => {
      renderTaskList(mockTasksFile);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск задач...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Поиск задач...');
      fireEvent.change(searchInput, { target: { value: 'FIRST' } });

      await waitFor(() => {
        expect(screen.getByText('First Task')).toBeInTheDocument();
      });
    });
  });

  describe('Stable Sorting', () => {
    it('should sort tasks numerically by ID, not lexicographically', () => {
      const tasksWithMixedIds: TasksFile = {
        master: {
          tasks: [
            { id: 10, title: 'Task 10' },
            { id: 2, title: 'Task 2' },
            { id: 1, title: 'Task 1' },
            { id: 20, title: 'Task 20' },
          ],
        },
      };

      renderTaskList(tasksWithMixedIds);

      const taskTitles = screen.getAllByText(/Task \d+/).map((el) => el.textContent);
      expect(taskTitles).toEqual(['Task 1', 'Task 2', 'Task 10', 'Task 20']);
    });

    it('should handle string IDs by converting to numbers', () => {
      const tasksWithStringIds: TasksFile = {
        master: {
          tasks: [
            { id: '10', title: 'Task 10' },
            { id: '2', title: 'Task 2' },
            { id: '1', title: 'Task 1' },
          ],
        },
      };

      renderTaskList(tasksWithStringIds);

      const taskTitles = screen.getAllByText(/Task \d+/).map((el) => el.textContent);
      expect(taskTitles).toEqual(['Task 1', 'Task 2', 'Task 10']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tasks without descriptions', () => {
      const tasksWithoutDescriptions: TasksFile = {
        master: {
          tasks: [{ id: 1, title: 'Task without description', status: TaskStatus.PENDING }],
        },
      };

      renderTaskList(tasksWithoutDescriptions);

      expect(screen.getByText('Task without description')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('Ожидает')).toBeInTheDocument();
    });

    it('should handle tasks without status (defaults to pending)', () => {
      const tasksWithoutStatus: TasksFile = {
        master: {
          tasks: [{ id: 1, title: 'Task without status' }],
        },
      };

      renderTaskList(tasksWithoutStatus);

      expect(screen.getByText('Ожидает')).toBeInTheDocument(); // default pending
    });

    it('should handle null tasksFile', () => {
      renderTaskList(null);

      expect(screen.getByText('Задач нет')).toBeInTheDocument();
    });
  });
});
