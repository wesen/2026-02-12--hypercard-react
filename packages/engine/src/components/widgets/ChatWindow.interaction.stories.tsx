import type { Meta, StoryObj } from '@storybook/react';
import { ChatWindow } from './ChatWindow';
import { StoryFrame, useSimulatedStream } from './ChatWindow.stories';

const meta = {
  title: 'Engine/Components/Widgets/ChatWindow',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function ActionsDemo() {
  const { messages, isStreaming, send, cancel, setMessages } = useSimulatedStream([
    {
      id: 'sys',
      role: 'system',
      text: 'Welcome! I can help manage your tasks.',
      status: 'complete',
    },
    { id: 'u1', role: 'user', text: 'What should I work on today?', status: 'complete' },
    {
      id: 'a1',
      role: 'ai',
      text: "Based on your priorities, here's what I recommend:\n\n1. 🔴 **Fix login bug** — Critical, due today\n2. 🟡 **Review PR #42** — Medium priority, 2 comments pending\n3. 🟢 **Update docs** — Low priority, can be deferred",
      status: 'complete',
      actions: [
        { label: '✅ Start #1', action: 'start-1' },
        { label: '👀 Review PR', action: 'review-pr' },
        { label: '📋 All Tasks', action: 'all-tasks' },
      ],
    },
  ]);

  return (
    <StoryFrame>
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
        onSend={send}
        onCancel={cancel}
        onAction={(action) => {
          const label = String(action);
          setMessages((prev) => [
            ...prev,
            { id: `u-${Date.now()}`, role: 'user', text: `[Clicked: ${label}]`, status: 'complete' },
            {
              id: `a-${Date.now()}`,
              role: 'ai',
              text: `Got it! Processing action: "${label}". In a real app this would navigate or perform the action.`,
              status: 'complete',
            },
          ]);
        }}
        title="Task Manager"
        placeholder="Ask about your tasks…"
        suggestions={['What is due today?', 'Show all tasks', 'Create a task']}
      />
    </StoryFrame>
  );
}

export const WithActions: Story = {
  render: () => <ActionsDemo />,
};

export const SystemMessages: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'system', text: '🔄 Connected to CRM database. 847 records loaded.', status: 'complete' },
          { id: '2', role: 'user', text: 'Show me recent activity', status: 'complete' },
          {
            id: '3',
            role: 'ai',
            text: "Here's the recent activity:\n\n• Alice called Acme Corp (2h ago)\n• Bob sent proposal to Beta Inc (4h ago)\n• Carol logged meeting notes for Gamma LLC (yesterday)",
            status: 'complete',
          },
          { id: '4', role: 'system', text: '⚠️ 2 deals have upcoming deadlines this week.', status: 'complete' },
          { id: '5', role: 'user', text: 'Which deals?', status: 'complete' },
          {
            id: '6',
            role: 'ai',
            text: 'Two deals need attention this week:\n\n1. **Acme Enterprise License** — Proposal deadline: Friday\n2. **Gamma Pilot** — Follow-up call scheduled: Thursday',
            status: 'complete',
            actions: [
              { label: '📅 Calendar', action: 'calendar' },
              { label: '📧 Send Reminders', action: 'reminders' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="CRM Assistant"
        subtitle="Real-time notifications"
      />
    </StoryFrame>
  ),
};

export const NarrowWidth: Story = {
  render: () => (
    <div style={{ width: 380, height: 600, margin: '20px auto', border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Hi!', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: "Hello! I'm your assistant. I work great even in narrow views. How can I help you today?",
            status: 'complete',
            actions: [
              { label: '📋 Tasks', action: 'tasks' },
              { label: '📊 Reports', action: 'reports' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="Assistant"
        suggestions={['Tasks', 'Reports', 'Help']}
      />
    </div>
  ),
};

export const WithTimestamps: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          {
            id: '1',
            role: 'system',
            text: 'Session started.',
            status: 'complete',
            meta: { timestamp: '10:30 AM' },
          },
          {
            id: '2',
            role: 'user',
            text: 'What are the top selling products?',
            status: 'complete',
            meta: { timestamp: '10:31 AM' },
          },
          {
            id: '3',
            role: 'ai',
            text: "Here are your top sellers this month:\n\n1. Thingamajig E — 2,400 units\n2. Sprocket C — 890 units\n3. Widget A — 340 units\n\nThingamajig E continues to dominate with 3x the volume of the runner-up.",
            status: 'complete',
            meta: { timestamp: '10:31 AM' },
            actions: [{ label: '📊 Sales Chart', action: 'chart' }],
          },
          {
            id: '4',
            role: 'user',
            text: 'How does that compare to last month?',
            status: 'complete',
            meta: { timestamp: '10:32 AM' },
          },
          {
            id: '5',
            role: 'ai',
            text: 'Compared to last month:\n\n• Thingamajig E: ↑ 15% (+312 units)\n• Sprocket C: ↓ 3% (-28 units)\n• Widget A: ↑ 22% (+62 units)\n\nOverall sales volume is up 8.4% month-over-month.',
            status: 'complete',
            meta: { timestamp: '10:32 AM' },
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="Sales Intelligence"
        subtitle="Real-time analytics"
        footer={<span>Data as of Feb 15, 2026 · Refreshes every 5 min</span>}
      />
    </StoryFrame>
  ),
};
