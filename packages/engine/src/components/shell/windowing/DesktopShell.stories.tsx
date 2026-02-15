import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { Act, defineCardStack, ui } from '../../../cards/helpers';
import { hypercardRuntimeReducer } from '../../../cards/runtimeStateSlice';
import type { CardStackDefinition } from '../../../cards/types';
import { notificationsReducer } from '../../../features/notifications/notificationsSlice';
import { windowingReducer } from '../../../features/windowing/windowingSlice';
import { DesktopShell, type DesktopShellProps } from './DesktopShell';
import type { DesktopIconDef } from './types';

// ── Demo card stack ──

const DEMO_STACK: CardStackDefinition = defineCardStack({
  id: 'demo',
  name: 'Demo App',
  icon: '🖥️',
  homeCard: 'home',
  cards: {
    home: {
      id: 'home',
      type: 'menu',
      title: 'Home',
      icon: '🏠',
      ui: ui.menu({
        icon: '🖥️',
        labels: [{ value: 'Demo Desktop App' }],
        buttons: [
          { label: '📋 Browse Items', action: Act('nav.go', { card: 'browse' }) },
          { label: '📊 Reports', action: Act('nav.go', { card: 'report' }) },
          { label: '💬 Chat', action: Act('nav.go', { card: 'chat' }) },
          { label: '⚙️ Settings', action: Act('nav.go', { card: 'settings' }) },
        ],
      }),
    },
    browse: {
      id: 'browse',
      type: 'list',
      title: 'Browse Items',
      icon: '📋',
      ui: ui.screen({
        header: ui.toolbar({
          left: [ui.text('Browse Items')],
          right: ui.text('3 items'),
        }),
        body: [
          ui.list({
            items: [
              { id: '1', name: 'Widget A', category: 'Widgets', price: '$12.00' },
              { id: '2', name: 'Gadget B', category: 'Gadgets', price: '$25.50' },
              { id: '3', name: 'Doohickey C', category: 'Parts', price: '$8.75' },
            ],
            columns: [
              { id: 'name', label: 'Name' },
              { id: 'category', label: 'Category' },
              { id: 'price', label: 'Price' },
            ],
            rowKey: 'id',
            emptyMessage: 'No items found',
          }),
        ],
      }),
    },
    report: {
      id: 'report',
      type: 'report',
      title: 'Reports',
      icon: '📊',
      ui: ui.screen({
        header: ui.toolbar({
          left: [ui.text('Monthly Report')],
        }),
        body: [
          ui.report({
            sections: [
              {
                title: 'Summary',
                items: [
                  { label: 'Total Items', value: '156' },
                  { label: 'Total Value', value: '$4,230.00' },
                  { label: 'Low Stock', value: '3 items' },
                ],
              },
              {
                title: 'Top Categories',
                items: [
                  { label: 'Widgets', value: '45 items' },
                  { label: 'Gadgets', value: '38 items' },
                  { label: 'Parts', value: '73 items' },
                ],
              },
            ],
          }),
        ],
      }),
    },
    chat: {
      id: 'chat',
      type: 'chat',
      title: 'Assistant',
      icon: '💬',
      ui: ui.screen({
        body: [
          ui.chat({
            key: 'chatView',
            messages: [{ role: 'assistant', content: "Hello! I'm the demo assistant. How can I help you today?" }],
            placeholder: 'Ask me anything…',
            suggestions: ['Show inventory', 'Generate report', 'Low stock alerts'],
          }),
        ],
      }),
    },
    settings: {
      id: 'settings',
      type: 'detail',
      title: 'Settings',
      icon: '⚙️',
      ui: ui.screen({
        header: ui.toolbar({
          left: [ui.text('Settings')],
        }),
        body: [
          ui.detail({
            record: { theme: 'Classic Mac', fontSize: '14px', notifications: 'On' },
            fields: [
              { id: 'theme', label: 'Theme', type: 'readonly' },
              { id: 'fontSize', label: 'Font Size', type: 'readonly' },
              { id: 'notifications', label: 'Notifications', type: 'readonly' },
            ],
          }),
        ],
      }),
    },
  },
});

// ── Custom icon layout ──

const CUSTOM_ICONS: DesktopIconDef[] = [
  { id: 'home', label: 'Home', icon: '🏠', x: 20, y: 16 },
  { id: 'browse', label: 'Browse', icon: '📋', x: 20, y: 104 },
  { id: 'report', label: 'Reports', icon: '📊', x: 20, y: 192 },
  { id: 'chat', label: 'Assistant', icon: '💬', x: 20, y: 280 },
  { id: 'settings', label: 'Settings', icon: '⚙️', x: 20, y: 368 },
];

// ── Store factory ──

function createDemoStore() {
  return configureStore({
    reducer: {
      hypercardRuntime: hypercardRuntimeReducer,
      windowing: windowingReducer,
      notifications: notificationsReducer,
    },
  });
}

// ── Story wrapper ──

function DesktopShellStory(props: DesktopShellProps) {
  const store = createDemoStore();
  return (
    <Provider store={store}>
      <DesktopShell {...props} />
    </Provider>
  );
}

// ── Meta ──

const meta = {
  title: 'Shell/Windowing/Desktop Shell',
  component: DesktopShellStory,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DesktopShellStory>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──

/** Default — auto-generated icons and menus from the card stack */
export const Default: Story = {
  args: {
    stack: DEMO_STACK,
  },
};

/** With custom icon layout */
export const WithCustomIcons: Story = {
  args: {
    stack: DEMO_STACK,
    icons: CUSTOM_ICONS,
  },
};

/** With custom menu sections */
export const WithCustomMenus: Story = {
  args: {
    stack: DEMO_STACK,
    icons: CUSTOM_ICONS,
    menus: [
      {
        id: 'file',
        label: 'File',
        items: [
          { id: 'new', label: 'New Window', commandId: 'window.open.home', shortcut: 'Ctrl+N' },
          { id: 'close', label: 'Close', commandId: 'window.close-focused', shortcut: 'Ctrl+W' },
        ],
      },
      {
        id: 'cards',
        label: 'Cards',
        items: [
          { id: 'home', label: '🏠 Home', commandId: 'window.open.card.home' },
          { id: 'browse', label: '📋 Browse', commandId: 'window.open.card.browse' },
          { separator: true },
          { id: 'report', label: '📊 Reports', commandId: 'window.open.card.report' },
          { id: 'chat', label: '💬 Assistant', commandId: 'window.open.card.chat' },
          { separator: true },
          { id: 'settings', label: '⚙️ Settings', commandId: 'window.open.card.settings' },
        ],
      },
      {
        id: 'window',
        label: 'Window',
        items: [
          { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
          { id: 'cascade', label: 'Cascade', commandId: 'window.cascade' },
        ],
      },
    ],
  },
};
