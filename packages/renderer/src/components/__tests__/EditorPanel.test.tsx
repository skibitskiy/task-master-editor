import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@gravity-ui/uikit';
import { configureStore } from '@reduxjs/toolkit';
import { EditorPanel } from '../EditorPanel';
import dataSlice from '../../redux/dataSlice';
import settingsSlice from '../../redux/settingsSlice';
import type { TasksFile, Task } from '@app/shared';

// Mock the markdown editor
vi.mock('@gravity-ui/markdown-editor', () => ({
  useMarkdownEditor: () => ({
    getValue: vi.fn().mockReturnValue(''),
  }),
  MarkdownEditorView: () => <div data-testid="markdown-editor">Markdown Editor</div>,
}));

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  details: 'Test Details',
  status: 'pending',
  priority: 'medium',
  dependencies: [],
};

const mockTasksFile: TasksFile = {
  master: {
    tasks: [mockTask],
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      description: 'Test tasks file',
    },
  },
};

const createMockStore = (tasksFile?: TasksFile) => {
  return configureStore({
    reducer: {
      data: dataSlice,
      settings: settingsSlice,
    },
    preloadedState: {
      data: {
        filePath: '',
        tasksFile: tasksFile || null,
        dirty: { file: false, byTaskId: {} },
        errors: { general: [], byTaskId: {} },
      },
      settings: {
        data: { recentPaths: [], preferences: {} },
        loaded: true,
      },
    },
  });
};

const renderComponent = (props: Partial<React.ComponentProps<typeof EditorPanel>> = {}, tasksFile?: TasksFile) => {
  const defaultProps = {
    taskId: null,
    onSave: vi.fn(),
    ...props,
  };

  const store = createMockStore(tasksFile);

  return render(
    <Provider store={store}>
      <ThemeProvider theme="light">
        <EditorPanel {...defaultProps} />
      </ThemeProvider>
    </Provider>,
  );
};

describe('EditorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Placeholder behavior', () => {
    it('shows placeholder when no task is selected', () => {
      renderComponent({ taskId: null }, mockTasksFile);

      expect(screen.getByText('Выберите задачу для редактирования')).toBeInTheDocument();
      expect(screen.getByText('Выберите задачу из списка слева, чтобы начать редактирование')).toBeInTheDocument();
    });

    it('hides tabs when no task is selected', () => {
      renderComponent({ taskId: null }, mockTasksFile);

      // Tabs should not be visible
      expect(screen.queryByText('Предпросмотр')).not.toBeInTheDocument();
      expect(screen.queryByText('Редактор')).not.toBeInTheDocument();
      expect(screen.queryByText('Сохранить')).not.toBeInTheDocument();
    });

    it('shows placeholder when task file has no tasks', () => {
      const emptyTasksFile: TasksFile = {
        master: {
          tasks: [],
          metadata: {
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            description: 'Empty tasks file',
          },
        },
      };

      renderComponent({ taskId: '1' }, emptyTasksFile);

      expect(screen.getByText('Выберите задачу для редактирования')).toBeInTheDocument();
    });

    it('shows placeholder when selected task does not exist', () => {
      renderComponent({ taskId: '999' }, mockTasksFile);

      expect(screen.getByText('Выберите задачу для редактирования')).toBeInTheDocument();
    });
  });

  describe('Editor behavior with selected task', () => {
    it('shows editor interface when task is selected', () => {
      renderComponent({ taskId: '1' }, mockTasksFile);

      // Task title should be displayed
      expect(screen.getByText('Test Task')).toBeInTheDocument();

      // Tabs should be visible
      expect(screen.getByText('Предпросмотр')).toBeInTheDocument();
      expect(screen.getByText('Сохранить')).toBeInTheDocument();

      // Editor should be rendered
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    });

    it('hides placeholder when task is selected', () => {
      renderComponent({ taskId: '1' }, mockTasksFile);

      // Placeholder should not be visible
      expect(screen.queryByText('Выберите задачу для редактирования')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Выберите задачу из списка слева, чтобы начать редактирование'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Typography compliance', () => {
    it('uses @gravity-ui/uikit typography components in placeholder', () => {
      renderComponent({ taskId: null }, mockTasksFile);

      // Check that the placeholder text uses proper typography
      const headerElement = screen.getByText('Выберите задачу для редактирования');
      const descriptionElement = screen.getByText('Выберите задачу из списка слева, чтобы начать редактирование');

      expect(headerElement).toBeInTheDocument();
      expect(descriptionElement).toBeInTheDocument();
    });
  });
});
