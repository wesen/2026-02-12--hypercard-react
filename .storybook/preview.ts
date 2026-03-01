import type { Preview } from '@storybook/react';
import React from 'react';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { HyperCardTheme } from '@hypercard/engine';
import '@hypercard/engine/theme';
import '@hypercard/chat-runtime/theme';

initialize();

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [(Story) => React.createElement(HyperCardTheme, null, React.createElement(Story))],
  parameters: {
    docs: {
      codePanel: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Apps',
          ['Inventory', 'Todo', 'Crm', 'AppsBrowser', 'BookTrackerDebug'],
          'Engine',
          ['Shell', 'Widgets', 'PluginRuntime'],
        ],
      },
    },
    layout: 'centered',
  },
};

export default preview;
