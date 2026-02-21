import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';

export interface HypercardViteConfigOptions {
  inventoryChatProxy?: boolean;
  inventoryChatBackendEnvVar?: string;
  inventoryChatBackendDefault?: string;
}

function createInventoryProxy(target: string): Record<string, ProxyOptions> {
  return {
    '/chat': {
      target,
      changeOrigin: true,
    },
    '/ws': {
      target,
      ws: true,
      changeOrigin: true,
    },
    '/api': {
      target,
      changeOrigin: true,
    },
  };
}

export function createHypercardViteConfig(options: HypercardViteConfigOptions = {}) {
  const config = {
    plugins: [react()],
    resolve: {
      alias: {
        '@hypercard/engine': path.resolve(__dirname, '../../packages/engine/src'),
      },
    },
  } as {
    plugins: ReturnType<typeof react>[];
    resolve: {
      alias: Record<string, string>;
    };
    server?: {
      proxy: Record<string, ProxyOptions>;
    };
  };

  if (options.inventoryChatProxy) {
    const backendEnvVar = options.inventoryChatBackendEnvVar ?? 'INVENTORY_CHAT_BACKEND';
    const backendDefault = options.inventoryChatBackendDefault ?? 'http://127.0.0.1:8091';
    const target = process.env[backendEnvVar] ?? backendDefault;
    config.server = {
      proxy: createInventoryProxy(target),
    };
  }

  return defineConfig(config);
}
