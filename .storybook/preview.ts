import type { Preview } from '@storybook/react';
import React from 'react';
import { HyperCardTheme } from '../packages/engine/src/theme/HyperCardTheme';
import '../packages/engine/src/theme/base.css';

const preview: Preview = {
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
        order: ['Apps', ['Inventory', 'Todo', 'Crm', 'BookTrackerDebug'], 'Engine'],
      },
    },
    layout: 'centered',
  },
};

export default preview;
