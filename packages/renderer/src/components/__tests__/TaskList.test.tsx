import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TaskList } from '../TaskList';
import dataReducer from '../../redux/dataSlice';
import settingsReducer from '../../redux/settingsSlice';
import type { TasksFile } from '@app/shared';

// Mock data
const mockTasksFile: TasksFile = {
  master: {
    tasks: [
      {
        id: 3,
        title: 'Third Task',
        description: 'This should be third when sorted',
        status: 'done',
      },
      {
        id: 1,
        title: 'First Task',
        description: 'This should be first when sorted',
        status: 'pending',
      },
      {
        id: 2,
        title: 'Second Task',
        description: 'This should be second when sorted',
        status: 'in-progress',
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

// Helper to render TaskList with store
const renderTaskList = (tasksFile: TasksFile | null, props = {}) => {
  const store = createMockStore(tasksFile);
  const defaultProps = {
    selectedTaskId: null,
    onSelectTask: vi.fn(),
  };

  return {
    ...render(
      <Provider store={store}>
        <TaskList {...defaultProps} {...props} />
      </Provider>,
    ),
    store,
    onSelectTask:
      (props as { onSelectTask?: typeof defaultProps.onSelectTask }).onSelectTask || defaultProps.onSelectTask,
  };
};

describe('TaskList', () => {
  describe('Rendering and Layout', () => {
    it('should display tasks sorted by ID', () => {
      const { container } = renderTaskList(mockTasksFile);

      const taskItems = container.querySelectorAll('.task-item');
      expect(taskItems).toHaveLength(3);

      // Check if tasks are sorted by ID (1, 2, 3)
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();

      // Check order by verifying first task is ID 1
      const firstTask = screen.getAllByText(/First Task|Second Task|Third Task/)[0];
      expect(firstTask).toHaveTextContent('First Task');
    });

    it('should display task ID, title, and status for each task', () => {
      renderTaskList(mockTasksFile);

      // Check first task (ID 1)
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.getByText('Ожидает')).toBeInTheDocument(); // pending status

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

    it('should show empty state when no tasks', () => {
      renderTaskList(emptyTasksFile);

      expect(screen.getByText('Задач нет')).toBeInTheDocument();
    });

    it('should show "Задачи не найдены" when search returns no results', () => {
      renderTaskList(mockTasksFile);

      const searchInput = screen.getByPlaceholderText('Поиск задач...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent task' } });

      expect(screen.getByText('Задачи не найдены')).toBeInTheDocument();
    });
  });

  describe('Task Selection', () => {
    it('should call onSelectTask when a task is clicked', () => {
      const onSelectTask = vi.fn();
      renderTaskList(mockTasksFile, { onSelectTask });

      fireEvent.click(screen.getByText('First Task'));

      expect(onSelectTask).toHaveBeenCalledWith('1');
    });

    it('should highlight selected task', () => {
      const { container } = renderTaskList(mockTasksFile, { selectedTaskId: '2' });

      const selectedTask = container.querySelector('.task-item.selected');
      expect(selectedTask).toBeInTheDocument();
      expect(selectedTask).toHaveTextContent('Second Task');
    });

    it('should not highlight any task when none is selected', () => {
      const { container } = renderTaskList(mockTasksFile, { selectedTaskId: null });

      const selectedTasks = container.querySelectorAll('.task-item.selected');
      expect(selectedTasks).toHaveLength(0);
    });
  });

  describe('Status Label Mapping', () => {
    it('should map status to correct label themes and text', () => {
      const tasksWithAllStatuses: TasksFile = {
        master: {
          tasks: [
            { id: 1, title: 'Pending Task', status: 'pending' },
            { id: 2, title: 'In Progress Task', status: 'in-progress' },
            { id: 3, title: 'Done Task', status: 'done' },
            { id: 4, title: 'Blocked Task', status: 'blocked' },
            { id: 5, title: 'Deferred Task', status: 'deferred' },
            { id: 6, title: 'Cancelled Task', status: 'cancelled' },
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
    it('should filter tasks by title', () => {
      renderTaskList(mockTasksFile);

      const searchInput = screen.getByPlaceholderText('Поиск задач...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.queryByText('Second Task')).not.toBeInTheDocument();
      expect(screen.queryByText('Third Task')).not.toBeInTheDocument();
    });

    it('should filter tasks by description', () => {
      renderTaskList(mockTasksFile);

      const searchInput = screen.getByPlaceholderText('Поиск задач...');
      fireEvent.change(searchInput, { target: { value: 'second when sorted' } });

      expect(screen.queryByText('First Task')).not.toBeInTheDocument();
      expect(screen.getByText('Second Task')).toBeInTheDocument();
      expect(screen.queryByText('Third Task')).not.toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      renderTaskList(mockTasksFile);

      const searchInput = screen.getByPlaceholderText('Поиск задач...');
      fireEvent.change(searchInput, { target: { value: 'FIRST' } });

      expect(screen.getByText('First Task')).toBeInTheDocument();
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
          tasks: [{ id: 1, title: 'Task without description', status: 'pending' }],
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
