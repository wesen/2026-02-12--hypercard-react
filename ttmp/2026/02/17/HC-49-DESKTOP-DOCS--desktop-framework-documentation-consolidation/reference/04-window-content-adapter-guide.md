---
Title: Window Content Adapter Guide
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
    - Path: packages/engine/src/components/shell/windowing/defaultWindowContentAdapters.tsx
      Note: Default app/card/fallback adapter implementations
    - Path: packages/engine/src/components/shell/windowing/windowContentAdapter.ts
      Note: Adapter chain contract and renderWindowContentWithAdapters
    - Path: packages/engine/src/desktop-hypercard-adapter.ts
      Note: Public hypercard adapter entrypoint
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Where the adapter chain is assembled and called
ExternalSources: []
Summary: Guide to the adapter chain used to render desktop window content — when you need it, how it works, and how to extend it.
LastUpdated: 2026-02-17T17:30:00.000000000-05:00
WhatFor: Document how to add custom window content rendering behavior using adapters.
WhenToUse: Use when extending desktop window rendering beyond default app/card/fallback behavior.
---

# Window Content Adapter Guide

When the desktop shell needs to render a window body, it doesn't hardcode what goes inside — it could be a HyperCard card, a chat panel, a settings dialog, or something entirely custom. **Adapters** are the routing layer that matches window content types to React renderers.

Think of them as a middleware chain: each adapter gets a chance to claim the window, and the first one that can render it wins. If it can't (or declines), the next adapter in line gets a try.

## Do You Need a Custom Adapter?

Most apps don't need one. Here's a quick decision tree:

```
Your window has content.kind === 'card'
  → Built-in card adapter handles it. You don't need anything.

Your window has content.kind === 'app'
  → Built-in app adapter handles it. Just provide renderAppWindow.

You need a new content kind (e.g., 'dialog', 'preview', 'embed')
  → Write a custom adapter.

You need to override how an existing kind renders
  → Write a custom adapter with higher priority (contribution adapters run first).
```

**If you're only using card and app windows**, you can skip this guide entirely. The [Quickstart](./02-desktop-framework-quickstart.md) covers the `renderAppWindow` prop, which is all you need for app-kind windows.

## How the Adapter Chain Works

When a window needs rendering, `renderWindowContentWithAdapters()` walks through an ordered list of adapters:

```
Window: { id: 'win:1', content: { kind: 'dialog', dialogKey: 'settings' } }
        │
        ▼
┌─ Adapter 1: dialogAdapter ──────────────────────────┐
│  canRender(window, ctx)?                             │
│    → YES (kind === 'dialog')                         │
│  render(window, ctx)                                 │
│    → <SettingsDialog />     ← non-null = DONE        │
└──────────────────────────────────────────────────────┘
        ✓ Rendering complete — stop here.


Window: { id: 'win:2', content: { kind: 'app', appKey: 'chat:1' } }
        │
        ▼
┌─ Adapter 1: dialogAdapter ──────────────────────────┐
│  canRender(window, ctx)?                             │
│    → NO (kind is 'app', not 'dialog')                │
│  → skip                                              │
└─────────┬────────────────────────────────────────────┘
          ▼
┌─ Adapter 2: appAdapter (default) ───────────────────┐
│  canRender(window, ctx)?                             │
│    → YES (kind === 'app')                            │
│  render(window, ctx)                                 │
│    → ctx.renderAppWindow('chat:1', 'win:2') = <Chat/>│
└──────────────────────────────────────────────────────┘
        ✓ Rendering complete.
```

The rules are simple:

1. **Iterate adapters in order.**
2. **Call `canRender(window, ctx)`.** If `false`, skip to the next adapter.
3. **Call `render(window, ctx)`.** If it returns a non-null `ReactNode`, stop — that's the window body.
4. **If `render` returns `null`**, continue to the next adapter. This is the "pass-through" mechanism.
5. **If no adapter renders**, the window body is `null`.

## The Default Adapter Chain

The shell assembles adapters in this order inside `useDesktopShellController`:

```
allAdapters = [
  ...composedContributions.windowContentAdapters,   ← your adapters (first priority)
  createAppWindowContentAdapter(),                   ← handles kind === 'app'
  createHypercardCardContentAdapter(),               ← handles kind === 'card'
  createFallbackWindowContentAdapter(),              ← catches everything else
]
```

| Adapter | Matches | Behavior |
|---------|---------|----------|
| **Your contribution adapters** | Whatever you define | Run first — can override defaults |
| **App adapter** | `kind === 'app'` | Calls `renderAppWindow(appKey, windowId)` |
| **Card adapter** | `kind === 'card'` | Renders `PluginCardSessionHost` with card session |
| **Fallback adapter** | Always matches | Renders a basic placeholder |

Because contribution adapters run first, you can intercept *any* content kind — even `'app'` or `'card'` — if you need custom behavior.

## Writing a Custom Adapter

A `WindowContentAdapter` is a plain object with three fields:

```ts
interface WindowContentAdapter {
  id: string;
  canRender: (window: WindowInstance, ctx: WindowAdapterContext) => boolean;
  render: (window: WindowInstance, ctx: WindowAdapterContext) => ReactNode | null;
}
```

The context gives you access to the stack and rendering mode:

```ts
interface WindowAdapterContext {
  stack: CardStackDefinition;
  mode: 'interactive' | 'preview';
  renderAppWindow?: (appKey: string, windowId: string) => ReactNode;
}
```

### Example: Dialog Window Adapter

Let's add support for a `'dialog'` content kind that doesn't exist by default:

```tsx
import type { WindowContentAdapter } from '@hypercard/engine/desktop-react';

const dialogAdapter: WindowContentAdapter = {
  id: 'my-app.dialog',
  canRender: (window) => window.content.kind === 'dialog',
  render: (window) => {
    switch (window.content.dialogKey) {
      case 'settings': return <SettingsDialog title={window.title} />;
      case 'about':    return <AboutDialog />;
      default:         return <div>Unknown dialog: {window.content.dialogKey}</div>;
    }
  },
};
```

Wire it into a contribution:

```ts
const myContribution: DesktopContribution = {
  id: 'my-app.desktop',
  windowContentAdapters: [dialogAdapter],
  // ...other contribution fields
};
```

Now open a dialog window:

```ts
dispatch(openWindow({
  id: 'window:settings',
  title: 'Settings',
  bounds: { x: 200, y: 100, w: 400, h: 300 },
  content: { kind: 'dialog', dialogKey: 'settings' },
  dedupeKey: 'settings',
  isDialog: true,
}));
```

### Example: Conditional Pass-Through Adapter

Sometimes you want to render a window only under certain conditions — like a feature flag. Return `null` from `render()` to pass through to the next adapter:

```ts
const experimentalAdapter: WindowContentAdapter = {
  id: 'my-app.experimental',
  canRender: (window) =>
    window.content.kind === 'app' && window.content.appKey === 'experimental-viewer',
  render: (window) => {
    if (!featureFlags.experimentalViewer) {
      return null;  // ← pass through to default app adapter
    }
    return <ExperimentalViewer windowId={window.id} />;
  },
};
```

When the feature flag is off, `render()` returns `null`, so the default app adapter gets a chance. This lets you safely experiment without breaking the fallback path.

## HyperCard Adapter Entrypoint

If you need to access the card rendering components directly (for testing, composition, or building a custom card adapter), use the dedicated subpath import:

```ts
import {
  createHypercardCardContentAdapter,
  PluginCardSessionHost,
  PluginCardRenderer,
  dispatchRuntimeIntent,
} from '@hypercard/engine/desktop-hypercard-adapter';
```

This is only needed if you're customizing card rendering. For normal usage, the default card adapter handles everything.

## Gotchas

- **Adapter order matters.** Contribution adapters always run before defaults. If you register an adapter that matches `kind === 'app'`, it will intercept all app windows before the default app adapter.

- **`canRender` should be fast.** It's called for every window on every render cycle. Don't do expensive computation in it — just check the content kind and any other simple conditions.

- **`render` returning `null` ≠ `canRender` returning `false`.** `canRender: false` means "I definitely can't handle this, don't even ask." `render: null` means "I thought I could, but I'm passing — try the next adapter."

- **Window bodies are cached by signature.** The controller caches rendered bodies using a signature derived from `content.kind`, `content.card`/`content.appKey`, window ID, and mode. If your adapter relies on external state not captured in the signature, you may see stale renders.

## Related Docs

| Topic | Link |
|-------|------|
| Getting started with the shell | [Quickstart](./02-desktop-framework-quickstart.md) |
| Adding custom commands and menus | [Contribution API Reference](./03-desktop-contribution-api-reference.md) |
| Overall architecture | [Architecture Overview](./07-desktop-framework-architecture-overview.md) |
