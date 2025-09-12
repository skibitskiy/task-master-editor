import path from 'path';
import { defineConfig } from 'vitest/config';

// Plugin to handle all CSS imports
function cssPlugin() {
  return {
    name: 'css-mock',
    resolveId(id: string) {
      if (id.endsWith('.css')) {
        return id;
      }
    },
    load(id: string) {
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
    setupFiles: './vitest.setup.tsx',
    globals: true,
    mockReset: false,
    restoreMocks: false,
    isolate: true,
    server: {
      deps: {
        inline: ['@gravity-ui/uikit'],
      },
    },
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
