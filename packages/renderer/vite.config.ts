import { defineConfig } from 'vite';

export default defineConfig({
  // Ensure assets are referenced relatively in production so file:// loads work
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
