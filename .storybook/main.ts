import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    {
      directory: '../apps/inventory/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../apps/todo/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../apps/crm/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../apps/book-tracker-debug/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../packages/engine/src',
      files: '**/*.stories.@(ts|tsx)',
    },
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-onboarding',
    '@storybook/addon-vitest',
  ],
  framework: '@storybook/react-vite',
  viteFinal: async (config_) => {
    config_.resolve = config_.resolve || {};
    config_.resolve.alias = {
      ...config_.resolve.alias,
      '@hypercard/engine': resolve(__dirname, '../packages/engine/src'),
      '@hypercard/confirm-runtime': resolve(__dirname, '../packages/confirm-runtime/src'),
    };
    return config_;
  },
};

export default config;
