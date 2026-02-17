import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useCallback, useState } from 'react';
import { defaultResponseMatcher, tokenize } from '../../chat/mocks/fakeResponses';
import type { ColumnConfig } from '../../types';
import { DataTable } from './DataTable';
import {
  ChatWindow,
  type ChatWindowMessage,
  type InlineWidget,
} from './ChatWindow';
import { ListView } from './ListView';
import { ReportView } from './ReportView';

export function useSimulatedStream(initialMessages?: ChatWindowMessage[]) {
  const [messages, setMessages] = useState<ChatWindowMessage[]>(
    initialMessages ?? [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  const send = useCallback(
    (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatWindowMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
        status: 'complete',
      };
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatWindowMessage = {
        id: aiMsgId,
        role: 'ai',
        text: '',
        status: 'streaming',
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      const response = defaultResponseMatcher(text);
      const tokens = tokenize(response?.text ?? "I'm not sure about that.");
      const actions = response?.actions;

      let cancelled = false;
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      let elapsed = 400;

      for (let i = 0; i < tokens.length; i++) {
        elapsed += 20 + Math.random() * 50;
        const t = setTimeout(() => {
          if (cancelled) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, text: m.text + tokens[i] } : m,
            ),
          );
        }, elapsed);
        timeouts.push(t);
      }

      elapsed += 50;
      const doneT = setTimeout(() => {
        if (cancelled) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, status: 'complete' as const, actions }
              : m,
          ),
        );
        setIsStreaming(false);
        setCancelFn(null);
      }, elapsed);
      timeouts.push(doneT);

      setCancelFn(() => () => {
        cancelled = true;
        timeouts.forEach(clearTimeout);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, status: 'complete' as const } : m,
          ),
        );
        setIsStreaming(false);
        setCancelFn(null);
      });
    },
    [isStreaming],
  );

  const cancel = useCallback(() => cancelFn?.(), [cancelFn]);

  return { messages, isStreaming, send, cancel, setMessages };
}

export const STOCK_DATA = [
  { id: '1', name: 'Widget A', sku: 'WA-100', qty: 2, price: 29.99, status: 'Low' },
  { id: '2', name: 'Gadget B', sku: 'GB-200', qty: 1, price: 49.99, status: 'Critical' },
  { id: '3', name: 'Sprocket C', sku: 'SC-300', qty: 45, price: 12.5, status: 'OK' },
  { id: '4', name: 'Doohickey D', sku: 'DD-400', qty: 8, price: 7.25, status: 'Low' },
  { id: '5', name: 'Thingamajig E', sku: 'TE-500', qty: 120, price: 3.0, status: 'OK' },
];

export const STOCK_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Product', width: '1.5fr' },
  { key: 'sku', label: 'SKU', width: '1fr' },
  { key: 'qty', label: 'Qty', width: 60, align: 'right' },
  {
    key: 'price',
    label: 'Price',
    width: 70,
    align: 'right',
    format: (v) => `$${Number(v).toFixed(2)}`,
  },
  {
    key: 'status',
    label: 'Status',
    width: 80,
    cellState: (v) => {
      if (v === 'Critical') return 'error';
      if (v === 'Low') return 'warning';
      return undefined;
    },
  },
];

export const DEAL_DATA = [
  { id: 'd1', name: 'Acme Enterprise', value: 120000, stage: 'Negotiation', probability: 75 },
  { id: 'd2', name: 'Beta Corp Renewal', value: 30000, stage: 'Closed Won', probability: 100 },
  { id: 'd3', name: 'Gamma Pilot', value: 18000, stage: 'Qualification', probability: 25 },
  { id: 'd4', name: 'Delta Expansion', value: 85000, stage: 'Proposal', probability: 50 },
];

export const DEAL_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Deal', width: '2fr' },
  {
    key: 'value',
    label: 'Value',
    width: 100,
    align: 'right',
    format: (v) => `$${Number(v).toLocaleString()}`,
  },
  { key: 'stage', label: 'Stage', width: '1fr' },
  {
    key: 'probability',
    label: 'Prob %',
    width: 70,
    align: 'right',
    format: (v) => `${v}%`,
  },
];

export const REPORT_SECTIONS = [
  { label: 'Total Revenue', value: '$245,000' },
  { label: 'Open Deals', value: '5' },
  { label: 'Win Rate', value: '68%' },
  { label: 'Avg Deal Size', value: '$49,000' },
  { label: 'Pipeline Value', value: '$380,000' },
  { label: 'Forecasted Revenue', value: '$198,000' },
];

export const CONTACT_DATA = [
  { id: 'c1', name: 'Alice Johnson', company: 'Acme Corp', email: 'alice@acme.com', role: 'VP Sales' },
  { id: 'c2', name: 'Bob Smith', company: 'Beta Inc', email: 'bob@beta.com', role: 'CTO' },
  { id: 'c3', name: 'Carol Davis', company: 'Gamma LLC', email: 'carol@gamma.com', role: 'Buyer' },
  { id: 'c4', name: 'Dave Wilson', company: 'Delta Co', email: 'dave@delta.com', role: 'Director' },
  { id: 'c5', name: 'Eve Martinez', company: 'Umbrella Ltd', email: 'eve@umbrella.com', role: 'CEO' },
];

export const CONTACT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', width: '1.5fr' },
  { key: 'company', label: 'Company', width: '1fr' },
  { key: 'role', label: 'Role', width: '1fr' },
  { key: 'email', label: 'Email', width: '1.5fr' },
];

export function defaultWidgetRenderer(widget: InlineWidget): ReactNode {
  switch (widget.type) {
    case 'data-table': {
      const p = widget.props as {
        items: Record<string, unknown>[];
        columns: ColumnConfig[];
      };
      return <DataTable items={p.items} columns={p.columns} />;
    }
    case 'list-view': {
      const p = widget.props as {
        items: Record<string, unknown>[];
        columns: ColumnConfig[];
      };
      return <ListView items={p.items} columns={p.columns} />;
    }
    case 'report-view': {
      const p = widget.props as {
        sections: Array<{ label: string; value: string }>;
      };
      return <ReportView sections={p.sections} />;
    }
    default:
      return (
        <div style={{ padding: 8, fontSize: 11, color: '#999' }}>
          Unknown widget: {widget.type}
        </div>
      );
  }
}

const meta = {
  title: 'Engine/Components/Widgets/ChatWindow',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
export type Story = StoryObj;

export function StoryFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      {children}
    </div>
  );
}

function InteractiveDemo() {
  const { messages, isStreaming, send, cancel } = useSimulatedStream();

  return (
    <StoryFrame>
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
        onSend={send}
        onCancel={cancel}
        suggestions={['Hello!', 'What can you help with?', 'Show me some data', 'Help']}
        title="AI Assistant"
        subtitle="Interactive demo"
        placeholder="Ask me anything…"
        footer={<span>Model: fake-gpt-4 · Streaming enabled</span>}
      />
    </StoryFrame>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

export const Welcome: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[]}
        isStreaming={false}
        onSend={() => {}}
        suggestions={['What is my pipeline?', 'Show low stock items', 'Help me find a contact']}
        title="CRM Assistant"
        subtitle="Powered by AI"
        placeholder="Ask about your CRM data…"
      />
    </StoryFrame>
  ),
};

export const CustomWelcome: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[]}
        isStreaming={false}
        onSend={() => {}}
        suggestions={['Dashboard', 'Inventory', 'Reports']}
        title="Inventory Bot"
        welcomeContent={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Inventory Assistant</div>
            <div style={{ fontSize: 12, color: '#888', maxWidth: 400 }}>
              I can help you check stock levels, find products, generate reports, and manage your inventory. Try asking a question below!
            </div>
          </div>
        }
      />
    </StoryFrame>
  ),
};

export const Thinking: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'What items are running low on stock?', status: 'complete' },
          { id: '2', role: 'ai', text: '', status: 'streaming' },
        ]}
        isStreaming
        onSend={() => {}}
        onCancel={() => {}}
        title="Inventory Assistant"
      />
    </StoryFrame>
  ),
};

export const MidStream: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Give me a summary of open deals', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: 'Here are your currently open deals:\n\n• Acme Enterprise License — $120,000 (Negotiation)\n• Gamma Pilot Program — $18,000 (Qualification)',
            status: 'streaming',
          },
        ]}
        isStreaming
        onSend={() => {}}
        onCancel={() => {}}
        title="CRM Assistant"
      />
    </StoryFrame>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Analyze last quarter revenue', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: 'I encountered an error while processing your request. The analytics service is temporarily unavailable.',
            status: 'error',
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="Analytics Chat"
      />
    </StoryFrame>
  ),
};
