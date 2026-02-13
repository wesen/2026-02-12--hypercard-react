import type { Preview } from '@storybook/react';
import React from 'react';
import { HyperCardTheme } from '../../../packages/engine/src/theme/HyperCardTheme';
import '../../../packages/engine/src/theme/base.css';

const preview: Preview = {
  decorators: [(Story) => React.createElement(HyperCardTheme, null, React.createElement(Story))],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
};

export default preview;
