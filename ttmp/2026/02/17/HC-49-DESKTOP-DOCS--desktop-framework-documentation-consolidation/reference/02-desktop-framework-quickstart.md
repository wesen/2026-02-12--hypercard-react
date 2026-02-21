---
Title: Desktop Framework Quickstart
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
      Note: Full-featured desktop app with contributions
    - Path: apps/todo/src/App.tsx
      Note: Minimal desktop app — 3 lines
    - Path: apps/inventory/src/main.tsx
      Note: App entrypoint with theme import
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Store bootstrap factory
    - Path: packages/engine/src/desktop-core.ts
      Note: Window action imports
    - Path: packages/engine/src/desktop-react.ts
      Note: Desktop shell component imports
ExternalSources: []
Summary: Step-by-step guide to get a working desktop shell running, from zero to custom windows.
LastUpdated: 2026-02-17T17:30:00.000000000-05:00
WhatFor: Provide a copy/paste setup path for new apps using desktop-core + desktop-react + theme imports.
WhenToUse: Use when creating or refactoring an app to the current desktop framework API.
---

# Desktop Framework Quickstart

This guide walks you through getting a working desktop shell up and running. By the end, you'll have a menu bar, desktop icons, draggable windows, and your first card rendered inside a window — all in about 30 lines of code.

**Prerequisites:** A working React 19 + Redux Toolkit project in this monorepo. If you're starting from scratch, copy one of the existing apps (like `apps/todo`) as a template.

## What You'll Build

```
┌─────────────────────────────────────────────────────────┐
│  File │ Cards │ Window │                     (Menu Bar) │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📦 Home    📋 Items                                    │
│  📊 Reports 💬 Chat         (Desktop Icons)             │
│                                                         │
│     ┌── 🏠 Home ────────────────┐                       │
│     │                           │   ← Draggable window  │
│     │  [Your card content]      │                       │
│     │                           │                       │
│     │                       ◢   │   ← Resize handle     │
│     └───────────────────────────┘                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## The Shortest Path: 3 Lines

The simplest possible desktop app is the Todo app. Here's the entirety of its `App.tsx`:

```tsx
// apps/todo/src/App.tsx
import { DesktopShell } from '@hypercard/engine/desktop-react';
import { STACK } from './domain/stack';

export function App() {
  return <DesktopShell stack={STACK} />;
}
```

That's it. The shell auto-generates menus from your stack's cards, creates icons for each card, and opens a home card window on mount. But to get there, you need the supporting setup. Let's walk through each piece.

## Step 1: Import the Theme

The engine ships styles as modular CSS packs. This single import loads base tokens (colors, fonts, spacing), shell chrome (menu bar, windows), widget styles (buttons, tables), and animations. **Without it, your desktop renders as unstyled HTML.**

```ts
// src/main.tsx
import '@hypercard/engine/theme';
```

Want a different look? Add an optional theme layer on top:

```ts
import '@hypercard/engine/theme';
import '@hypercard/engine/desktop-theme-macos1';  // macOS-inspired chrome
```

The base import is always required. Theme layers are additive — they override specific tokens without replacing the base styles.

## Step 2: Create the Store

The engine pre-wires Redux slices for windowing (open/close/move/resize windows), navigation, notifications, and diagnostics. You pass in your domain reducers and get back a fully configured store.

```ts
// src/app/store.ts
import { createAppStore } from '@hypercard/engine';
import { inventoryReducer } from '../features/inventory/inventorySlice';

export const { store, createStore } = createAppStore(
  { inventory: inventoryReducer },
  {
    enableReduxDiagnostics: import.meta.env.DEV,  // optional: performance tracking
    diagnosticsWindowMs: 5000,
  },
);
```

`createAppStore` wires up:
- **`windowingReducer`** — window lifecycle, geometry, focus, z-ordering, per-session navigation
- **`navigationReducer`** — card navigation state (for non-windowed shell mode)
- **`notificationsReducer`** — toast notifications
- **`debugReducer`** — debug event log and state inspector
- **`pluginCardRuntimeReducer`** — plugin card sandbox state
- Your domain reducers (whatever you pass in)

You don't need to import or configure any of these — they're included automatically.

## Step 3: Mount the App

Standard React mount with a Redux Provider. Nothing special here — the key detail is that the theme import in Step 1 must happen before any components render.

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './App';
import { store } from './app/store';

import '@hypercard/engine/theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
```

## Step 4: Render the Desktop Shell

`DesktopShell` is the main entry point. It takes a card stack definition and renders the full desktop environment: menu bar, icon layer, and window layer.

```tsx
// src/App.tsx
import { DesktopShell } from '@hypercard/engine/desktop-react';
import type { CardStackDefinition } from '@hypercard/engine';

const STACK: CardStackDefinition = {
  id: 'my-app',
  name: 'My App',
  icon: '📱',
  homeCard: 'home',
  cards: {
    home: {
      id: 'home',
      type: 'menu',
      title: 'Home',
      icon: '🏠',
      ui: { t: 'text', value: 'Welcome to My App' },
    },
    settings: {
      id: 'settings',
      type: 'detail',
      title: 'Settings',
      icon: '⚙️',
      ui: { t: 'text', value: 'Settings page' },
    },
  },
};

export function App() {
  return <DesktopShell stack={STACK} />;
}
```

At this point you have a working desktop. The shell automatically:

- **Generated a menu bar** — File (New Home Window, Close Window), Cards (🏠 Home, ⚙️ Settings), Window (Tile, Cascade)
- **Generated desktop icons** — one for each card in the stack
- **Opened a Home window** — auto-opened on mount with dedupe protection
- **Enabled window interactions** — drag title bars to move, drag corners to resize, click to focus, close button to close

## Step 5: Open Non-Card Windows from Code

Cards open automatically when you double-click their icons. But what about custom windows like a chat panel or debug tool? You dispatch `openWindow` from `desktop-core`:

```ts
import { openWindow } from '@hypercard/engine/desktop-core';
import { useDispatch } from 'react-redux';

function MyComponent() {
  const dispatch = useDispatch();

  const openChat = () => {
    dispatch(openWindow({
      id: 'window:chat:1',
      title: '💬 Chat',
      icon: '💬',
      bounds: { x: 300, y: 40, w: 520, h: 440 },
      content: { kind: 'app', appKey: 'chat:1' },
      dedupeKey: 'chat:1',  // prevents duplicate windows
    }));
  };

  return <button onClick={openChat}>Open Chat</button>;
}
```

The `content` field determines what renders inside the window:

| `content.kind` | What it does | How to render it |
|-----------------|-------------|------------------|
| `'card'` | Opens a HyperCard card with its own session/navigation | Handled automatically by built-in adapter |
| `'app'` | Opens a custom React component | You provide `renderAppWindow` |
| `'dialog'` | Opens a custom dialog | You write a window content adapter |

The `dedupeKey` is important: if you dispatch `openWindow` with a `dedupeKey` that already exists, the shell focuses the existing window instead of creating a duplicate.

## Step 6: Provide `renderAppWindow` for App-Kind Windows

When a window has `content.kind === 'app'`, the shell needs to know what React component to render inside it. You tell it via the `renderAppWindow` prop:

```tsx
// src/App.tsx
import { DesktopShell } from '@hypercard/engine/desktop-react';
import { ChatWindow } from './features/chat/ChatWindow';
import { DebugPanel } from './features/debug/DebugPanel';

export function App() {
  const renderAppWindow = (appKey: string) => {
    if (appKey.startsWith('chat:')) return <ChatWindow id={appKey} />;
    if (appKey === 'debug')         return <DebugPanel />;
    return null;  // fallback adapter will handle it
  };

  return (
    <DesktopShell
      stack={STACK}
      renderAppWindow={renderAppWindow}
    />
  );
}
```

The `appKey` is the string you set in `content.appKey` when calling `openWindow`. A common pattern is to encode an ID in the key (like `chat:conv-123`) and parse it in the render function.

## What Just Happened?

If you've followed steps 1–6, here's a summary of the automatic behaviors now running:

- **Window management** — The `windowingReducer` in Redux tracks every window's position, size, z-index, and focus state. Windows are draggable, resizable, and focusable out of the box.
- **Default menus** — Generated from your `stack.cards`. The File menu has New Home Window and Close Window; the Cards menu lists all cards; the Window menu has Tile and Cascade.
- **Default icons** — One per card, using the card's `icon` and `title` properties.
- **Home window** — Opened once on mount, with a `dedupeKey` matching the home card ID so it won't duplicate.
- **Session navigation** — Each card window gets its own navigation stack. Cards can `nav.go` and `nav.back` within their window without affecting other windows.
- **Adapter chain** — Window bodies are rendered through a chain: contribution adapters → app adapter → card adapter → fallback. You don't need to touch this unless you add custom content kinds.

## Going Further: Contributions

The minimal setup generates defaults for everything. When you need custom menus, icons, commands, or startup windows, you use *contributions* — declarative extension bundles that the shell composes together:

```tsx
<DesktopShell
  stack={STACK}
  contributions={[myContribution]}
  renderAppWindow={renderAppWindow}
/>
```

See the [Contribution API Reference](./03-desktop-contribution-api-reference.md) for the full guide.

## Minimal Wiring Checklist

| Step | What | Why |
|------|------|-----|
| ✅ | `import '@hypercard/engine/theme'` in `main.tsx` | Loads all base styles |
| ✅ | `createAppStore({ ...domainReducers })` in `store.ts` | Pre-wires engine Redux slices |
| ✅ | `<Provider store={store}>` wrapping `<App>` | Standard Redux setup |
| ✅ | `<DesktopShell stack={STACK} />` in `App.tsx` | Renders the desktop environment |
| ☐ | `renderAppWindow` prop (if using app-kind windows) | Maps `appKey` to React components |
| ☐ | `contributions` prop (if customizing menus/icons/commands) | Extension bundles |
| ☐ | Optional theme layer import (e.g., `desktop-theme-macos1`) | Visual customization |

## Next Steps

| I want to... | Read this |
|--------------|-----------|
| Customize menus, icons, and commands | [Contribution API Reference](./03-desktop-contribution-api-reference.md) |
| Render custom window types (dialogs, embeds) | [Window Content Adapter Guide](./04-window-content-adapter-guide.md) |
| Change colors, fonts, and styles | [Theming and Parts Contract](./05-theming-and-parts-contract.md) |
| Understand the performance architecture | [Performance Model](./06-performance-model-durable-vs-ephemeral-lanes.md) |
| See the full component tree and data flow | [Architecture Overview](./07-desktop-framework-architecture-overview.md) |
| Copy-paste common patterns | [Common Recipes](./08-common-recipes.md) |
