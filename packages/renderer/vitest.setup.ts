import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock CSS imports from Gravity UI
vi.mock('@gravity-ui/uikit/styles/fonts.css', () => ({}));
vi.mock('@gravity-ui/uikit/styles/styles.css', () => ({}));

// Mock problematic Gravity UI components that import CSS
vi.mock('@gravity-ui/uikit', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'theme-provider' }, children),
  Toaster: vi.fn(() => ({ add: vi.fn() })),
  ToasterComponent: () => React.createElement('div', { 'data-testid': 'toaster-component' }),
  ToasterProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'toaster-provider' }, children),
  Flex: ({ children, ...props }: { children: React.ReactNode }) => React.createElement('div', { ...props, 'data-testid': 'flex' }, children),
  Card: ({ children, ...props }: { children: React.ReactNode }) => React.createElement('div', { ...props, 'data-testid': 'card' }, children),
  Button: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => 
    React.createElement('button', { ...props, onClick, disabled, 'data-testid': 'button' }, children),
  Text: ({ children, ...props }: { children: React.ReactNode }) => React.createElement('span', { ...props, 'data-testid': 'text' }, children),
  Icon: ({ data: _data, size: _size, ...props }: { data?: React.ComponentType; size?: number }) => React.createElement('span', { ...props, 'data-testid': 'icon' }, '🔍'),
  Loader: ({ size: _size, ...props }: { size?: string }) => React.createElement('div', { ...props, 'data-testid': 'loader' }, 'Loading...'),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
