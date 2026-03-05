import type { Meta, StoryObj } from '@storybook/react';
import { LogicAnalyzer } from './LogicAnalyzer';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof LogicAnalyzer> = {
  title: 'RichWidgets/LogicAnalyzer',
  component: LogicAnalyzer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof LogicAnalyzer>;

export const Default: Story = {
  args: {},
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

export const AllChannels: Story = {
  args: {
    initialChannelCount: 8,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const TwoChannels: Story = {
  args: {
    initialChannelCount: 2,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Compact: Story = {
  args: {
    canvasWidth: 400,
    canvasHeight: 220,
    initialChannelCount: 4,
  },
  decorators: [
    (Story) => (
      <div style={{ height: 400 }}>
        <Story />
      </div>
    ),
  ],
};
