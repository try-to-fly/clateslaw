import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
  })],
  root: path.resolve(__dirname, 'src/web'),
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, 'dist/web'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/web'),
    },
  },
  server: {
    port: 3000,
  },
});
