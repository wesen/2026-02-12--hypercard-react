import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useState } from 'react';
import { defaultResponseMatcher } from '../../chat/mocks/fakeResponses';
import { ChatWindow, type ChatWindowMessage } from './ChatWindow';
import {
  CONTACT_COLUMNS,
  CONTACT_DATA,
  DEAL_COLUMNS,
  DEAL_DATA,
  REPORT_SECTIONS,
  STOCK_COLUMNS,
  STOCK_DATA,
  StoryFrame,
  defaultWidgetRenderer,
} from './ChatWindow.stories';

const meta = {
  title: 'Engine/Components/Widgets/ChatWindow',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const InlineDataTable: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Show me the current stock levels', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              {
                kind: 'text',
                text: 'Here are the current stock levels across all products. Items marked as Critical or Low need attention:',
              },
              {
                kind: 'widget',
                widget: {
                  id: 'stock-table',
                  type: 'data-table',
                  label: 'Stock Levels',
                  props: { items: STOCK_DATA, columns: STOCK_COLUMNS },
                },
              },
              {
                kind: 'text',
                text: '2 items are below the reorder threshold. Would you like me to create purchase orders?',
              },
            ],
            actions: [
              { label: '📦 Create PO', action: 'create-po' },
              { label: '📊 Full Report', action: 'report' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        title="Inventory Assistant"
        renderWidget={defaultWidgetRenderer}
      />
    </StoryFrame>
  ),
};

export const InlineReport: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Show me my pipeline summary', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: "Here's your current pipeline summary:" },
              {
                kind: 'widget',
                widget: {
                  id: 'pipeline-report',
                  type: 'report-view',
                  label: 'Pipeline Summary',
                  props: { sections: REPORT_SECTIONS },
                },
              },
              {
                kind: 'text',
                text: 'Your win rate has improved 12% over last quarter. The forecasted revenue of $198K is based on probability-weighted deal values.',
              },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="CRM Assistant"
        renderWidget={defaultWidgetRenderer}
      />
    </StoryFrame>
  ),
};

export const MultipleWidgets: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          {
            id: 'sys',
            role: 'system',
            text: 'Welcome! I can help you explore your CRM data.',
            status: 'complete',
          },
          { id: '1', role: 'user', text: 'Show me my open deals', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'You have 4 deals in your pipeline:' },
              {
                kind: 'widget',
                widget: {
                  id: 'deal-table',
                  type: 'data-table',
                  label: 'Deal Pipeline',
                  props: { items: DEAL_DATA, columns: DEAL_COLUMNS },
                },
              },
              { kind: 'text', text: 'Total pipeline value is $253,000 with a weighted forecast of $134,750.' },
            ],
            actions: [
              { label: '📊 Pipeline Chart', action: 'chart' },
              { label: '➕ New Deal', action: 'new-deal' },
            ],
          },
          { id: '3', role: 'user', text: 'Who are my key contacts?', status: 'complete' },
          {
            id: '4',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here are your 5 active contacts:' },
              {
                kind: 'widget',
                widget: {
                  id: 'contact-table',
                  type: 'data-table',
                  label: 'Contacts',
                  props: { items: CONTACT_DATA, columns: CONTACT_COLUMNS },
                },
              },
              { kind: 'text', text: 'Alice Johnson and Eve Martinez are flagged as VIP contacts.' },
            ],
          },
          {
            id: '5',
            role: 'user',
            text: 'Give me the revenue summary too',
            status: 'complete',
          },
          {
            id: '6',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: "Here's your revenue overview:" },
              {
                kind: 'widget',
                widget: {
                  id: 'revenue-report',
                  type: 'report-view',
                  label: 'Revenue Summary',
                  props: { sections: REPORT_SECTIONS },
                },
              },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        title="CRM Assistant"
        subtitle="5 contacts · 4 deals"
        renderWidget={defaultWidgetRenderer}
        footer={<span>Model: gpt-4o · Last synced: 2 min ago</span>}
      />
    </StoryFrame>
  ),
};

export const LongConversation: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: 's1', role: 'system', text: 'Welcome! How can I help you today?', status: 'complete' },
          { id: 'u1', role: 'user', text: 'How many contacts do I have?', status: 'complete' },
          {
            id: 'a1',
            role: 'ai',
            text: 'You have 7 contacts across 5 companies. 2 are customers, 2 are prospects, 2 are leads, and 1 has churned.',
            status: 'complete',
          },
          { id: 'u2', role: 'user', text: 'Which ones are VIPs?', status: 'complete' },
          {
            id: 'a2',
            role: 'ai',
            text: 'Two contacts are tagged as VIP:\n\n• **Alice Johnson** (Acme Corp) — Active customer\n• **Eve Martinez** (Umbrella Ltd) — Active customer\n\nBoth have active deals in the pipeline.',
            status: 'complete',
            actions: [
              { label: '👤 Alice', action: 'c1' },
              { label: '👤 Eve', action: 'c5' },
            ],
          },
          { id: 'u3', role: 'user', text: 'What deals does Alice have?', status: 'complete' },
          {
            id: 'a3',
            role: 'ai',
            text: 'Alice Johnson has 2 deals:\n\n1. **Acme Enterprise License** — $120,000, Negotiation stage (75% probability)\n2. **Acme Support Renewal** — $30,000, Closed Won\n\nTotal pipeline value: $150,000',
            status: 'complete',
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        title="CRM Assistant"
      />
    </StoryFrame>
  ),
};

export const MixedContent: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Analyze my inventory and give me a full report', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              {
                kind: 'text',
                text: "I've analyzed your current inventory. Here's the breakdown:",
              },
              {
                kind: 'widget',
                widget: {
                  id: 'inv-table',
                  type: 'data-table',
                  label: 'Current Inventory',
                  props: { items: STOCK_DATA, columns: STOCK_COLUMNS },
                },
              },
              {
                kind: 'text',
                text: 'And here are the key metrics:',
              },
              {
                kind: 'widget',
                widget: {
                  id: 'inv-report',
                  type: 'report-view',
                  label: 'Inventory Metrics',
                  props: {
                    sections: [
                      { label: 'Total Products', value: '5' },
                      { label: 'Total Units', value: '176' },
                      { label: 'Low Stock Items', value: '2' },
                      { label: 'Critical Items', value: '1' },
                      { label: 'Total Value', value: '$4,287.50' },
                      { label: 'Avg Price', value: '$20.55' },
                    ],
                  },
                },
              },
              {
                kind: 'text',
                text: '🔴 Gadget B is at critical level (1 unit). Widget A is also running low with only 2 units remaining. I recommend placing restock orders for both items immediately.',
              },
            ],
            actions: [
              { label: '📦 Restock Critical', action: 'restock-critical' },
              { label: '📦 Restock All Low', action: 'restock-low' },
              { label: '📧 Notify Supplier', action: 'notify' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        title="Inventory Assistant"
        subtitle="Real-time analysis"
        renderWidget={defaultWidgetRenderer}
        footer={<span>Last sync: just now · 5 products tracked</span>}
      />
    </StoryFrame>
  ),
};

export const InlineListView: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Show me all contacts with search', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here are all your contacts. You can search and filter the list:' },
              {
                kind: 'widget',
                widget: {
                  id: 'contact-list',
                  type: 'list-view',
                  label: 'Contact Directory',
                  props: {
                    items: CONTACT_DATA,
                    columns: CONTACT_COLUMNS,
                  },
                },
              },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="CRM Chat"
        renderWidget={defaultWidgetRenderer}
      />
    </StoryFrame>
  ),
};

function InteractiveWithWidgetsDemo() {
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const smartRespond = useCallback(
    (text: string) => {
      if (isStreaming) return;
      const lower = text.toLowerCase();

      const userMsg: ChatWindowMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
        status: 'complete',
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      setTimeout(() => {
        let aiMsg: ChatWindowMessage;

        if (lower.includes('stock') || lower.includes('inventory')) {
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here are the current stock levels:' },
              {
                kind: 'widget',
                widget: {
                  id: `stock-${Date.now()}`,
                  type: 'data-table',
                  label: 'Stock Levels',
                  props: { items: STOCK_DATA, columns: STOCK_COLUMNS },
                },
              },
              { kind: 'text', text: '2 items need restocking.' },
            ],
            actions: [{ label: '📦 Restock', action: 'restock' }],
          };
        } else if (lower.includes('deal') || lower.includes('pipeline')) {
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Your current deal pipeline:' },
              {
                kind: 'widget',
                widget: {
                  id: `deals-${Date.now()}`,
                  type: 'data-table',
                  label: 'Deals',
                  props: { items: DEAL_DATA, columns: DEAL_COLUMNS },
                },
              },
            ],
          };
        } else if (lower.includes('report') || lower.includes('summary')) {
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: "Here's your summary report:" },
              {
                kind: 'widget',
                widget: {
                  id: `report-${Date.now()}`,
                  type: 'report-view',
                  label: 'Summary',
                  props: { sections: REPORT_SECTIONS },
                },
              },
            ],
          };
        } else if (lower.includes('contact')) {
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here are your contacts:' },
              {
                kind: 'widget',
                widget: {
                  id: `contacts-${Date.now()}`,
                  type: 'data-table',
                  label: 'Contacts',
                  props: { items: CONTACT_DATA, columns: CONTACT_COLUMNS },
                },
              },
            ],
          };
        } else {
          const resp = defaultResponseMatcher(text);
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: resp?.text ?? "I'm not sure about that.",
            status: 'complete',
            actions: resp?.actions,
          };
        }

        setMessages((prev) => [...prev, aiMsg]);
        setIsStreaming(false);
      }, 800);
    },
    [isStreaming],
  );

  return (
    <StoryFrame>
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
        onSend={smartRespond}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        suggestions={[
          'Show stock levels',
          'Show deals',
          'Show contacts',
          'Give me a summary report',
          'Hello!',
        ]}
        title="Smart Assistant"
        subtitle="Try: stock, deals, contacts, report"
        placeholder="Ask about inventory, deals, contacts, or reports…"
        renderWidget={defaultWidgetRenderer}
        footer={<span>Widget-aware responses · Type "stock", "deals", "contacts", or "report"</span>}
      />
    </StoryFrame>
  );
}

export const InteractiveWithWidgets: Story = {
  render: () => <InteractiveWithWidgetsDemo />,
};
