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
      Note: Quickstart usage pattern source
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Quickstart store bootstrap source
    - Path: packages/engine/src/desktop-core.ts
      Note: Quickstart window action import source
    - Path: packages/engine/src/desktop-react.ts
      Note: Quickstart desktop shell import source
ExternalSources: []
Summary: Quickstart for bootstrapping HyperCard desktop shell with the current subpath API surface.
LastUpdated: 2026-02-17T17:14:20.420227753-05:00
WhatFor: Provide a copy/paste setup path for new apps using desktop-core + desktop-react + theme imports.
WhenToUse: Use when creating or refactoring an app to the current desktop framework API.
---


# Desktop Framework Quickstart

## Goal
Get a working desktop shell using the current public entrypoints:

- `@hypercard/engine/desktop-react`
- `@hypercard/engine/desktop-core`
- `@hypercard/engine/theme`

## Context
Desktop/windowing APIs are intentionally no longer exported from `@hypercard/engine` root. Use subpath imports for shell and state APIs.

## Quick Reference
## 1) Install imports in app entrypoint

```ts
// src/main.tsx
import '@hypercard/engine/theme';
```

Optional theme layer:

```ts
import '@hypercard/engine/desktop-theme-macos1';
```

## 2) Create store with engine reducers

```ts
// src/app/store.ts
import { createAppStore } from '@hypercard/engine';
import { inventoryReducer } from '../features/inventory/inventorySlice';

export const { store, createStore } = createAppStore(
  { inventory: inventoryReducer },
  {
    enableReduxDiagnostics: import.meta.env.DEV,
    diagnosticsWindowMs: 5000,
  },
);
```

## 3) Render `DesktopShell`

```tsx
// src/App.tsx
import { DesktopShell } from '@hypercard/engine/desktop-react';
import type { CardStackDefinition } from '@hypercard/engine';

const STACK: CardStackDefinition = {
  id: 'inventory',
  name: 'Inventory',
  icon: '📦',
  homeCard: 'home',
  plugin: { bundleCode: '/* plugin bundle */' },
  cards: {
    home: { id: 'home', type: 'plugin', title: 'Home', icon: '🏠', ui: { t: 'text', value: 'Home' } },
  },
};

export function App() {
  return <DesktopShell stack={STACK} />;
}
```

## 4) Open non-card windows from code

```ts
import { openWindow } from '@hypercard/engine/desktop-core';

dispatch(
  openWindow({
    id: 'window:chat:1',
    title: 'Chat',
    icon: '💬',
    bounds: { x: 300, y: 40, w: 520, h: 440 },
    content: { kind: 'app', appKey: 'chat:1' },
    dedupeKey: 'chat:1',
  }),
);
```

## 5) Provide `renderAppWindow` for app-kind windows

```tsx
<DesktopShell
  stack={STACK}
  renderAppWindow={(appKey) => {
    if (appKey === 'chat:1') return <ChatWindow />;
    return null;
  }}
/>
```

## Usage Examples
## Minimal wiring checklist

1. `main.tsx` imports `@hypercard/engine/theme`.
2. Store uses `createAppStore(...)`.
3. App renders `<DesktopShell stack={STACK} />`.
4. Non-card windows dispatch `openWindow(...)` from `desktop-core`.
5. `renderAppWindow` handles app window bodies.

## Contribution-ready setup
Once the shell is running, move menus/icons/commands/startup windows into `contributions` (see `03-desktop-contribution-api-reference.md`).

## Related
- `ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/03-desktop-contribution-api-reference.md`
- `ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/04-window-content-adapter-guide.md`
- `packages/engine/src/desktop-react.ts`
- `packages/engine/src/desktop-core.ts`
- `packages/engine/src/app/createAppStore.ts`
