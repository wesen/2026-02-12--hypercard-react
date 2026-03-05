import type { Meta, StoryObj } from '@storybook/react';
import { ControlRoom } from './ControlRoom';

const meta: Meta<typeof ControlRoom> = {
  title: 'Rich Widgets/ControlRoom',
  component: ControlRoom,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof ControlRoom>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 960, height: 700 }}>
      <ControlRoom />
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div style={{ width: 720, height: 500 }}>
      <ControlRoom />
    </div>
  ),
};

export const FastTick: Story = {
  render: () => (
    <div style={{ width: 960, height: 700 }}>
      <ControlRoom tickInterval={200} />
    </div>
  ),
};
