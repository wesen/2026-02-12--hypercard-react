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
      Note: Adapter chain contract and render semantics
    - Path: packages/engine/src/desktop-hypercard-adapter.ts
      Note: Public hypercard adapter entrypoint
ExternalSources: []
Summary: Guide to the adapter chain used to render desktop window content kinds.
LastUpdated: 2026-02-17T17:14:21.084368413-05:00
WhatFor: Document how to add custom window content rendering behavior using adapters.
WhenToUse: Use when extending desktop window rendering beyond default app/card/fallback behavior.
---


# Window Content Adapter Guide

## Goal
Explain how window body rendering is routed through adapter chain contracts and how to extend it safely.

## Context
The shell controller no longer hardcodes all content rendering. It calls `renderWindowContentWithAdapters(...)` with an ordered adapter list.

## Quick Reference
## Core adapter contract

```ts
export interface WindowContentAdapter {
  id: string;
  canRender: (window: WindowInstance, ctx: WindowAdapterContext) => boolean;
  render: (window: WindowInstance, ctx: WindowAdapterContext) => ReactNode | null;
}
```

Adapter-chain semantics:

1. Iterate in order.
2. Skip adapter if `canRender` is false.
3. If `render(...)` returns non-null, stop and use it.
4. If `render(...)` returns `null`, continue to next adapter.

## Effective adapter order in shell
From `useDesktopShellController`:

1. contribution adapters (`composedContributions.windowContentAdapters`)
2. default app adapter (`createAppWindowContentAdapter`)
3. default HyperCard card adapter (`createHypercardCardContentAdapter`)
4. default fallback adapter (`createFallbackWindowContentAdapter`)

This means app-level contributions can override defaults by placing adapters earlier.

## Default adapters
- `createAppWindowContentAdapter()`
  - handles `window.content.kind === 'app'`
  - delegates to `renderAppWindow(appKey, windowId)`
- `createHypercardCardContentAdapter()`
  - handles `kind === 'card'`
  - renders `PluginCardSessionHost`
- `createFallbackWindowContentAdapter()`
  - always matches
  - renders basic placeholder content

## HyperCard adapter entrypoint
Use subpath API if you need runtime adapter exports directly:

```ts
import {
  createHypercardCardContentAdapter,
  PluginCardSessionHost,
  PluginCardRenderer,
  dispatchRuntimeIntent,
} from '@hypercard/engine/desktop-hypercard-adapter';
```

## Usage Examples
## Custom adapter that handles dialog windows first

```ts
import type { WindowContentAdapter } from '@hypercard/engine/desktop-react';

const dialogAdapter: WindowContentAdapter = {
  id: 'my.dialog.adapter',
  canRender: (window) => window.content.kind === 'dialog',
  render: (window) => <MyDialog dialogKey={window.content.dialogKey ?? 'default'} title={window.title} />,
};

const contribution = {
  id: 'my.desktop',
  windowContentAdapters: [dialogAdapter],
};
```

## Pass-through pattern
Return `null` when adapter is tentative and wants fallback behavior:

```ts
const optionalAdapter: WindowContentAdapter = {
  id: 'optional.adapter',
  canRender: (window) => window.content.kind === 'app' && window.content.appKey === 'experimental',
  render: (window) => (featureEnabled() ? <ExperimentalPanel id={window.id} /> : null),
};
```

## Related
- `packages/engine/src/components/shell/windowing/windowContentAdapter.ts`
- `packages/engine/src/components/shell/windowing/defaultWindowContentAdapters.tsx`
- `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
- `packages/engine/src/desktop-hypercard-adapter.ts`
