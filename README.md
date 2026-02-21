# HyperCard React — DSL-Driven Desktop Application Framework

A card-based application framework built with React 19, Redux Toolkit, Storybook 10, and Vite. You define apps as **card stacks** using a DSL — each card declares its UI, data bindings, selectors, and actions — and the framework renders everything inside a **windowed desktop environment** with a menu bar, desktop icons, draggable/resizable windows, and theming support.

```
┌─────────────────────────────────────────────────────────┐
│  File │ Cards │ Window │ Debug │              (Menu Bar) │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📦 Home    📋 Items    💬 Chat                         │
│  📊 Reports 🔧 Debug                (Desktop Icons)     │
│                                                         │
│   ┌── 🏠 Home ──────────────┐  ┌── 💬 Chat ──────────┐ │
│   │                         │  │                      │ │
│   │  [Card content]         │  │  [Streaming chat]    │ │
│   │                         │  │                      │ │
│   └─────────────────────────┘  └──────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
npm install
npm run dev          # Vite dev server (apps/inventory on localhost:5173)
npm run storybook    # Storybook dev server (all apps + engine widgets)
npm run build        # Production build (engine + all 4 apps)
npm run typecheck    # TypeScript project-references check
npm run lint         # Biome lint/format check
npm run test         # Vitest runtime tests + Storybook taxonomy check
```

## Architecture

The project is a monorepo with one shared engine package and four example apps:

```
packages/engine/          ← @hypercard/engine — shared framework (zero domain knowledge)
  src/
    app/                  ← createAppStore, createDSLApp, createStoryHelpers
    cards/                ← DSL type system, runtime execution, scoped state
    chat/                 ← Streaming chat system (slice, API client, fake stream)
    components/
      shell/windowing/    ← Desktop shell: DesktopShell, windows, menus, icons, adapters
      widgets/            ← 13 generic widgets (DataTable, ListView, FormView, ...)
    debug/                ← Debug slice + StandardDebugPane
    desktop/              ← Desktop state (core) and shell (react) subpath barrels
    diagnostics/          ← Redux perf middleware, frame monitor, ring buffers
    features/             ← RTK slices (navigation, notifications, plugin card runtime)
    plugin-runtime/       ← Plugin card sandbox, intent routing, UI schema
    theme/                ← CSS custom properties, theme packs, HyperCardTheme wrapper
    parts.ts              ← Stable data-part name registry for CSS targeting

apps/
  inventory/              ← Full-featured app: inventory + sales + streaming chat + debug
  todo/                   ← Minimal app (simplest possible desktop shell usage)
  crm/                    ← CRM: contacts, companies, deals, activities
  book-tracker-debug/     ← Book tracker with debug pane

go-inventory-chat/        ← Go backend for inventory chat (Glazed + Pinocchio webchat)

tooling/vite/             ← Shared Vite config helper (createHypercardViteConfig)
scripts/storybook/        ← Storybook taxonomy enforcement (check-taxonomy.mjs)
.storybook/               ← Global Storybook config (stories from all apps + engine)
```

### Import Map

The engine uses subpath imports to keep the API organized:

| Import | What You Get |
|--------|-------------|
| `@hypercard/engine` | DSL types, widgets, store utilities, chat, debug, diagnostics, parts |
| `@hypercard/engine/desktop-react` | `DesktopShell`, contributions, adapters, window components |
| `@hypercard/engine/desktop-core` | Redux actions (`openWindow`, etc.), selectors, state types |
| `@hypercard/engine/theme` | Base CSS packs (tokens, shell, primitives, chat, syntax, animations) |
| `@hypercard/engine/desktop-theme-macos1` | Optional macOS-inspired theme layer |
| `@hypercard/engine/desktop-hypercard-adapter` | Card rendering adapter for custom adapter chains |

## Creating an App

### The Minimal Path (3 lines)

The simplest desktop app is the Todo app:

```tsx
// apps/todo/src/App.tsx
import { DesktopShell } from '@hypercard/engine/desktop-react';
import { STACK } from './domain/stack';

export function App() {
  return <DesktopShell stack={STACK} />;
}
```

The shell auto-generates menus from your cards, creates desktop icons, and opens a home card window. That's a working desktop environment.

### The Full Setup

For a real app, you need four pieces: a store, a card stack, the shell, and a theme import.

**1. Import the theme** (required — without it, the shell renders unstyled):

```ts
// src/main.tsx
import '@hypercard/engine/theme';
```

**2. Create the store** with your domain reducers:

```ts
// src/app/store.ts
import { createAppStore } from '@hypercard/engine';
import { contactsReducer } from '../features/contacts/contactsSlice';

export const { store, createStore } = createAppStore(
  { contacts: contactsReducer },
  { enableReduxDiagnostics: import.meta.env.DEV },
);
```

`createAppStore` pre-wires engine slices (windowing, navigation, notifications, debug, plugin runtime) alongside your domain reducers.

**3. Define a card stack** — each card declares its UI, data bindings, and actions:

```ts
// src/domain/stack.ts
import { ui, Sel, Act, Ev, type CardStackDefinition } from '@hypercard/engine';

export const STACK: CardStackDefinition = {
  id: 'myapp',
  name: 'My App',
  icon: '📱',
  homeCard: 'home',
  cards: {
    home: {
      id: 'home',
      type: 'menu',
      title: 'Home',
      icon: '🏠',
      ui: ui.menu({
        items: [
          { id: 'contacts', label: 'Contacts', icon: '👤', action: Act('nav.go', { card: 'contacts' }) },
        ],
      }),
    },
    contacts: {
      id: 'contacts',
      type: 'list',
      title: 'Contacts',
      icon: '👤',
      ui: ui.list({
        items: Sel('allContacts', 'shared'),
        columns: [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }],
      }),
      bindings: {
        list: { select: Act('nav.go', { card: 'detail', param: Ev('id') }) },
      },
    },
  },
};
```

**4. Render the desktop shell:**

```tsx
// src/App.tsx
import { DesktopShell } from '@hypercard/engine/desktop-react';
import { STACK } from './domain/stack';

export function App() {
  return <DesktopShell stack={STACK} />;
}
```

### Bridging Domain State to Cards

Cards access your Redux state through shared selectors and actions:

```ts
import type { SharedSelectorRegistry, SharedActionRegistry } from '@hypercard/engine';

export const sharedSelectors: SharedSelectorRegistry<RootState> = {
  allContacts: (state) => state.contacts.items,
  currentContact: (state, args) => state.contacts.items.find(c => c.id === args?.id),
};

export const sharedActions: SharedActionRegistry<RootState> = {
  'contact.create': (ctx, args) => { ctx.dispatch(addContact(args)); },
  'contact.update': (ctx, args) => { ctx.dispatch(updateContact(args)); },
};
```

## Desktop Shell Features

### Contributions (Extension Bundles)

Customize the shell without forking it. Contributions let you add menus, icons, commands, adapters, and startup windows declaratively:

```tsx
import { openWindow } from '@hypercard/engine/desktop-core';
import { DesktopShell, type DesktopContribution } from '@hypercard/engine/desktop-react';

const chatContribution: DesktopContribution = {
  id: 'myapp.chat',
  icons: [{ id: 'new-chat', label: 'Chat', icon: '💬' }],
  menus: [{
    id: 'file', label: 'File',
    items: [{ id: 'new-chat', label: 'New Chat', commandId: 'chat.new' }],
  }],
  commands: [{
    id: 'chat.new', priority: 100,
    matches: (cmd) => cmd === 'chat.new' || cmd === 'icon.open.new-chat',
    run: (_, ctx) => {
      ctx.dispatch(openWindow({
        id: `window:chat:${Date.now()}`,
        title: '💬 Chat',
        icon: '💬',
        bounds: { x: 300, y: 40, w: 520, h: 440 },
        content: { kind: 'app', appKey: 'chat:1' },
        dedupeKey: 'chat:1',
      }));
      return 'handled';
    },
  }],
  startupWindows: [{
    id: 'startup.chat',
    create: () => ({ /* ...window payload... */ }),
  }],
};

<DesktopShell stack={STACK} contributions={[chatContribution]} renderAppWindow={renderAppWindow} />
```

Command routing flows: **contribution handlers** → **built-in router** → **`onCommand` prop fallback**.

### Window Content Adapters

The shell renders window bodies through an adapter chain. Built-in adapters handle card and app windows; you can add custom adapters for new content types:

```ts
const dialogAdapter: WindowContentAdapter = {
  id: 'myapp.dialog',
  canRender: (window) => window.content.kind === 'dialog',
  render: (window) => <SettingsDialog dialogKey={window.content.dialogKey} />,
};
```

Adapter evaluation order: **contribution adapters** → **app adapter** → **card adapter** → **fallback**.

### Performance: Dual-Lane State

The framework splits state into two lanes to avoid flooding Redux during high-frequency interactions:

- **Durable lane (Redux):** Window positions, focus, navigation, business data — committed once on interaction end
- **Ephemeral lane (external store):** Drag/resize positions during pointer tracking — updated every frame via `useSyncExternalStore`, discarded on commit

This means dragging a window generates zero Redux dispatches until you release the pointer.

## DSL Reference

### Value Expressions

| Helper | Purpose | Example |
|--------|---------|---------|
| `Sel(name, from?)` | Read a selector | `Sel('allContacts', 'shared')` |
| `Param(name)` | Read a navigation parameter | `Param('id')` |
| `Ev(name)` | Read from the triggering event | `Ev('id')` |
| `Act(type, args?, opts?)` | Create an action descriptor | `Act('nav.go', { card: 'detail', param: Ev('id') })` |

### Built-in Actions

| Action | Args | Behavior |
|--------|------|----------|
| `nav.go` | `{ card, param? }` | Push card onto navigation stack |
| `nav.back` | — | Pop navigation stack |
| `toast.show` | `{ message }` | Show a toast notification |
| `state.set` | `{ scope?, path, value }` | Set a scoped state path |
| `state.setField` | `{ scope?, path?, key, value }` | Set `path.key` in scoped state |
| `state.patch` | `{ scope?, patch }` | Merge patch into scoped state |
| `state.reset` | `{ scope? }` | Reset scoped state for scope |

### Action Resolution

1. **Built-ins** — `nav.go`, `toast.show`, `state.set`, etc.
2. **Local handlers** (cascade): card → cardType → background → stack → global
3. **Shared handlers** — from the `sharedActions` registry
4. **Unhandled** — console warning

Use `Act('my.action', args, { to: 'shared' })` to skip the cascade.

### Selector Resolution

Selectors resolve: card → cardType → background → stack → global → shared.
Use `Sel('name', 'shared')` to go directly to shared selectors.

### UI Node Helpers

```ts
ui.menu({ items: [...] })
ui.list({ items: Sel('allItems', 'shared'), columns: [...] })
ui.detail({ fields: [...], record: Sel('currentItem', 'shared') })
ui.form({ fields: [...] })
ui.report({ sections: [...] })
ui.chat({ messages: Sel('messages', 'shared'), suggestions: [...] })
```

## Widgets

| Widget | Purpose |
|--------|---------|
| `Btn` | Action button with variants |
| `Chip` | Clickable tag/suggestion |
| `Toast` | Auto-dismiss notification |
| `FieldRow` | Label + input pair |
| `FilterBar` | Filter controls row |
| `DataTable` | Generic data grid |
| `MenuGrid` | Card-style menu |
| `ListView` | Filterable table with footer |
| `DetailView` | Record detail with computed fields |
| `FormView` | Input form with submit |
| `ReportView` | Key-value report sections |
| `ChatView` | Chat timeline with suggestions |
| `StreamingChatView` | Streaming chat with cursor animation |

## Theming

All styles are scoped under `[data-widget="hypercard"]` and driven by CSS custom properties. Override the five most impactful variables for a quick retheme:

```css
[data-widget="hypercard"] {
  --hc-color-desktop-bg: #1a1a2e;
  --hc-color-bg: #16213e;
  --hc-color-fg: #e0e8f0;
  --hc-color-accent: #00bcd4;
  --hc-font-family: 'Inter', sans-serif;
}
```

Target specific elements with stable `data-part` selectors:

```css
[data-widget="hypercard"] [data-part="windowing-window-title-bar"] {
  background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
}
```

See the [Theming and Parts Contract](ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/05-theming-and-parts-contract.md) for the full parts map and CSS cookbook.

## Storybook

Storybook is workspace-global, configured at `.storybook/main.ts`, and includes stories from all apps and the engine. Story titles must follow ownership-first prefixes:

- `Apps/Inventory/*`, `Apps/Todo/*`, `Apps/Crm/*`, `Apps/BookTrackerDebug/*`
- `Engine/*`

Run `npm run test` (which includes `storybook:check`) to enforce taxonomy rules before committing.

### Writing Card-Page Stories

```tsx
import { createStoryHelpers } from '@hypercard/engine';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  stack: STACK,
  sharedSelectors, sharedActions, createStore,
  navShortcuts: [{ card: 'home', icon: '🏠' }],
});

const meta = { title: 'Apps/MyApp', component: FullApp, decorators: [storeDecorator] };
export default meta;

export const Home = createStory('home');
export const Contacts = createStory('contacts');
```

## Go Backend (Inventory Chat)

`go-inventory-chat/` provides the streaming chat backend for the inventory app, built with Glazed and Pinocchio webchat. See its [README](go-inventory-chat/README.md) for setup and routes.

## Documentation

Detailed desktop framework documentation lives in the ticket workspace:

| Document | What It Covers |
|----------|---------------|
| [Start Here](ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/09-start-here-desktop-framework-reading-guide.md) | Reading order and document map |
| [Architecture Overview](ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/07-desktop-framework-architecture-overview.md) | Component tree, data flow, boot sequence, import map |
| [Quickstart](ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/02-desktop-framework-quickstart.md) | Step-by-step desktop shell setup |
| [Contribution API](ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/03-desktop-contribution-api-reference.md) | Custom menus, icons, commands, startup windows |
| [Adapter Guide](ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/04-window-content-adapter-guide.md) | Custom window content rendering |
| [Theming & Parts](ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/05-theming-and-parts-contract.md) | CSS variables, theme layers, data-part selectors |
| [Performance Model](ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/06-performance-model-durable-vs-ephemeral-lanes.md) | Redux vs. external stores for high-frequency data |
| [Common Recipes](ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/08-common-recipes.md) | Copy-paste patterns for common tasks |
| [JS API Reference](docs/js-api-user-guide-reference.md) | Complete DSL, widget, and runtime API reference |
| [Storybook Guide](docs/frontend/storybook.md) | Story taxonomy, placement rules, PR checklist |

## License

MIT
