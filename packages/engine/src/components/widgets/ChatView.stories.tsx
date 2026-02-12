import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChatView } from './ChatView';
import type { ChatMessage } from '../../types';

function ChatDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: 'Hello! How can I help?' },
  ]);

  return (
    <div style={{ width: 400, height: 350 }}>
      <ChatView
        messages={messages}
        suggestions={['What is low stock?', 'Show report']}
        onSend={(text) => {
          setMessages((m) => [
            ...m,
            { role: 'user', text },
            { role: 'ai', text: `You said: "${text}"`, actions: [{ label: '📋 Browse', action: 'browse' }] },
          ]);
        }}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        placeholder="Ask about inventory…"
      />
    </div>
  );
}

const meta = {
  title: 'Widgets/ChatView',
  component: ChatDemo,
} satisfies Meta<typeof ChatDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
