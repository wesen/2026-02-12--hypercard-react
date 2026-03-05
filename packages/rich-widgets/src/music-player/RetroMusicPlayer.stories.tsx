import type { Meta, StoryObj } from '@storybook/react';
import { RetroMusicPlayer } from './RetroMusicPlayer';
import { PLAYLISTS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof RetroMusicPlayer> = {
  title: 'RichWidgets/RetroMusicPlayer',
  component: RetroMusicPlayer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RetroMusicPlayer>;

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

export const FewPlaylists: Story = {
  args: {
    initialPlaylists: PLAYLISTS.slice(0, 3),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};
