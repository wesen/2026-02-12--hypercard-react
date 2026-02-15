import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { Act, defineCardStack, ui } from '../../../cards/helpers';
import { hypercardRuntimeReducer } from '../../../cards/runtimeStateSlice';
import type { CardStackDefinition } from '../../../cards/types';
import { notificationsReducer } from '../../../features/notifications/notificationsSlice';
import { openWindow, windowingReducer } from '../../../features/windowing/windowingSlice';
import { CardSessionHost, type CardSessionHostProps } from './CardSessionHost';

// ── Demo stacks ──

/** Minimal stack with two navigable cards */
const NAV_STACK: CardStackDefinition = defineCardStack({
  id: 'nav-demo',
  name: 'Nav Demo',
  icon: '🧭',
  homeCard: 'list',
  cards: {
    list: {
      id: 'list',
      type: 'menu',
      title: 'Item List',
      icon: '📋',
      ui: ui.menu({
        icon: '📋',
        labels: [{ value: 'Items' }],
        buttons: [
          { label: '🔍 View Widget A', action: Act('nav.go', { card: 'detail', param: 'widget-a' }) },
          { label: '🔍 View Widget B', action: Act('nav.go', { card: 'detail', param: 'widget-b' }) },
          { label: '🔍 View Widget C', action: Act('nav.go', { card: 'detail', param: 'widget-c' }) },
        ],
      }),
    },
    detail: {
      id: 'detail',
      type: 'detail',
      title: 'Item Detail',
      icon: '📄',
      ui: ui.screen({
        header: ui.toolbar({
          left: [ui.button({ label: '← Back', key: 'backBtn' })],
          right: ui.text('Detail View'),
        }),
        body: [
          ui.detail({
            record: { name: 'Sample Item', category: 'Widgets', price: '$12.00', stock: '45 units' },
            fields: [
              { id: 'name', label: 'Name', type: 'readonly' },
              { id: 'category', label: 'Category', type: 'readonly' },
              { id: 'price', label: 'Price', type: 'readonly' },
              { id: 'stock', label: 'Stock', type: 'readonly' },
            ],
          }),
        ],
      }),
      bindings: {
        backBtn: {
          press: Act('nav.back'),
        },
      },
    },
  },
});

/** Chat card stack */
const CHAT_STACK: CardStackDefinition = defineCardStack({
  id: 'chat-demo',
  name: 'Chat Demo',
  icon: '💬',
  homeCard: 'chat',
  cards: {
    chat: {
      id: 'chat',
      type: 'chat',
      title: 'Assistant',
      icon: '💬',
      ui: ui.screen({
        body: [
          ui.chat({
            key: 'chatView',
            messages: [
              { role: 'assistant', content: 'Hello! How can I help you today?' },
              { role: 'user', content: 'Show me the inventory report.' },
              {
                role: 'assistant',
                content:
                  'Here is a summary:\n• Widgets: 45 items\n• Gadgets: 38 items\n• Parts: 73 items\n\nTotal value: $4,230.00',
              },
            ],
            placeholder: 'Type a message…',
            suggestions: ['Show inventory', 'Low stock alerts'],
          }),
        ],
      }),
    },
  },
});

/** Report card stack */
const REPORT_STACK: CardStackDefinition = defineCardStack({
  id: 'report-demo',
  name: 'Report Demo',
  icon: '📊',
  homeCard: 'report',
  cards: {
    report: {
      id: 'report',
      type: 'report',
      title: 'Monthly Report',
      icon: '📊',
      ui: ui.screen({
        header: ui.toolbar({
          left: [ui.text('Monthly Summary — January 2026')],
        }),
        body: [
          ui.report({
            sections: [
              {
                title: 'Revenue',
                items: [
                  { label: 'Gross Revenue', value: '$12,450.00' },
                  { label: 'Net Revenue', value: '$10,830.00' },
                  { label: 'Refunds', value: '$620.00' },
                ],
              },
              {
                title: 'Inventory',
                items: [
                  { label: 'Items in Stock', value: '156' },
                  { label: 'Low Stock Alerts', value: '3' },
                  { label: 'Out of Stock', value: '0' },
                ],
              },
            ],
          }),
        ],
      }),
    },
  },
});

// ── Store factories ──

function createStoreWithSession(stack: CardStackDefinition, sessionId: string, cardId?: string) {
  const store = configureStore({
    reducer: {
      hypercardRuntime: hypercardRuntimeReducer,
      windowing: windowingReducer,
      notifications: notificationsReducer,
    },
  });

  // Open a window to bootstrap the session nav stack
  store.dispatch(
    openWindow({
      id: `window:${sessionId}`,
      title: stack.cards[cardId ?? stack.homeCard]?.title ?? 'Window',
      bounds: { x: 0, y: 0, w: 400, h: 300 },
      content: {
        kind: 'card',
        card: {
          stackId: stack.id,
          cardId: cardId ?? stack.homeCard,
          cardSessionId: sessionId,
        },
      },
    }),
  );

  return store;
}

// ── Story wrapper ──

interface CardSessionHostStoryProps extends CardSessionHostProps {
  /** Stack override for the store factory */
  _stack?: CardStackDefinition;
}

function CardSessionHostWrapper({ _stack, ...props }: CardSessionHostStoryProps) {
  const stack = _stack ?? props.stack;
  const store = createStoreWithSession(stack, props.sessionId);
  return (
    <Provider store={store}>
      <div style={{ width: 420, height: 340, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
        <CardSessionHost {...props} stack={stack} />
      </div>
    </Provider>
  );
}

// ── Meta ──

const meta = {
  title: 'Shell/Windowing/CardSessionHost',
  component: CardSessionHostWrapper,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CardSessionHostWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──

/** Menu card with nav buttons — click to navigate within session */
export const NavigableMenu: Story = {
  args: {
    windowId: 'window:s1',
    sessionId: 's1',
    stack: NAV_STACK,
  },
};

/** Chat card rendered in a session host */
export const ChatCard: Story = {
  args: {
    windowId: 'window:s2',
    sessionId: 's2',
    stack: CHAT_STACK,
  },
};

/** Report card rendered in a session host */
export const ReportCard: Story = {
  args: {
    windowId: 'window:s3',
    sessionId: 's3',
    stack: REPORT_STACK,
  },
};

/** Preview mode — interactions disabled */
export const PreviewMode: Story = {
  args: {
    windowId: 'window:s4',
    sessionId: 's4',
    stack: NAV_STACK,
    mode: 'preview',
  },
};

/** Two session hosts side by side — proves session isolation */
export const TwoSessionsIsolated: Story = {
  args: {
    windowId: 'window:session-a',
    sessionId: 'session-a',
    stack: NAV_STACK,
  },
  render: () => {
    const storeA = createStoreWithSession(NAV_STACK, 'session-a');
    const storeB = createStoreWithSession(NAV_STACK, 'session-b');
    return (
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4, fontFamily: 'monospace', fontSize: 11 }}>
            Session A (session-a)
          </div>
          <Provider store={storeA}>
            <div style={{ width: 360, height: 300, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
              <CardSessionHost windowId="window:session-a" sessionId="session-a" stack={NAV_STACK} />
            </div>
          </Provider>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4, fontFamily: 'monospace', fontSize: 11 }}>
            Session B (session-b)
          </div>
          <Provider store={storeB}>
            <div style={{ width: 360, height: 300, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
              <CardSessionHost windowId="window:session-b" sessionId="session-b" stack={NAV_STACK} />
            </div>
          </Provider>
        </div>
      </div>
    );
  },
};
