---
Title: Desktop Contribution API Reference
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
      Note: Production contribution usage — menus, icons, commands, startup windows
    - Path: packages/engine/src/components/shell/windowing/desktopContributions.ts
      Note: Contribution interfaces, composition logic, and command routing
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Contribution command precedence, startup behavior, and adapter wiring
    - Path: packages/engine/src/components/shell/windowing/desktopCommandRouter.ts
      Note: Built-in command routing (window.open.home, window.tile, etc.)
ExternalSources: []
Summary: Guide to extending the desktop shell with custom menus, icons, commands, adapters, and startup windows using contributions.
LastUpdated: 2026-02-17T17:30:00.000000000-05:00
WhatFor: Document the extension API used to contribute menus/icons/commands/startup behavior.
WhenToUse: Use when authoring app-level desktop behavior without forking DesktopShell internals.
---

# Desktop Contribution API Reference

Contributions are the extension mechanism for the desktop shell. Instead of forking `DesktopShell` or subclassing it, you declare what you want — custom menus, desktop icons, command handlers, window content adapters, and startup windows — and the shell composes everything together.

Think of contributions as **plugin bundles**: you describe your extensions declaratively, and the framework handles merging, ordering, and routing.

## When Do You Need Contributions?

If you're rendering `<DesktopShell stack={STACK} />` with no customization, the shell auto-generates menus and icons from your card stack. You need contributions when you want to:

- Add custom menu items (like "New Chat" or a Debug menu)
- Show custom desktop icons (not just card icons)
- Handle commands that aren't built-in (opening custom windows, triggering app logic)
- Register window content adapters for custom content kinds
- Open windows automatically on startup (like a chat panel or dev tool)

## Anatomy of a Contribution

A `DesktopContribution` is a plain object with five optional extension points:

```
DesktopContribution
├── id: string                     ← unique identifier
├── menus?: DesktopMenuSection[]   ← merged by section id, items appended
├── icons?: DesktopIconDef[]       ← unique by id (collision = throw or warn)
├── commands?: DesktopCommandHandler[]  ← sorted by priority, then declaration order
├── windowContentAdapters?: WindowContentAdapter[]  ← concatenated in order
└── startupWindows?: StartupWindowFactory[]         ← concatenated in order
```

You provide an array of contributions to the shell:

```tsx
<DesktopShell stack={STACK} contributions={[myContribution, anotherContribution]} />
```

When the shell receives multiple contributions, it merges them using predictable rules (see [Composition Rules](#composition-and-merge-rules) below).

## Building Your First Contribution

Let's build a contribution step by step, starting simple and adding features incrementally.

### Step 1: Add a Menu Item

Start with a single custom menu entry — a "New Chat" option in the File menu:

```ts
import type { DesktopContribution } from '@hypercard/engine/desktop-react';

const myContribution: DesktopContribution = {
  id: 'my-app.desktop',
  menus: [
    {
      id: 'file',           // matches the built-in File menu section id
      label: 'File',
      items: [
        { id: 'new-chat', label: 'New Chat', commandId: 'chat.new', shortcut: 'Ctrl+N' },
      ],
    },
  ],
};
```

When the shell composes this, it sees a menu section with `id: 'file'` and **appends** your items to the existing File menu. If you used a new id (like `debug`), it would create a new menu section.

At this point, clicking "New Chat" fires the command `chat.new`, but nothing handles it yet — it falls through to the `onCommand` prop (if provided) or gets silently dropped.

### Step 2: Wire a Command Handler

Now handle the `chat.new` command by opening a window:

```ts
import { openWindow } from '@hypercard/engine/desktop-core';
import type { DesktopContribution } from '@hypercard/engine/desktop-react';

const myContribution: DesktopContribution = {
  id: 'my-app.desktop',
  menus: [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'new-chat', label: 'New Chat', commandId: 'chat.new', shortcut: 'Ctrl+N' },
      ],
    },
  ],
  commands: [
    {
      id: 'my-app.chat.new',
      priority: 100,
      matches: (commandId) => commandId === 'chat.new',
      run: (_commandId, ctx) => {
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
    },
  ],
};
```

### Step 3: Add a Desktop Icon

Icons appear on the desktop background. When double-clicked, they fire a command `icon.open.<iconId>`:

```ts
const myContribution: DesktopContribution = {
  id: 'my-app.desktop',
  icons: [
    { id: 'new-chat', label: 'New Chat', icon: '💬' },
    // ...card icons are typically generated from the stack
  ],
  commands: [
    {
      id: 'my-app.chat.new',
      priority: 100,
      // Handle both the menu command AND the icon double-click
      matches: (commandId) => commandId === 'chat.new' || commandId === 'icon.open.new-chat',
      run: (_commandId, ctx) => {
        ctx.dispatch(openWindow({ /* ...same as above... */ }));
        return 'handled';
      },
    },
  ],
  // ...menus from Step 1
};
```

### Step 4: Add a Startup Window

Startup windows open automatically when the shell mounts — useful for chat panels, welcome screens, or dev tools:

```ts
const myContribution: DesktopContribution = {
  id: 'my-app.desktop',
  startupWindows: [
    {
      id: 'startup.chat',
      create: () => ({
        id: 'window:chat:startup',
        title: '💬 Chat',
        icon: '💬',
        bounds: { x: 320, y: 30, w: 520, h: 440 },
        content: { kind: 'app', appKey: 'chat:1' },
        dedupeKey: 'chat:1',
      }),
    },
  ],
  // ...menus, icons, commands from above
};
```

The `create` function receives `{ stack, homeParam }` as context. Return `null` to skip creating the window (useful for conditional startup).

Startup windows run once on mount and are keyed by `${stack.id}:${homeParam}:${startupWindowIds}` to prevent re-creation on re-renders.

## Command Routing

When the user clicks a menu item or double-clicks an icon, the shell routes the resulting `commandId` through a three-stage pipeline:

```
User clicks menu item / double-clicks icon
        │
        ▼
┌─ 1. Contribution Handlers ──────┐
│  sorted by priority (desc)      │
│  then by declaration order       │
│                                  │
│  matches(commandId)?             │
│    YES → run() → 'handled'? ────┼──▶ STOP
│                   'pass'?   ─────┤
│    NO  → skip                    │
└──────────┬───────────────────────┘
           │ no handler matched
           ▼
┌─ 2. Built-in Router ────────────┐
│  window.open.home               │
│  window.open.card.<cardId>      │
│  window.close-focused           │──▶ handled? → STOP
│  window.tile                    │
│  window.cascade                 │
└──────────┬───────────────────────┘
           │ not a built-in command
           ▼
┌─ 3. onCommand Prop ─────────────┐
│  (your app-level fallback)      │
│  called for anything unhandled  │
└──────────────────────────────────┘
```

**Key detail:** Contributions run *before* built-ins. This means you can override built-in commands (like `window.open.home`) by registering a contribution handler with a matching `matches()` function.

### The `matches` + `run` Two-Phase Design

Command handlers use a two-phase approach:

1. **`matches(commandId)`** — Called for every command. Return `true` if you *might* handle it.
2. **`run(commandId, ctx)`** — Called only if `matches` returned `true`. Return `'handled'` to stop routing, or `'pass'` to let subsequent handlers try.

This lets you inspect commands without committing to handle them. For example, a logging handler could match everything but always return `'pass'`.

### Command Context

The `run` function receives a context object with everything you need to interact with the shell:

```ts
interface DesktopCommandContext {
  dispatch: (action: any) => unknown;     // Redux dispatch
  getState?: () => unknown;               // Redux getState
  focusedWindowId: string | null;         // Currently focused window
  openCardWindow: (cardId: string) => void; // Convenience: open a card window
  closeWindow: (windowId: string) => void;  // Convenience: close a window
}
```

## Composition and Merge Rules

When the shell receives multiple contributions, `composeDesktopContributions()` applies these rules:

| Extension Point | Merge Strategy |
|-----------------|---------------|
| **menus** | Merged by section `id`. If two contributions define a section with the same `id`, their items are appended in contribution order. New section IDs create new menu sections. |
| **icons** | Unique by icon `id`. Collisions throw by default. Set `onIconCollision: 'warn'` to skip duplicates with a console warning. |
| **commands** | Flattened and sorted by `priority` (descending), then stable by declaration order. Higher priority runs first. |
| **windowContentAdapters** | Concatenated in contribution order. Earlier contributions get first crack at rendering. |
| **startupWindows** | Concatenated in contribution order. All factories run on mount. |

## Common Patterns

### Open a Singleton Window (with Dedupe)

Use `dedupeKey` to ensure only one instance exists. If you dispatch `openWindow` with a key that already exists, the existing window gets focused instead:

```ts
ctx.dispatch(openWindow({
  id: 'window:settings',
  title: 'Settings',
  bounds: { x: 200, y: 50, w: 400, h: 300 },
  content: { kind: 'app', appKey: 'settings' },
  dedupeKey: 'settings',  // ← prevents duplicates
}));
```

### Dev-Only Debug Menu

Conditionally include debug features using `import.meta.env.DEV`:

```ts
const contribution: DesktopContribution = {
  id: 'my-app.desktop',
  menus: [
    // ...regular menus...
    ...(import.meta.env.DEV ? [{
      id: 'debug',
      label: 'Debug',
      items: [
        { id: 'redux-perf', label: '📈 Redux Perf', commandId: 'debug.redux-perf' },
      ],
    }] : []),
  ],
};
```

### Override a Built-in Command

Since contribution handlers run before built-ins, you can intercept any built-in command:

```ts
{
  id: 'my-app.custom-home',
  priority: 200,  // high priority ensures we run first
  matches: (cmd) => cmd === 'window.open.home',
  run: (_cmd, ctx) => {
    // Custom home behavior instead of default
    ctx.openCardWindow('dashboard');  // open dashboard instead of default home
    return 'handled';
  },
}
```

## Complete Interface Reference

### DesktopContribution

```ts
interface DesktopContribution {
  id: string;
  menus?: DesktopMenuSection[];
  icons?: DesktopIconDef[];
  commands?: DesktopCommandHandler[];
  windowContentAdapters?: WindowContentAdapter[];
  startupWindows?: StartupWindowFactory[];
}
```

### DesktopCommandHandler

```ts
interface DesktopCommandHandler {
  id: string;
  priority?: number;    // higher = runs first (default: 0)
  matches: (commandId: string) => boolean;
  run: (commandId: string, ctx: DesktopCommandContext) => 'handled' | 'pass';
}
```

### DesktopCommandContext

```ts
interface DesktopCommandContext {
  dispatch: (action: any) => unknown;
  getState?: () => unknown;
  focusedWindowId: string | null;
  openCardWindow: (cardId: string) => void;
  closeWindow: (windowId: string) => void;
}
```

### StartupWindowFactory

```ts
interface StartupWindowFactory {
  id: string;
  create: (ctx: StartupWindowContext) => OpenWindowPayload | null;
}

interface StartupWindowContext {
  stack: CardStackDefinition;
  homeParam?: string;
}
```

### Menu Types

```ts
interface DesktopMenuSection {
  id: string;
  label: string;
  items: DesktopMenuEntry[];
}

type DesktopMenuEntry = DesktopMenuItem | DesktopMenuSeparator;

interface DesktopMenuItem {
  id: string;
  label: string;
  commandId: string;
  shortcut?: string;
  disabled?: boolean;
}

interface DesktopMenuSeparator {
  separator: true;
}
```

### Icon Types

```ts
interface DesktopIconDef {
  id: string;
  label: string;
  icon: string;     // emoji or text
  x?: number;       // explicit position (auto-grid if omitted)
  y?: number;
}
```

## Related Docs

| Topic | Link |
|-------|------|
| Getting started with the shell | [Quickstart](./02-desktop-framework-quickstart.md) |
| Custom window content rendering | [Window Content Adapter Guide](./04-window-content-adapter-guide.md) |
| Overall architecture | [Architecture Overview](./07-desktop-framework-architecture-overview.md) |
| Copy-paste recipes | [Common Recipes](./08-common-recipes.md) |
