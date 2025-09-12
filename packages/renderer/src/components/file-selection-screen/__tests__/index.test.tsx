import { ThemeProvider } from '@gravity-ui/uikit';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import settingsReducer from '../../../redux/settingsSlice';
import { FileSelectionScreen } from '../../file-selection-screen';

// Mock the IPC and notification modules
vi.mock('../../../utils/ipcErrorMapper', () => ({
  withIPCErrorHandling: vi.fn((fn) => fn()),
}));

vi.mock('../../../utils/notify', () => ({
  notifyError: vi.fn(),
}));

// Import the mocked module to access the mock functions
import * as notifyModule from '../../../utils/notify';

// Mock the window.api
const mockWorkspaceSelect = vi.fn();
Object.defineProperty(window, 'api', {
  value: {
    workspace: {
      select: mockWorkspaceSelect,
    },
  },
  writable: true,
});

const renderComponent = (
  props: Partial<React.ComponentProps<typeof FileSelectionScreen>> = {},
  recentPaths: string[] = [],
) => {
  const defaultProps = {
    onFileSelected: vi.fn(),
    ...props,
  };

  const store = configureStore({
    reducer: {
      settings: settingsReducer,
    },
    preloadedState: {
      settings: {
        data: {
          recentPaths,
          preferences: {},
        },
        loaded: true,
      },
    },
  });

  return render(
    <Provider store={store}>
      <ThemeProvider theme="light">
        <FileSelectionScreen {...defaultProps} />
      </ThemeProvider>
    </Provider>,
  );
};

describe('FileSelectionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file selection screen with correct elements', () => {
    renderComponent();

    expect(screen.getByText('Выберите файл задач')).toBeInTheDocument();
    expect(screen.getByText(/Для начала работы выберите существующий файл tasks.json/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Выбрать другой файл/ })).toBeInTheDocument();
    expect(screen.getByText(/Поддерживаются файлы tasks.json/)).toBeInTheDocument();
  });

  it('handles file selection successfully', async () => {
    const onFileSelected = vi.fn();
    const selectedPath = '/path/to/tasks.json';

    mockWorkspaceSelect.mockResolvedValue({
      paths: [selectedPath],
    });

    renderComponent({ onFileSelected });

    const selectButton = screen.getByRole('button', { name: /Выбрать другой файл/ });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(mockWorkspaceSelect).toHaveBeenCalledWith({
        type: 'file',
        multiple: false,
      });
      expect(onFileSelected).toHaveBeenCalledWith(selectedPath);
    });
  });

  it('handles file selection cancellation', async () => {
    const onFileSelected = vi.fn();

    // Simulate user cancellation (empty paths array)
    mockWorkspaceSelect.mockResolvedValue({
      paths: [],
    });

    renderComponent({ onFileSelected });

    const selectButton = screen.getByRole('button', { name: /Выбрать другой файл/ });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(mockWorkspaceSelect).toHaveBeenCalledWith({
        type: 'file',
        multiple: false,
      });
      expect(onFileSelected).not.toHaveBeenCalled();
    });
  });

  it('shows loading state during file selection', async () => {
    mockWorkspaceSelect.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ paths: [] }), 100)),
    );

    renderComponent();

    const selectButton = screen.getByRole('button', { name: /Выбрать другой файл/ });
    fireEvent.click(selectButton);

    // Should show loading state
    expect(screen.getByText('Выбор файла...')).toBeInTheDocument();
    expect(selectButton).toBeDisabled();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Выбрать другой файл')).toBeInTheDocument();
      expect(selectButton).not.toBeDisabled();
    });
  });

  it('handles API errors gracefully', async () => {
    mockWorkspaceSelect.mockRejectedValue(new Error('API Error'));

    renderComponent();

    const selectButton = screen.getByRole('button', { name: /Выбрать другой файл/ });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(notifyModule.notifyError).toHaveBeenCalledWith(
        'Ошибка выбора файла',
        'Не удалось открыть диалог выбора файла',
      );
    });
  });

  describe('Recent Projects', () => {
    it('does not show recent projects section when no recent paths exist', () => {
      renderComponent({}, []);

      expect(screen.queryByText('Недавние проекты')).not.toBeInTheDocument();
    });

    it('shows recent projects section when recent paths exist', () => {
      const recentPaths = ['/path/to/project1/tasks.json', '/path/to/project2/tasks.json'];
      renderComponent({}, recentPaths);

      expect(screen.getByText('Недавние проекты')).toBeInTheDocument();
      expect(screen.getByText('project1')).toBeInTheDocument();
      expect(screen.getByText('project2')).toBeInTheDocument();
    });

    it('limits recent projects display to 5 items', () => {
      const recentPaths = [
        '/path/to/project1/tasks.json',
        '/path/to/project2/tasks.json',
        '/path/to/project3/tasks.json',
        '/path/to/project4/tasks.json',
        '/path/to/project5/tasks.json',
        '/path/to/project6/tasks.json',
        '/path/to/project7/tasks.json',
      ];
      renderComponent({}, recentPaths);

      expect(screen.getByText('project1')).toBeInTheDocument();
      expect(screen.getByText('project2')).toBeInTheDocument();
      expect(screen.getByText('project3')).toBeInTheDocument();
      expect(screen.getByText('project4')).toBeInTheDocument();
      expect(screen.getByText('project5')).toBeInTheDocument();
      expect(screen.queryByText('project6')).not.toBeInTheDocument();
      expect(screen.queryByText('project7')).not.toBeInTheDocument();
    });

    it('handles recent project selection', () => {
      const onFileSelected = vi.fn();
      const recentPaths = ['/path/to/project1/tasks.json'];
      renderComponent({ onFileSelected }, recentPaths);

      const projectItem = screen.getByText('project1');
      fireEvent.click(projectItem);

      expect(onFileSelected).toHaveBeenCalledWith('/path/to/project1/tasks.json');
    });

    it('extracts project name correctly from file path', () => {
      const recentPaths = [
        '/Users/john/projects/my-project/tasks.json',
        '/home/dev/work/another-project/tasks.json',
        'C:\\Projects\\windows-project\\tasks.json',
      ];
      renderComponent({}, recentPaths);

      expect(screen.getByText('my-project')).toBeInTheDocument();
      expect(screen.getByText('another-project')).toBeInTheDocument();
      expect(screen.getByText('windows-project')).toBeInTheDocument();
    });

    it('shows full path in project item', () => {
      const recentPaths = ['/path/to/project1/tasks.json'];
      renderComponent({}, recentPaths);

      expect(screen.getByText('/path/to/project1/tasks.json')).toBeInTheDocument();
    });
  });
});
