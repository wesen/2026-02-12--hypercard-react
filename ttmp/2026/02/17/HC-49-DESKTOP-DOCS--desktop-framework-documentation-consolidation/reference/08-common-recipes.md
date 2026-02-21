---
Title: Common Recipes
Ticket: HC-49-DESKTOP-DOCS
Status: active
Topics:
    - frontend
    - architecture
    - windowing
    - design-system
    - cleanup
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/App.tsx
      Note: Source for chat sidebar, debug panel, and contribution patterns
    - Path: apps/todo/src/App.tsx
      Note: Source for minimal desktop app pattern
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Store factory used in all recipes
    - Path: packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Window actions used in recipes
ExternalSources: []
Summary: Copy-paste recipes for common desktop framework tasks — chat panels, debug tools, singleton windows, session navigation, theming, and Storybook stories.
LastUpdated: 2026-02-17T17:30:00.000000000-05:00
WhatFor: Provide ready-to-use code patterns for common desktop framework tasks.
WhenToUse: Use when implementing a specific feature and you want a working starting point.
---

# Common Recipes

Copy-paste patterns for common desktop framework tasks. Each recipe is self-contained — just adapt the imports and names to your app.

## Recipe 1: Add a Chat Panel to Your Desktop App

This is the most common extension: a chat window that opens on startup and can be re-opened from a menu.

### Step 1: Create the Chat Window Component

```tsx
// src/features/chat/ChatWindow.tsx
import { StreamingChatView, useChatStream } from '@hypercard/engine';

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const { messages, isStreaming, send, cancel, reset } = useChatStream({
    // Your custom response matcher (optional)
  });

  return (
    <StreamingChatView
      messages={messages}
      isStreaming={isStreaming}
      onSend={send}
      onCancel={cancel}
      onReset={reset}
      suggestions={['Show inventory', 'Add new item', 'Generate report']}
    />
  );
}
```

### Step 2: Wire the Contribution

```tsx
// src/App.tsx
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { DesktopShell, type DesktopContribution } from '@hypercard/engine/desktop-react';
import { ChatWindow } from './features/chat/ChatWindow';

const CHAT_APP_KEY = 'chat';

function buildChatPayload(dedupeKey?: string): OpenWindowPayload {
  const id = `chat-${Date.now()}`;
  return {
    id: `window:chat:${id}`,
    title: '💬 Chat',
    icon: '💬',
    bounds: { x: 340, y: 20, w: 520, h: 440 },
    content: { kind: 'app', appKey: `${CHAT_APP_KEY}:${id}` },
    dedupeKey: dedupeKey ?? `chat:${id}`,
  };
}

const chatContribution: DesktopContribution = {
  id: 'my-app.chat',
  icons: [{ id: 'new-chat', label: 'New Chat', icon: '💬' }],
  menus: [{
    id: 'file',
    label: 'File',
    items: [{ id: 'new-chat', label: 'New Chat', commandId: 'chat.new', shortcut: 'Ctrl+N' }],
  }],
  commands: [{
    id: 'chat.new',
    priority: 100,
    matches: (cmd) => cmd === 'chat.new' || cmd === 'icon.open.new-chat',
    run: (_, ctx) => { ctx.dispatch(openWindow(buildChatPayload())); return 'handled'; },
  }],
  startupWindows: [{
    id: 'startup.chat',
    create: () => buildChatPayload('chat:startup'),
  }],
};

export function App() {
  const renderAppWindow = (appKey: string) => {
    if (appKey.startsWith(`${CHAT_APP_KEY}:`)) {
      const convId = appKey.slice(CHAT_APP_KEY.length + 1);
      return <ChatWindow conversationId={convId} />;
    }
    return null;
  };

  return (
    <DesktopShell
      stack={STACK}
      contributions={[chatContribution]}
      renderAppWindow={renderAppWindow}
    />
  );
}
```

### What This Gives You

- A chat window opens automatically on startup
- "New Chat" in the File menu opens a fresh conversation
- Double-clicking the 💬 icon opens a new chat
- Each conversation gets a unique ID for isolation

## Recipe 2: Add a Dev-Only Debug Panel

Show a debug/performance panel that only appears in development builds.

```tsx
// src/App.tsx
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { DesktopContribution } from '@hypercard/engine/desktop-react';

const debugContribution: DesktopContribution = {
  id: 'my-app.debug',
  // Only add debug icons/menus in dev mode
  icons: import.meta.env.DEV ? [{ id: 'redux-perf', label: 'Redux Perf', icon: '📈' }] : [],
  menus: import.meta.env.DEV ? [{
    id: 'debug',
    label: 'Debug',
    items: [
      { id: 'redux-perf', label: '📈 Redux Perf', commandId: 'debug.redux-perf' },
    ],
  }] : [],
  commands: import.meta.env.DEV ? [{
    id: 'debug.redux-perf',
    priority: 100,
    matches: (cmd) => cmd === 'debug.redux-perf' || cmd === 'icon.open.redux-perf',
    run: (_, ctx) => {
      ctx.dispatch(openWindow({
        id: 'window:redux-perf',
        title: '📈 Redux Perf',
        icon: '📈',
        bounds: { x: 900, y: 40, w: 420, h: 320 },
        content: { kind: 'app', appKey: 'redux-perf' },
        dedupeKey: 'redux-perf',  // singleton
      }));
      return 'handled';
    },
  }] : [],
  // Auto-open in dev mode
  startupWindows: import.meta.env.DEV ? [{
    id: 'startup.redux-perf',
    create: () => ({
      id: 'window:redux-perf',
      title: '📈 Redux Perf',
      icon: '📈',
      bounds: { x: 900, y: 40, w: 420, h: 320 },
      content: { kind: 'app', appKey: 'redux-perf' },
      dedupeKey: 'redux-perf',
    }),
  }] : [],
};
```

In your `renderAppWindow`:

```tsx
if (appKey === 'redux-perf') return <ReduxPerfWindow />;
```

The `import.meta.env.DEV` checks are tree-shaken in production builds — the debug code won't exist in the final bundle.

## Recipe 3: Open a Singleton Window from Anywhere

Use `dedupeKey` to ensure only one instance of a window exists, regardless of how many times you try to open it:

```ts
import { openWindow } from '@hypercard/engine/desktop-core';
import { useDispatch } from 'react-redux';

function useOpenSettings() {
  const dispatch = useDispatch();

  return () => {
    dispatch(openWindow({
      id: 'window:settings',           // stable ID
      title: '⚙️ Settings',
      icon: '⚙️',
      bounds: { x: 200, y: 50, w: 400, h: 300 },
      content: { kind: 'app', appKey: 'settings' },
      dedupeKey: 'settings',            // ← this prevents duplicates
    }));
  };
}
```

**How dedupe works:** When `openWindow` is dispatched with a `dedupeKey`, the reducer checks if any existing window has the same `dedupeKey`. If found, it focuses that window (bumps z-order) instead of creating a new one. If not found, it creates the window normally.

You can call this hook from any component, button handler, or command handler — the window is guaranteed to be a singleton.

## Recipe 4: Navigate Between Cards Inside a Window

Each card window has its own navigation stack. Cards can navigate forward and back without affecting other windows:

```ts
import { sessionNavGo, sessionNavBack, sessionNavHome } from '@hypercard/engine/desktop-core';

// Navigate to a detail card (pushes onto nav stack)
dispatch(sessionNavGo({
  sessionId: 'session-1',
  card: 'item-detail',
  param: 'item-42',
}));

// Go back one step
dispatch(sessionNavBack({ sessionId: 'session-1' }));

// Go all the way back to the first card
dispatch(sessionNavHome({ sessionId: 'session-1' }));
```

To read the current navigation state:

```ts
import { selectSessionCurrentNav, selectSessionNavDepth } from '@hypercard/engine/desktop-core';

// Current card and param
const nav = useSelector((s) => selectSessionCurrentNav(s, 'session-1'));
// nav = { card: 'item-detail', param: 'item-42' }

// How deep the nav stack is
const depth = useSelector((s) => selectSessionNavDepth(s, 'session-1'));
// depth = 2 (home + detail)
```

**How sessions relate to windows:** When you open a card window, the `openWindow` reducer automatically creates a session with a navigation stack. The session ID is embedded in the window's `content.card.cardSessionId` field. Each window's card adapter reads from its own session — so navigating in one window doesn't affect others.

## Recipe 5: Create a Quick Custom Theme

Override the five most impactful variables for an instant retheme:

```css
/* src/theme/dark.css */
[data-widget="hypercard"] {
  --hc-color-desktop-bg: #1a1a2e;
  --hc-color-bg: #16213e;
  --hc-color-fg: #e0e8f0;
  --hc-color-accent: #00bcd4;
  --hc-font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

/* Focused window gets a glow */
[data-widget="hypercard"] [data-part="windowing-window"][data-focused="true"] {
  box-shadow: 0 0 20px rgba(0, 188, 212, 0.3);
}

/* Title bar matches the accent */
[data-widget="hypercard"] [data-part="windowing-window-title-bar"] {
  background: linear-gradient(135deg, #0f3460, #16213e);
}
```

Import it after the base theme:

```ts
// src/main.tsx
import '@hypercard/engine/theme';
import './theme/dark.css';
```

## Recipe 6: Write a Storybook Story for Your Desktop App

Use `createStoryHelpers` for card-page stories with a store decorator:

```tsx
// src/app/stories/MyApp.stories.tsx
import { createStoryHelpers } from '@hypercard/engine';
import { STACK } from '../domain/stack';
import { sharedSelectors, sharedActions } from '../domain/cardRuntime';
import { createMyStore } from '../app/store';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  stack: STACK,
  sharedSelectors,
  sharedActions,
  createStore: createMyStore,
  navShortcuts: [
    { card: 'home', icon: '🏠' },
    { card: 'contacts', icon: '👤' },
    { card: 'settings', icon: '⚙️' },
  ],
  cardParams: {
    contactDetail: 'contact-1',  // default param for the contactDetail card
  },
  snapshotSelector: (state) => ({
    contacts: state.contacts,
  }),
});

// IMPORTANT: meta and export default must be inline (Storybook CSF parser requirement)
const meta = {
  title: 'Apps/MyApp',
  component: FullApp,
  decorators: [storeDecorator],
};
export default meta;

// One story per card
export const Home = createStory('home');
export const Contacts = createStory('contacts');
export const ContactDetail = createStory('contactDetail');
export const Settings = createStory('settings');
```

For desktop shell stories (showing the full windowed environment), render `DesktopShell` directly in a story with a Redux provider:

```tsx
// src/app/stories/DesktopShell.stories.tsx
import { Provider } from 'react-redux';
import { DesktopShell } from '@hypercard/engine/desktop-react';
import { createMyStore } from '../app/store';
import { STACK } from '../domain/stack';

const meta = { title: 'Apps/MyApp/DesktopShell' };
export default meta;

export const Default = {
  render: () => {
    const store = createMyStore();
    return (
      <Provider store={store}>
        <div style={{ width: '100vw', height: '100vh' }}>
          <DesktopShell stack={STACK} />
        </div>
      </Provider>
    );
  },
};
```

## Recipe 7: Compose Multiple Contribution Bundles

When your app grows, split contributions by feature:

```tsx
// src/contributions/chatContribution.ts
export const chatContribution: DesktopContribution = {
  id: 'my-app.chat',
  icons: [{ id: 'new-chat', label: 'Chat', icon: '💬' }],
  commands: [/* chat commands */],
  startupWindows: [/* chat startup */],
};

// src/contributions/debugContribution.ts
export const debugContribution: DesktopContribution = {
  id: 'my-app.debug',
  menus: [/* debug menu */],
  commands: [/* debug commands */],
};

// src/App.tsx
import { chatContribution } from './contributions/chatContribution';
import { debugContribution } from './contributions/debugContribution';

<DesktopShell
  stack={STACK}
  contributions={[chatContribution, debugContribution]}
  renderAppWindow={renderAppWindow}
/>
```

The shell merges all contributions:
- Menus from both bundles are merged by section `id`
- Icons are deduplicated
- Commands are sorted by priority across all bundles
- Adapters and startup windows are concatenated

This keeps each feature's desktop integration self-contained and testable.

## Recipe Index

| # | Recipe | Key Concept |
|---|--------|-------------|
| 1 | [Chat panel](#recipe-1-add-a-chat-panel-to-your-desktop-app) | Contributions + startup windows + renderAppWindow |
| 2 | [Dev-only debug panel](#recipe-2-add-a-dev-only-debug-panel) | Conditional contributions with `import.meta.env.DEV` |
| 3 | [Singleton window](#recipe-3-open-a-singleton-window-from-anywhere) | `dedupeKey` for window uniqueness |
| 4 | [Card navigation](#recipe-4-navigate-between-cards-inside-a-window) | Session nav actions and selectors |
| 5 | [Custom theme](#recipe-5-create-a-quick-custom-theme) | CSS variable overrides + data-part selectors |
| 6 | [Storybook stories](#recipe-6-write-a-storybook-story-for-your-desktop-app) | `createStoryHelpers` + desktop shell stories |
| 7 | [Multiple contributions](#recipe-7-compose-multiple-contribution-bundles) | Contribution composition across features |

## Related Docs

| Topic | Link |
|-------|------|
| Getting started | [Quickstart](./02-desktop-framework-quickstart.md) |
| Extension API details | [Contribution API Reference](./03-desktop-contribution-api-reference.md) |
| Custom window rendering | [Window Content Adapter Guide](./04-window-content-adapter-guide.md) |
| Theming and CSS | [Theming and Parts Contract](./05-theming-and-parts-contract.md) |
| Performance patterns | [Performance Model](./06-performance-model-durable-vs-ephemeral-lanes.md) |
