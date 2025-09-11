import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@gravity-ui/uikit';
import { EditorPanel } from '../../editor-panel/ui';
import dataReducer, { saveFile } from '../../../redux/dataSlice';
import settingsReducer from '../../../redux/settingsSlice';
import { taskSliceReducer } from '../../../redux/task';
import { EditorProvider } from '../../../shared/editor-context';
import type { TasksFile } from '@app/shared';
import * as notifyModule from '../../../utils/notify';
import '@testing-library/jest-dom';

// Mock the markdown editor
vi.mock('@gravity-ui/markdown-editor', () => ({
  useMarkdownEditor: () => ({
    getValue: () => 'test content',
    replace: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    setEditorMode: vi.fn(),
  }),
  MarkdownEditorView: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="markdown-editor">{children}</div>
  ),
}));

// Mock the notify module
vi.mock('../../../utils/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

// Mock the debounce hook
vi.mock('../../../shared/hooks', () => ({
  useDebounce: vi.fn((callback) => {
    // Execute callback immediately for tests
    callback();
  }),
}));

// Mock the useMarkdownFieldEditor hook
vi.mock('../lib/use-markdown-field-editor', () => ({
  useMarkdownFieldEditor: () => ({
    getValue: () => 'test content',
    replace: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    setEditorMode: vi.fn(),
  }),
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

const createMockStore = (tasksFile: TasksFile | null, selectedTaskId: string | null = null) => {
  const store = configureStore({
    reducer: {
      data: dataReducer,
      settings: settingsReducer,
      task: taskSliceReducer,
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
      task: {
        selectedTaskId,
        activeFieldTab: 'description' as const,
      },
    },
  });

  return store;
};

const renderEditorPanel = (taskId: string | null, tasksFile: TasksFile | null = mockTasksFile) => {
  const store = createMockStore(tasksFile, taskId);
  const onSave = vi.fn();

  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider theme="light">
          <EditorProvider>
            <EditorPanel />
          </EditorProvider>
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
    it('should switch tabs when clicked', async () => {
      const { store } = renderEditorPanel('1');

      // Initially should show markdown editor (description tab)
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      // Click title tab
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));

      // Wait for Redux state to update
      await waitFor(() => {
        const state = store.getState();
        expect(state.task.activeFieldTab).toBe('title');
      });

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

  describe('Validation', () => {
    it('should show validation error when title is empty', async () => {
      renderEditorPanel('1');

      // Click title tab
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));

      // Get the title input
      const titleInput = screen.getByRole('textbox');

      // Clear the title
      fireEvent.change(titleInput, { target: { value: '' } });
      fireEvent.blur(titleInput);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Название задачи обязательно')).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid dependency format', async () => {
      renderEditorPanel('1');

      // Click dependencies tab
      fireEvent.click(screen.getByRole('tab', { name: /зависимости/i }));

      // Get the dependencies input
      const depsInput = screen.getByRole('textbox');

      // Enter invalid dependency
      fireEvent.change(depsInput, { target: { value: 'invalid, 1.2, abc' } });

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Неверный формат зависимости/)).toBeInTheDocument();
      });
    });

    it('should disable save button when there are validation errors', async () => {
      renderEditorPanel('1');

      // Click title tab
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));

      // Clear the title
      const titleInput = screen.getByRole('textbox');
      fireEvent.change(titleInput, { target: { value: '' } });
      fireEvent.blur(titleInput);

      // Save button should be disabled
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /сохранить/i });
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update input field when changing values', async () => {
      renderEditorPanel('1');

      // Click title tab
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));

      // Change the title
      const titleInput = screen.getByRole('textbox');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      // Check that the input field shows the updated value
      await waitFor(() => {
        expect(titleInput).toHaveValue('Updated Title');
      });
    });

    it('should mark task as dirty when field is modified', async () => {
      const { store } = renderEditorPanel('1');

      // Click description tab
      fireEvent.click(screen.getByRole('tab', { name: /описание/i }));

      // Store should mark task as dirty after change
      const initialState = store.getState();
      expect(initialState.data.dirty.byTaskId['1']).toBeFalsy();

      // Change description (simulated by direct store update since markdown editor is mocked)
      store.dispatch({
        type: 'data/updateTask',
        payload: { id: 1, patch: { description: 'New description' } },
      });

      // Check dirty state
      await waitFor(() => {
        const state = store.getState();
        expect(state.data.dirty.byTaskId['1']).toBe(true);
      });
    });

    it('should show dirty indicator on save button when task is dirty', async () => {
      const { store } = renderEditorPanel('1');

      // Click title tab
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));

      // Change the title directly in store to simulate dirty state
      store.dispatch({
        type: 'data/updateTask',
        payload: { id: 1, patch: { title: 'Modified Title' } },
      });

      // Should show dirty indicator on save button
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /сохранить/i });
        expect(saveButton.textContent).toContain('●');
      });
    });
  });

  describe('Save Functionality (Task 15)', () => {
    it('should show save button with dirty indicator when task is modified', async () => {
      const { store } = renderEditorPanel('1');

      // Modify the task to make it dirty
      store.dispatch({
        type: 'data/updateTask',
        payload: { id: 1, patch: { title: 'Modified Title' } },
      });

      // Should show save button with dirty indicator
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /сохранить/i });
        expect(saveButton.textContent).toContain('●');
      });
    });

    it('should call saveFile and show success notification on successful save', async () => {
      renderEditorPanel('1');

      // Mock window.api for successful save
      window.api = {
        file: {
          write: vi.fn().mockResolvedValue({ ok: true }),
          read: vi.fn(),
        },
      } as unknown as typeof window.api;

      // Clear any previous calls
      vi.clearAllMocks();

      // Click save button
      const saveButton = screen.getByRole('button', { name: /сохранить/i });
      fireEvent.click(saveButton);

      // Should show success notification after successful save
      await waitFor(
        () => {
          expect(notifyModule.notifySuccess).toHaveBeenCalledWith('Сохранено', 'Все изменения успешно сохранены');
        },
        { timeout: 3000 },
      );
    });

    it('should show error notification on failed save', async () => {
      renderEditorPanel('1');

      // Mock window.api for failed save
      window.api = {
        file: {
          write: vi.fn().mockRejectedValue(new Error('Save failed')),
          read: vi.fn(),
        },
      } as unknown as typeof window.api;

      // Clear any previous calls
      vi.clearAllMocks();

      // Click save button
      const saveButton = screen.getByRole('button', { name: /сохранить/i });
      fireEvent.click(saveButton);

      // Should show error notification
      await waitFor(
        () => {
          expect(notifyModule.notifyError).toHaveBeenCalledWith(
            'Ошибка сохранения',
            expect.stringContaining('Save failed'),
          );
        },
        { timeout: 3000 },
      );
    });

    it('should disable save button when there are validation errors', async () => {
      renderEditorPanel('1');

      // Click title tab and clear the title to trigger validation error
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));
      const titleInput = screen.getByRole('textbox');
      fireEvent.change(titleInput, { target: { value: '' } });
      fireEvent.blur(titleInput);

      // Save button should be disabled
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /сохранить/i });
        expect(saveButton).toBeDisabled();
      });
    });

    it('should not call save when validation errors exist', async () => {
      const { store } = renderEditorPanel('1');
      const mockStore = vi.spyOn(store, 'dispatch');

      // Click title tab and clear the title to trigger validation error
      fireEvent.click(screen.getByRole('tab', { name: /заголовок/i }));
      const titleInput = screen.getByRole('textbox');
      fireEvent.change(titleInput, { target: { value: '' } });
      fireEvent.blur(titleInput);

      // Try to click save button (should be disabled but let's try)
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /сохранить/i });
        expect(saveButton).toBeDisabled();

        // Even if we could click it, it shouldn't call saveFile
        fireEvent.click(saveButton);
      });

      // Should not have called saveFile
      expect(mockStore).not.toHaveBeenCalledWith(expect.any(Function));
    });

    it('should reset dirty state after successful save', async () => {
      const { store } = renderEditorPanel('1');

      // Make task dirty first
      store.dispatch({
        type: 'data/updateTask',
        payload: { id: 1, patch: { title: 'Modified Title' } },
      });

      // Check task is dirty
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /сохранить/i });
        expect(saveButton.textContent).toContain('●');
      });

      // Mock successful save by dispatching the fulfilled action directly
      store.dispatch({ type: saveFile.fulfilled.type, payload: true });

      // Check dirty state is reset
      await waitFor(() => {
        const state = store.getState();
        expect(state.data.dirty.file).toBe(false);
        expect(state.data.dirty.byTaskId['1']).toBeFalsy();
      });
    });
  });
});
