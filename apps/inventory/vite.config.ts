import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@hypercard/engine': path.resolve(__dirname, '../../packages/engine/src'),
    },
  },
  server: {
    proxy: {
      '/chat': {
        target: process.env.INVENTORY_CHAT_BACKEND ?? 'http://127.0.0.1:8091',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.INVENTORY_CHAT_BACKEND ?? 'http://127.0.0.1:8091',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: process.env.INVENTORY_CHAT_BACKEND ?? 'http://127.0.0.1:8091',
        changeOrigin: true,
      },
    },
  },
});
