import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '@gravity-ui/uikit';
import { FileSelectionScreen } from '../FileSelectionScreen';

// Mock the IPC and notification modules
vi.mock('../../utils/ipcErrorMapper', () => ({
  withIPCErrorHandling: vi.fn((fn) => fn()),
}));

vi.mock('../../utils/notify', () => ({
  notifyError: vi.fn(),
}));

// Import the mocked module to access the mock functions
import * as notifyModule from '../../utils/notify';

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

const renderComponent = (props: Partial<React.ComponentProps<typeof FileSelectionScreen>> = {}) => {
  const defaultProps = {
    onFileSelected: vi.fn(),
    ...props,
  };

  return render(
    <ThemeProvider theme="light">
      <FileSelectionScreen {...defaultProps} />
    </ThemeProvider>,
  );
};

describe('FileSelectionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file selection screen with correct elements', () => {
    renderComponent();

    expect(screen.getByText('Выберите файл задач')).toBeInTheDocument();
    expect(
      screen.getByText(/Для начала работы выберите существующий файл tasks.json/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Выбрать файл/ })).toBeInTheDocument();
    expect(screen.getByText(/Поддерживаются файлы tasks.json/)).toBeInTheDocument();
  });

  it('handles file selection successfully', async () => {
    const onFileSelected = vi.fn();
    const selectedPath = '/path/to/tasks.json';

    mockWorkspaceSelect.mockResolvedValue({
      paths: [selectedPath],
    });

    renderComponent({ onFileSelected });

    const selectButton = screen.getByRole('button', { name: /Выбрать файл/ });
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

    const selectButton = screen.getByRole('button', { name: /Выбрать файл/ });
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

    const selectButton = screen.getByRole('button', { name: /Выбрать файл/ });
    fireEvent.click(selectButton);

    // Should show loading state
    expect(screen.getByText('Выбор файла...')).toBeInTheDocument();
    expect(selectButton).toBeDisabled();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Выбрать файл')).toBeInTheDocument();
      expect(selectButton).not.toBeDisabled();
    });
  });

  it('handles API errors gracefully', async () => {
    mockWorkspaceSelect.mockRejectedValue(new Error('API Error'));

    renderComponent();

    const selectButton = screen.getByRole('button', { name: /Выбрать файл/ });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(notifyModule.notifyError).toHaveBeenCalledWith(
        'Ошибка выбора файла',
        'Не удалось открыть диалог выбора файла',
      );
    });
  });
});
