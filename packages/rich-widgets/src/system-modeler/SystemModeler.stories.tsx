import type { Meta, StoryObj } from '@storybook/react';
import { SystemModeler } from './SystemModeler';

const meta: Meta<typeof SystemModeler> = {
  title: 'Rich Widgets/SystemModeler',
  component: SystemModeler,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof SystemModeler>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 960, height: 600 }}>
      <SystemModeler />
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div style={{ width: 700, height: 440 }}>
      <SystemModeler />
    </div>
  ),
};

export const EmptyCanvas: Story = {
  render: () => (
    <div style={{ width: 960, height: 600 }}>
      <SystemModeler initialBlocks={[]} initialWires={[]} />
    </div>
  ),
};
