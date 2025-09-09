import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.{ts,tsx,js}', 'src/**/__tests__/*.{ts,tsx,js}'],
    pool: 'threads',
    minWorkers: 1,
    maxWorkers: 2,
    isolate: true,
    passWithNoTests: false,
    setupFiles: './vitest.setup.ts',
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@app/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});

