import type { Meta, StoryObj } from '@storybook/react';
import { ChatBrowser } from './ChatBrowser';
import { CONVERSATIONS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof ChatBrowser> = {
  title: 'Rich Widgets/ChatBrowser',
  component: ChatBrowser,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof ChatBrowser>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 900, height: 600 }}>
      <ChatBrowser />
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div style={{ width: 640, height: 440 }}>
      <ChatBrowser />
    </div>
  ),
};

export const FewConversations: Story = {
  render: () => (
    <div style={{ width: 900, height: 600 }}>
      <ChatBrowser conversations={CONVERSATIONS.slice(0, 3)} />
    </div>
  ),
};
