import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppStore } from '../../../app/createAppStore';
import type { CardDefinition, CardStackDefinition } from '../../../cards/types';
import { openWindow } from '../../../features/windowing/windowingSlice';
import { PluginCardSessionHost, type PluginCardSessionHostProps } from './PluginCardSessionHost';

const NAV_PLUGIN_BUNDLE = String.raw`
defineStackBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function navParam(globalState) {
    const param = asRecord(asRecord(globalState).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function item(id) {
    const records = {
      'widget-a': {
        name: 'Widget A',
        sku: 'W-1001',
        category: 'Widgets',
        price: '$12.00',
        stock: '45 units',
        supplier: 'Acme Corp',
        lastRestock: 'Feb 10, 2026',
      },
      'widget-b': {
        name: 'Widget B',
        sku: 'W-1002',
        category: 'Widgets',
        price: '$15.00',
        stock: '12 units',
        supplier: 'Acme Corp',
        lastRestock: 'Feb 12, 2026',
      },
      'widget-c': {
        name: 'Widget C',
        sku: 'W-1003',
        category: 'Widgets',
        price: '$19.00',
        stock: '9 units',
        supplier: 'Globex',
        lastRestock: 'Feb 14, 2026',
      },
    };
    return records[id] || records['widget-a'];
  }

  return {
    id: 'nav-demo',
    title: 'Nav Demo',
    cards: {
      list: {
        render() {
          return ui.panel([
            ui.text('Items'),
            ui.button('🔍 View Widget A', { onClick: { handler: 'go', args: { cardId: 'detail', param: 'widget-a' } } }),
            ui.button('🔍 View Widget B', { onClick: { handler: 'go', args: { cardId: 'detail', param: 'widget-b' } } }),
            ui.button('🔍 View Widget C', { onClick: { handler: 'go', args: { cardId: 'detail', param: 'widget-c' } } }),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            const payload = asRecord(args);
            dispatchSystemCommand('nav.go', { cardId: String(payload.cardId || 'list'), param: String(payload.param || '') });
          },
        },
      },
      detail: {
        render({ globalState }) {
          const current = item(navParam(globalState));
          return ui.panel([
            ui.text('Item Detail'),
            ui.table(
              [
                ['Name', current.name],
                ['SKU', current.sku],
                ['Category', current.category],
                ['Price', current.price],
                ['Stock', current.stock],
                ['Supplier', current.supplier],
                ['Last Restock', current.lastRestock],
              ],
              { headers: ['Field', 'Value'] }
            ),
            ui.row([
              ui.button('← Back', { onClick: { handler: 'back' } }),
              ui.button('🛒 Reorder', { onClick: { handler: 'notify', args: { message: 'Reorder placed' } } }),
            ]),
          ]);
        },
        handlers: {
          back({ dispatchSystemCommand }) {
            dispatchSystemCommand('nav.back');
          },
          notify({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('notify', { message: String(asRecord(args).message || '') });
          },
        },
      },
    },
  };
});
`;

const CHAT_PLUGIN_BUNDLE = String.raw`
defineStackBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  return {
    id: 'chat-demo',
    title: 'Chat Demo',
    initialCardState: {
      chat: {
        draft: '',
        messages: [
          'Hello! How can I help you today?',
          'Try asking about report export or low stock alerts.',
        ],
      },
    },
    cards: {
      chat: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const messages = Array.isArray(state.messages) ? state.messages : [];
          const draft = String(state.draft || '');

          return ui.panel([
            ui.text('Assistant'),
            ui.column(messages.map((message) => ui.text('• ' + String(message)))),
            ui.input(draft, { onChange: { handler: 'changeDraft' } }),
            ui.row([
              ui.button('Send', { onClick: { handler: 'send' } }),
              ui.button('Clear', { onClick: { handler: 'clear' } }),
            ]),
          ]);
        },
        handlers: {
          changeDraft({ dispatchCardAction }, args) {
            dispatchCardAction('set', { path: 'draft', value: asRecord(args).value });
          },
          send({ cardState, dispatchCardAction }) {
            const state = asRecord(cardState);
            const draft = String(state.draft || '').trim();
            if (!draft) return;
            const messages = Array.isArray(state.messages) ? state.messages : [];
            dispatchCardAction('patch', {
              draft: '',
              messages: messages.concat(['You: ' + draft, 'Assistant: Thanks, received.']).slice(-10),
            });
          },
          clear({ dispatchCardAction }) {
            dispatchCardAction('patch', { draft: '', messages: [] });
          },
        },
      },
    },
  };
});
`;

const REPORT_PLUGIN_BUNDLE = String.raw`
defineStackBundle(({ ui }) => {
  return {
    id: 'report-demo',
    title: 'Report Demo',
    cards: {
      report: {
        render() {
          return ui.panel([
            ui.text('Monthly Report'),
            ui.table(
              [
                ['Gross Revenue', '$12,450.00'],
                ['Net Revenue', '$10,830.00'],
                ['Refunds', '$620.00'],
                ['Items in Stock', '156'],
                ['Low Stock Alerts', '3'],
                ['Out of Stock', '0'],
              ],
              { headers: ['Metric', 'Value'] }
            ),
            ui.button('📄 Export CSV', { onClick: { handler: 'notify' } }),
          ]);
        },
        handlers: {
          notify({ dispatchSystemCommand }) {
            dispatchSystemCommand('notify', { message: 'Export not available in demo' });
          },
        },
      },
    },
  };
});
`;

const LIST_PLUGIN_BUNDLE = String.raw`
defineStackBundle(({ ui }) => {
  const ITEMS = [
    ['W-1001', 'Widget A', 'Widgets', '$12.00', '45'],
    ['G-2001', 'Gadget B', 'Gadgets', '$25.50', '38'],
    ['P-3001', 'Doohickey C', 'Parts', '$8.75', '73'],
    ['W-1002', 'Widget D', 'Widgets', '$15.00', '12'],
    ['G-2002', 'Gizmo E', 'Gadgets', '$42.00', '5'],
    ['P-3002', 'Thingamajig F', 'Parts', '$3.25', '120'],
  ];

  return {
    id: 'list-demo',
    title: 'List Demo',
    cards: {
      browse: {
        render() {
          return ui.panel([
            ui.text('Browse Items'),
            ui.table(ITEMS, { headers: ['SKU', 'Name', 'Category', 'Price', 'Qty'] }),
            ui.text('Use Desktop Shell stories for richer interactions.'),
          ]);
        },
        handlers: {},
      },
    },
  };
});
`;

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

function toPluginCard(card: PluginCardMeta): CardDefinition {
  return {
    id: card.id,
    type: 'plugin',
    title: card.title,
    icon: card.icon,
    ui: {
      t: 'text',
      value: `Plugin card placeholder: ${card.id}`,
    },
  };
}

function createPluginStack(options: {
  id: string;
  name: string;
  icon: string;
  homeCard: string;
  bundleCode: string;
  cards: PluginCardMeta[];
}): CardStackDefinition {
  return {
    id: options.id,
    name: options.name,
    icon: options.icon,
    homeCard: options.homeCard,
    plugin: {
      bundleCode: options.bundleCode,
      capabilities: {
        system: ['nav.go', 'nav.back', 'notify'],
      },
    },
    cards: Object.fromEntries(options.cards.map((card) => [card.id, toPluginCard(card)])),
  };
}

const NAV_STACK = createPluginStack({
  id: 'nav-demo',
  name: 'Nav Demo',
  icon: '🧭',
  homeCard: 'list',
  bundleCode: NAV_PLUGIN_BUNDLE,
  cards: [
    { id: 'list', title: 'Item List', icon: '📋' },
    { id: 'detail', title: 'Item Detail', icon: '📄' },
  ],
});

const CHAT_STACK = createPluginStack({
  id: 'chat-demo',
  name: 'Chat Demo',
  icon: '💬',
  homeCard: 'chat',
  bundleCode: CHAT_PLUGIN_BUNDLE,
  cards: [{ id: 'chat', title: 'Assistant', icon: '💬' }],
});

const REPORT_STACK = createPluginStack({
  id: 'report-demo',
  name: 'Report Demo',
  icon: '📊',
  homeCard: 'report',
  bundleCode: REPORT_PLUGIN_BUNDLE,
  cards: [{ id: 'report', title: 'Monthly Report', icon: '📊' }],
});

const LIST_STACK = createPluginStack({
  id: 'list-demo',
  name: 'List Demo',
  icon: '📋',
  homeCard: 'browse',
  bundleCode: LIST_PLUGIN_BUNDLE,
  cards: [{ id: 'browse', title: 'Browse Items', icon: '📋' }],
});

const { createStore } = createAppStore({});

function createStoreWithSession(stack: CardStackDefinition, sessionId: string, cardId?: string) {
  const store = createStore();

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
    })
  );

  return store;
}

function PluginCardSessionHostWrapper(props: PluginCardSessionHostProps) {
  const store = createStoreWithSession(props.stack, props.sessionId);
  return (
    <Provider store={store}>
      <div style={{ width: 440, height: 380, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
        <PluginCardSessionHost {...props} />
      </div>
    </Provider>
  );
}

const meta = {
  title: 'Shell/Windowing/PluginCardSessionHost',
  component: PluginCardSessionHostWrapper,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PluginCardSessionHostWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NavigableMenu: Story = {
  args: {
    windowId: 'window:s1',
    sessionId: 's1',
    stack: NAV_STACK,
  },
};

export const ChatCard: Story = {
  args: {
    windowId: 'window:s2',
    sessionId: 's2',
    stack: CHAT_STACK,
  },
};

export const ReportCard: Story = {
  args: {
    windowId: 'window:s3',
    sessionId: 's3',
    stack: REPORT_STACK,
  },
};

export const ListCard: Story = {
  args: {
    windowId: 'window:s4',
    sessionId: 's4',
    stack: LIST_STACK,
  },
};

export const PreviewMode: Story = {
  args: {
    windowId: 'window:s5',
    sessionId: 's5',
    stack: NAV_STACK,
    mode: 'preview',
  },
};

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
            <div style={{ width: 380, height: 340, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
              <PluginCardSessionHost windowId="window:session-a" sessionId="session-a" stack={NAV_STACK} />
            </div>
          </Provider>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4, fontFamily: 'monospace', fontSize: 11 }}>
            Session B (session-b)
          </div>
          <Provider store={storeB}>
            <div style={{ width: 380, height: 340, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
              <PluginCardSessionHost windowId="window:session-b" sessionId="session-b" stack={NAV_STACK} />
            </div>
          </Provider>
        </div>
      </div>
    );
  },
};
