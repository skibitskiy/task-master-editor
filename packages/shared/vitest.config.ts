import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    minWorkers: 1,
    maxWorkers: 1,
    isolate: true,
    include: ['tests/**/*.{ts,js}'],
  },
});

