import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [react()],
    // Ensure assets are referenced relatively in production so file:// loads work
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@app/shared': path.resolve(__dirname, '../shared/src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      minify: !isDev,
    },
    define: {
      // Force React development mode
      __DEV__: isDev,
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      // Override React's production detection
      'process.env.REACT_APP_NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    },
    optimizeDeps: {
      // Force Vite to optimize React in development mode
      include: ['react', 'react-dom'],
      // Force re-bundling in development
      force: isDev,
    },
    esbuild: {
      // Ensure esbuild doesn't minify in development
      // Define for esbuild
      define: {
        'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
      },
    },
  };
});
