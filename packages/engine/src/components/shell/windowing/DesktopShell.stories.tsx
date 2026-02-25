import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import type { ReactNode } from 'react';
import { createAppStore } from '../../../app/createAppStore';
import type { CardDefinition, CardStackDefinition } from '../../../cards/types';
import DEMO_PLUGIN_BUNDLE from './DesktopShell.demo.vm.js?raw';
import type { DesktopContribution } from './desktopContributions';
import { useRegisterWindowContextActions, useRegisterWindowMenuSections } from './desktopMenuRuntime';
import { DesktopShell, type DesktopShellProps } from './DesktopShell';
import type { DesktopActionEntry, DesktopActionSection, DesktopIconDef } from './types';

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

const RUNTIME_MENU_SECTIONS: DesktopActionSection[] = [
  {
    id: 'chat',
    label: 'Chat',
    merge: 'replace',
    items: [
      { id: 'runtime-chat-new', label: 'New Chat', commandId: 'runtime.chat.new', shortcut: 'Ctrl+N' },
      { id: 'runtime-chat-events', label: 'Event Viewer', commandId: 'runtime.chat.event-viewer' },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    merge: 'replace',
    items: [
      { id: 'runtime-profile-default', label: 'Default Agent', commandId: 'runtime.profile.default', checked: true },
      { id: 'runtime-profile-safe', label: 'Safety Agent', commandId: 'runtime.profile.safety' },
    ],
  },
];

const RUNTIME_CONTEXT_ACTIONS: DesktopActionEntry[] = [
  {
    id: 'runtime-context-inspect-widget',
    label: 'Inspect Widget',
    commandId: 'runtime.widget.inspect',
    payload: { target: 'widget:timeline' },
  },
  {
    id: 'runtime-context-open-debug',
    label: 'Open Timeline Debug',
    commandId: 'runtime.widget.timeline',
  },
];

const RUNTIME_STORY_CONTRIBUTIONS: DesktopContribution[] = [
  {
    id: 'runtime-story-startup',
    startupWindows: [
      {
        id: 'runtime-story-window',
        create: () => ({
          id: 'window:story:runtime',
          title: 'Runtime Tools',
          icon: '🧪',
          bounds: { x: 720, y: 64, w: 520, h: 360 },
          content: {
            kind: 'app',
            appKey: 'story.runtime:tools',
          },
          dedupeKey: 'story-runtime-tools',
        }),
      },
    ],
  },
];

function RuntimeToolsWindow(): ReactNode {
  useRegisterWindowMenuSections(RUNTIME_MENU_SECTIONS);
  useRegisterWindowContextActions(RUNTIME_CONTEXT_ACTIONS);
  return (
    <section style={{ padding: 12, display: 'grid', gap: 8 }}>
      <strong>Runtime Tools</strong>
      <span>Focus this window to see Chat/Profile sections in the top menu bar.</span>
      <span>Right-click the title bar to view context actions contributed by this window.</span>
    </section>
  );
}

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

export const WithFocusedRuntimeMenus: Story = {
  args: {
    stack: DEMO_STACK,
    icons: CUSTOM_ICONS,
    contributions: RUNTIME_STORY_CONTRIBUTIONS,
    renderAppWindow: (appKey) => (appKey === 'story.runtime:tools' ? <RuntimeToolsWindow /> : null),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Focused runtime window registers dynamic Chat/Profile menubar sections. Focus Runtime Tools to see sections appear.',
      },
    },
  },
};

export const WithTitleBarContextMenuActions: Story = {
  args: {
    stack: DEMO_STACK,
    icons: CUSTOM_ICONS,
    contributions: RUNTIME_STORY_CONTRIBUTIONS,
    renderAppWindow: (appKey) => (appKey === 'story.runtime:tools' ? <RuntimeToolsWindow /> : null),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Right-click Runtime Tools title bar to open a shell context menu that includes app-registered actions.',
      },
    },
  },
};

export const WithIconQuickActionsContextMenu: Story = {
  args: {
    stack: DEMO_STACK,
    icons: CUSTOM_ICONS,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Right-click desktop icons to open quick actions (`Open`, `Open New`, `Pin`, `Inspect`) routed through desktop command handling.',
      },
    },
  },
};
