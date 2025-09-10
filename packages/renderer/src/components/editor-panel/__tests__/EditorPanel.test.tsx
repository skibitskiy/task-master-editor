import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@gravity-ui/uikit';
import { EditorPanel } from '../ui';
import dataReducer from '../../../redux/dataSlice';
import settingsReducer from '../../../redux/settingsSlice';
import type { TasksFile } from '@app/shared';

// Mock the markdown editor
vi.mock('@gravity-ui/markdown-editor', () => ({
  useMarkdownEditor: () => ({
    getValue: () => 'test content',
  }),
  MarkdownEditorView: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="markdown-editor">{children}</div>
  ),
}));

const mockTasksFile: TasksFile = {
  master: {
    tasks: [
      {
        id: 1,
        title: 'Test Task',
        description: 'Task description',
        details: 'Task details',
        status: 'pending',
        dependencies: ['2'],
        testStrategy: 'Unit tests for this task',
      },
      {
        id: 2,
        title: 'Task Without Details',
        description: 'Only description',
        status: 'pending',
      },
    ],
    metadata: {
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    },
  },
};

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

const renderEditorPanel = (taskId: string | null, tasksFile: TasksFile | null = mockTasksFile) => {
  const store = createMockStore(tasksFile);
  const onSave = vi.fn();

  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider theme="light">
          <EditorPanel taskId={taskId} onSave={onSave} />
        </ThemeProvider>
      </Provider>,
    ),
    store,
    onSave,
  };
};

describe('EditorPanel - Task Tabs (Task 13)', () => {
  describe('Tab Display and Visibility', () => {
    it('should show tabs for all task fields', () => {
      renderEditorPanel('1');

      // Should show tabs for all supported fields
      expect(screen.getByRole('tab', { name: /заголовок/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /описание/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /детали/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /зависимости/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /стратегия тестирования/i })).toBeInTheDocument();
    });

    it('should show all tabs even for tasks without optional fields', () => {
      renderEditorPanel('2'); // Task without details, dependencies, testStrategy

      // Should show all tabs (they're always visible now)
      expect(screen.getByRole('tab', { name: /заголовок/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /описание/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /детали/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /зависимости/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /стратегия тестирования/i })).toBeInTheDocument();
    });

    it('should default to description tab', () => {
      renderEditorPanel('1');

      // Check that description tab is selected by default
      const descriptionTab = screen.getByRole('tab', { name: /описание/i });
      expect(descriptionTab).toHaveAttribute('aria-selected', 'true');

      // Check that description tab content is displayed
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should switch tabs when clicked', () => {
      renderEditorPanel('1');

      // Initially should show markdown editor (description tab)
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      // Click title tab
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));

      // Should now show text input (title tab)
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.queryByTestId('markdown-editor')).not.toBeInTheDocument();
    });

    it('should show TextInput for title and dependencies tabs', () => {
      renderEditorPanel('1');

      // Click title tab
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));

      // Should show text input instead of markdown editor
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.queryByTestId('markdown-editor')).not.toBeInTheDocument();

      // Click dependencies tab
      fireEvent.click(screen.getByRole('tab', { name: /зависимости/i }));

      // Should also show text input
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.queryByTestId('markdown-editor')).not.toBeInTheDocument();
    });

    it('should show markdown editor for description, details, and testStrategy tabs', () => {
      renderEditorPanel('1');

      // Description tab should show markdown editor (default)
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      // Switch to details tab
      fireEvent.click(screen.getByRole('tab', { name: /детали/i }));

      // Should still show markdown editor
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      // Switch to testStrategy tab
      fireEvent.click(screen.getByRole('tab', { name: /стратегия тестирования/i }));

      // Should still show markdown editor
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Editor Mode Toggle', () => {
    it('should hide preview button for title and dependencies fields', () => {
      renderEditorPanel('1');

      // Click title tab
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));

      // Preview button should not be visible for title
      expect(screen.queryByText('Предпросмотр')).not.toBeInTheDocument();
      expect(screen.queryByText('Редактор')).not.toBeInTheDocument();

      // Click dependencies tab
      fireEvent.click(screen.getByRole('tab', { name: /зависимости/i }));

      // Preview button should not be visible for dependencies
      expect(screen.queryByText('Предпросмотр')).not.toBeInTheDocument();
      expect(screen.queryByText('Редактор')).not.toBeInTheDocument();
    });

    it('should show preview button for description, details, and testStrategy fields', () => {
      renderEditorPanel('1');

      // Description tab should show preview button (default)
      expect(screen.getByText('Предпросмотр')).toBeInTheDocument();

      // Switch to details tab
      fireEvent.click(screen.getByRole('tab', { name: /детали/i }));

      // Should still show preview button
      expect(screen.getByText('Предпросмотр')).toBeInTheDocument();

      // Switch to testStrategy tab
      fireEvent.click(screen.getByRole('tab', { name: /стратегия тестирования/i }));

      // Should still show preview button
      expect(screen.getByText('Предпросмотр')).toBeInTheDocument();
    });
  });

  describe('No Task Selected', () => {
    it('should show placeholder when no task selected', () => {
      renderEditorPanel(null);

      expect(screen.getByText('Выберите задачу для редактирования')).toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });
});
