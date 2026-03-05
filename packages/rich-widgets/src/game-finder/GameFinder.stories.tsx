import type { Meta, StoryObj } from '@storybook/react';
import { GameFinder } from './GameFinder';
import { SAMPLE_GAMES } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof GameFinder> = {
  title: 'RichWidgets/GameFinder',
  component: GameFinder,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GameFinder>;

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

export const Compact: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div style={{ height: 500, width: 700 }}>
        <Story />
      </div>
    ),
  ],
};

export const FewGames: Story = {
  args: {
    initialGames: SAMPLE_GAMES.slice(0, 3),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};
