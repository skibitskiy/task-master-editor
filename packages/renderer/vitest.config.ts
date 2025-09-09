import { defineConfig } from 'vitest/config';
import path from 'path';

// Plugin to handle CSS imports in tests
function cssPlugin() {
  return {
    name: 'css-mock',
    load(id) {
      if (id.endsWith('.css')) {
        return 'export default {};';
      }
    },
  };
}

export default defineConfig({
  plugins: [cssPlugin()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.{ts,tsx,js}', 'src/**/__tests__/*.{ts,tsx,js}'],
    setupFiles: './vitest.setup.ts',
    globals: true,
  },
  resolve: {
    alias: {
      '@app/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  define: {
    global: 'globalThis',
  },
});
