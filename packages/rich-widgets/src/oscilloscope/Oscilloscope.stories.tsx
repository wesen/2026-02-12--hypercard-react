import type { Meta, StoryObj } from '@storybook/react';
import { Oscilloscope } from './Oscilloscope';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof Oscilloscope> = {
  title: 'RichWidgets/Oscilloscope',
  component: Oscilloscope,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Oscilloscope>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const SquareWave: Story = {
  args: {
    initialWaveform: 'square',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Paused: Story = {
  args: {
    autoStart: false,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const LargeCanvas: Story = {
  args: {
    canvasWidth: 800,
    canvasHeight: 500,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};
