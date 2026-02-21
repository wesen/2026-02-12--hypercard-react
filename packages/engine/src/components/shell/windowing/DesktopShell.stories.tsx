import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppStore } from '../../../app/createAppStore';
import type { CardDefinition, CardStackDefinition } from '../../../cards/types';
import DEMO_PLUGIN_BUNDLE from './DesktopShell.demo.vm.js?raw';
import { DesktopShell, type DesktopShellProps } from './DesktopShell';
import type { DesktopIconDef } from './types';

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

const DEMO_CARD_META: PluginCardMeta[] = [
  { id: 'home', title: 'Home', icon: '🏠' },
  { id: 'browse', title: 'Browse Items', icon: '📋' },
  { id: 'report', title: 'Reports', icon: '📊' },
  { id: 'chat', title: 'Assistant', icon: '💬' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
];

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

const DEMO_STACK: CardStackDefinition = {
  id: 'demo',
  name: 'Demo App',
  icon: '🖥️',
  homeCard: 'home',
  plugin: {
    bundleCode: DEMO_PLUGIN_BUNDLE,
    capabilities: {
      system: ['nav.go', 'nav.back', 'notify'],
    },
  },
  cards: Object.fromEntries(DEMO_CARD_META.map((card) => [card.id, toPluginCard(card)])),
};

const CUSTOM_ICONS: DesktopIconDef[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'browse', label: 'Browse', icon: '📋' },
  { id: 'report', label: 'Reports', icon: '📊' },
  { id: 'chat', label: 'Assistant', icon: '💬' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const { createStore } = createAppStore({});

function DesktopShellStory(props: DesktopShellProps) {
  const store = createStore();
  return (
    <Provider store={store}>
      <DesktopShell {...props} />
    </Provider>
  );
}

const meta = {
  title: 'Engine/Shell/Windowing/DesktopShell',
  component: DesktopShellStory,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DesktopShellStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    stack: DEMO_STACK,
  },
};

export const WithCustomIcons: Story = {
  args: {
    stack: DEMO_STACK,
    icons: CUSTOM_ICONS,
  },
};

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
