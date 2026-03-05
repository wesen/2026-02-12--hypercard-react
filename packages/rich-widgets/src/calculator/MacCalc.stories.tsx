import type { Meta, StoryObj } from '@storybook/react';
import { MacCalc } from './MacCalc';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof MacCalc> = {
  title: 'RichWidgets/MacCalc',
  component: MacCalc,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MacCalc>;

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

export const Empty: Story = {
  args: {
    initialCells: {},
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
  args: {},
  decorators: [
    (Story) => (
      <div style={{ height: 400, width: 700 }}>
        <Story />
      </div>
    ),
  ],
};
