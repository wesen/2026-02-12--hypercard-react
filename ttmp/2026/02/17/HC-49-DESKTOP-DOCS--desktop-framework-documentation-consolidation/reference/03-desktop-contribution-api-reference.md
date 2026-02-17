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
      Note: Production contribution usage example
    - Path: packages/engine/src/components/shell/windowing/desktopContributions.ts
      Note: Contribution interfaces and composer semantics
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Contribution command precedence and startup behavior
ExternalSources: []
Summary: Contract reference for desktop contribution composition and command routing.
LastUpdated: 2026-02-17T17:14:20.707907078-05:00
WhatFor: Document the extension API used to contribute menus/icons/commands/startup behavior.
WhenToUse: Use when authoring app-level desktop behavior without forking DesktopShell internals.
---


# Desktop Contribution API Reference

## Goal
Define the exact shape and behavior of `DesktopContribution` and related command/startup contracts.

## Context
`DesktopShell` accepts `contributions?: DesktopContribution[]`. Contributions are composed once and applied ahead of built-in command routing.

## Quick Reference
## Primary interfaces

```ts
export interface DesktopContribution {
  id: string;
  menus?: DesktopMenuSection[];
  icons?: DesktopIconDef[];
  commands?: DesktopCommandHandler[];
  windowContentAdapters?: WindowContentAdapter[];
  startupWindows?: StartupWindowFactory[];
}

export interface DesktopCommandHandler {
  id: string;
  priority?: number;
  matches: (commandId: string) => boolean;
  run: (commandId: string, ctx: DesktopCommandContext) => 'handled' | 'pass';
}

export interface StartupWindowFactory {
  id: string;
  create: (ctx: StartupWindowContext) => OpenWindowPayload | null;
}
```

## Composition and merge behavior
`composeDesktopContributions(items, options)` applies these rules:

1. `menus`: merged by section `id`; items are appended in contribution order.
2. `icons`: unique by icon `id`.
3. `commands`: flattened and sorted by `priority` (desc), then stable by declaration order.
4. `windowContentAdapters`: concatenated in contribution order.
5. `startupWindows`: concatenated in contribution order.

Icon collisions:

- default: throw (`onIconCollision: 'throw'`)
- optional: warn-and-skip duplicate (`onIconCollision: 'warn'`)

## Command routing order inside shell
Effective order in `useDesktopShellController`:

1. contribution handlers (`routeContributionCommand`)
2. built-in desktop router (`routeDesktopCommand`)
3. optional `onCommand` prop fallback

So contributions can override/extend behavior before built-ins.

## Context contract for command handlers

```ts
export interface DesktopCommandContext {
  dispatch: (action: any) => unknown;
  getState?: () => unknown;
  focusedWindowId: string | null;
  openCardWindow: (cardId: string) => void;
  closeWindow: (windowId: string) => void;
}
```

## Startup behavior notes
Startup windows run from an effect in controller and are keyed by:

```txt
${stack.id}:${homeParam}:${startupWindowIds.join('|')}
```

This avoids repeated startup window creation on every render for same effective setup.

## Usage Examples
## Example contribution bundle

```ts
import { openWindow } from '@hypercard/engine/desktop-core';
import type { DesktopContribution } from '@hypercard/engine/desktop-react';

export const inventoryContribution: DesktopContribution = {
  id: 'inventory.desktop',
  icons: [{ id: 'new-chat', label: 'New Chat', icon: '💬' }],
  menus: [
    {
      id: 'file',
      label: 'File',
      items: [{ id: 'new-chat', label: 'New Chat', commandId: 'chat.new' }],
    },
  ],
  commands: [
    {
      id: 'inventory.chat.new',
      priority: 100,
      matches: (commandId) => commandId === 'chat.new' || commandId === 'icon.open.new-chat',
      run: (_commandId, ctx) => {
        ctx.dispatch(
          openWindow({
            id: 'window:chat:1',
            title: 'Chat',
            icon: '💬',
            bounds: { x: 320, y: 30, w: 520, h: 440 },
            content: { kind: 'app', appKey: 'chat:1' },
            dedupeKey: 'chat:1',
          }),
        );
        return 'handled';
      },
    },
  ],
  startupWindows: [
    {
      id: 'startup.chat',
      create: () => ({
        id: 'window:chat:start',
        title: 'Chat',
        icon: '💬',
        bounds: { x: 320, y: 30, w: 520, h: 440 },
        content: { kind: 'app', appKey: 'chat:1' },
        dedupeKey: 'chat:1',
      }),
    },
  ],
};
```

## Wiring into shell

```tsx
<DesktopShell stack={STACK} contributions={[inventoryContribution]} renderAppWindow={renderAppWindow} />
```

## Related
- `packages/engine/src/components/shell/windowing/desktopContributions.ts`
- `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
- `apps/inventory/src/App.tsx`
- `ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/04-window-content-adapter-guide.md`
