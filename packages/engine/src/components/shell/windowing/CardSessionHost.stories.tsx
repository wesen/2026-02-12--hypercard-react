import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppStore } from '../../../app/createAppStore';
import type { CardDefinition, CardStackDefinition } from '../../../cards/types';
import { openWindow } from '../../../desktop/core/state/windowingSlice';
import CHAT_PLUGIN_BUNDLE from './CardSessionHost.chat.vm.js?raw';
import LIST_PLUGIN_BUNDLE from './CardSessionHost.list.vm.js?raw';
import NAV_PLUGIN_BUNDLE from './CardSessionHost.nav.vm.js?raw';
import { PluginCardSessionHost, type PluginCardSessionHostProps } from './PluginCardSessionHost';
import REPORT_PLUGIN_BUNDLE from './CardSessionHost.report.vm.js?raw';

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
  title: 'Engine/Shell/Windowing/CardSessionHost',
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
