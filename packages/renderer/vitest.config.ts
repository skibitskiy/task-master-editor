import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.{ts,tsx,js}'],
    pool: 'threads',
    minWorkers: 1,
    maxWorkers: 2,
    isolate: true,
    passWithNoTests: false,
  },
});

