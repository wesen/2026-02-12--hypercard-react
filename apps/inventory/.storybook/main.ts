import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../../todo/src/**/*.stories.@(ts|tsx)',
    '../../book-tracker-debug/src/**/*.stories.@(ts|tsx)',
    '../../crm/src/**/*.stories.@(ts|tsx)',
    '../../../packages/engine/src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@hypercard/engine': resolve(__dirname, '../../../packages/engine/src'),
    };
    return config;
  },
};
export default config;
