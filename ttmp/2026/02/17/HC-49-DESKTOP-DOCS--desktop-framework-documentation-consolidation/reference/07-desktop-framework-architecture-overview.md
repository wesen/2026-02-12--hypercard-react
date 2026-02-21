---
Title: Desktop Framework Architecture Overview
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
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Central controller hook — orchestrates all desktop shell behavior
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Top-level shell component (thin wrapper)
    - Path: packages/engine/src/components/shell/windowing/DesktopShellView.tsx
      Note: Presentational shell view
    - Path: packages/engine/src/desktop-react.ts
      Note: Public API entrypoint for shell components
    - Path: packages/engine/src/desktop-core.ts
      Note: Public API entrypoint for state/actions
    - Path: packages/engine/src/index.ts
      Note: Main engine barrel (DSL, widgets, store utilities)
ExternalSources: []
Summary: Big-picture architecture guide for the HyperCard desktop framework — component tree, data flow, boot sequence, and import map.
LastUpdated: 2026-02-17T17:30:00.000000000-05:00
WhatFor: Give new developers a mental map of the desktop framework before diving into specific topics.
WhenToUse: Read this first when onboarding to the desktop framework codebase.
---

# Desktop Framework Architecture Overview

The HyperCard desktop framework gives you a classic desktop-style shell — menu bar, desktop icons, draggable/resizable windows — built entirely in React and Redux. You define your app as a *card stack* (a set of screens), and the framework renders it inside a windowed desktop environment where each card can open in its own window.

This document is your map. Read it before diving into the specific guides so you know where everything lives and how the pieces connect.

## What You Get Out of the Box

When you render `<DesktopShell stack={STACK} />`, the framework automatically:

- **Renders a menu bar** with File, Cards, and Window menus (or your custom menus)
- **Shows desktop icons** for each card in your stack (or your custom icons)
- **Opens a home card window** on first mount
- **Handles window dragging and resizing** with smooth pointer tracking
- **Manages window focus, z-ordering, and close** behavior
- **Routes menu/icon commands** through a contribution → built-in → fallback chain
- **Renders window bodies** through an adapter chain that knows about cards, app windows, and custom content types

## The Component Tree

Here's how the desktop shell breaks down into React components:

```
<Provider store={store}>              ← Redux store (you create this)
  <App>                               ← Your app root
    <DesktopShell>                    ← Entry point — composes controller + view
      └─ useDesktopShellController()  ← All logic lives here (not in JSX)
      └─ <DesktopShellView>           ← Pure presentational component
           ├─ <DesktopMenuBar>        ← Top menu bar (File, Cards, Window…)
           ├─ <DesktopIconLayer>      ← Desktop icon grid
           ├─ <WindowLayer>           ← Renders all open windows
           │   └─ <WindowSurface>     ← One per window (chrome + body)
           │       ├─ <WindowTitleBar> ← Draggable title, close button
           │       ├─ Window body      ← Content (rendered by adapter chain)
           │       └─ <WindowResizeHandle>
           └─ <Toast>                 ← Notification popups
```

The key architectural decision: **all behavior lives in `useDesktopShellController`**, not in the JSX components. The view components are purely presentational — they receive callbacks and data, and render them. This means you can test the controller logic independently and swap out the view layer if needed.

## Data Flow

The desktop framework uses Redux for durable state and an external store for high-frequency interactions. Here's how data flows through the system:

```
  User clicks menu item
        │
        ▼
  onCommand(commandId)
        │
        ▼
  ┌─ Contribution handlers ─┐     ┌─ Built-in router ─┐     ┌─ onCommand prop ─┐
  │  (your extensions)       │────▶│  (open/close/tile) │────▶│  (your fallback) │
  └──────────────────────────┘     └────────────────────┘     └──────────────────┘
        │                                   │
        ▼                                   ▼
  dispatch(openWindow(...))          dispatch(closeWindow(...))
        │                                   │
        ▼                                   ▼
  ┌─ windowingReducer (Redux) ─────────────────────────────────┐
  │  windows: { id → WindowInstance }                          │
  │  order: [id, id, ...]                                      │
  │  desktop: { focusedWindowId, activeMenuId, zCounter, ... } │
  └────────────────────────────────────────────────────────────┘
        │
        ▼
  useSelector() picks up changes → components re-render
```

For high-frequency interactions like window dragging:

```
  pointerdown on title bar
        │
        ▼
  useWindowInteractionController    ← registers global pointermove/pointerup
        │
        │  (every pointermove — ~60fps)
        ▼
  dragOverlayStore.update()         ← external store, NOT Redux
        │
        ▼
  useSyncExternalStore              ← only the dragged window re-renders
        │
  pointerup
        │
        ▼
  dispatch(moveWindow(...))         ← single Redux commit of final position
  dragOverlayStore.clear()
```

This dual-lane design prevents flooding Redux with 60 actions/second during drags. See the [Performance Model](./06-performance-model-durable-vs-ephemeral-lanes.md) for the full rationale.

## How the Shell Boots

When your app mounts `<DesktopShell stack={STACK} />`, here's the sequence of events:

1. **`useDesktopShellController` runs** — it composes contributions, sets up callbacks, and wires Redux selectors.

2. **Contributions are composed** — your `DesktopContribution[]` bundles are merged:
   - Menus merged by section `id` (items appended)
   - Icons deduplicated by `id`
   - Command handlers sorted by priority
   - Adapters and startup windows concatenated

3. **Default menus/icons are generated** (if contributions don't provide any):
   - A "File" menu with New Home Window and Close Window
   - A "Cards" menu listing all cards in the stack
   - A "Window" menu with Tile and Cascade
   - Icons for each card

4. **Home card window is opened** via an effect:
   - Creates a card session with navigation stack
   - Uses `dedupeKey` to prevent duplicate home windows
   - Tracks the key `${stack.id}:${homeCard}:${homeParam}` to avoid re-opening on re-render

5. **Startup windows are opened** (if contributions define any):
   - Each `StartupWindowFactory.create()` is called
   - Keyed to avoid re-creation: `${stack.id}:${homeParam}:${startupWindowIds}`

6. **Adapter chain is assembled**:
   - Contribution adapters first (can override defaults)
   - Default app adapter (handles `content.kind === 'app'`)
   - Default card adapter (handles `content.kind === 'card'`)
   - Fallback adapter (catches everything else)

## The Import Map

The engine package uses subpath imports to keep the API surface organized. Here's what each import gives you:

```
@hypercard/engine
├── DSL types:     CardStackDefinition, CardDefinition, UINode, Act, Sel, Param, Ev
├── Widgets:       DataTable, ListView, FormView, DetailView, ChatView, ...
├── Store:         createAppStore, createDSLApp, createStoryHelpers
├── Chat:          streamingChatReducer, useChatStream, fakeStream
├── Debug:         debugReducer, StandardDebugPane
├── Diagnostics:   createReduxPerfMiddleware, startFrameMonitor
├── Parts:         PARTS (stable data-part name registry)
└── Theme wrapper: HyperCardTheme

@hypercard/engine/desktop-react
├── DesktopShell, DesktopShellView, DesktopMenuBar, DesktopIconLayer
├── WindowLayer, WindowSurface, WindowTitleBar, WindowResizeHandle
├── useDesktopShellController, useWindowInteractionController
├── Contribution types:  DesktopContribution, DesktopCommandHandler, ...
├── Adapter types:       WindowContentAdapter, renderWindowContentWithAdapters
├── Adapter factories:   createAppWindowContentAdapter, createFallbackWindowContentAdapter
├── Command routing:     routeDesktopCommand, routeContributionCommand
└── Composition:         composeDesktopContributions

@hypercard/engine/desktop-core
├── Redux actions: openWindow, closeWindow, focusWindow, moveWindow, resizeWindow, ...
├── Session nav:   sessionNavGo, sessionNavBack, sessionNavHome
├── Selectors:     selectWindowsByZ, selectFocusedWindow, selectWindowById, ...
├── Reducer:       windowingReducer
└── Types:         WindowInstance, OpenWindowPayload, WindowContent, WindowBounds, ...

@hypercard/engine/theme                    → Base CSS packs (tokens, shell, primitives, chat, ...)
@hypercard/engine/theme/classic.css        → Classic theme layer
@hypercard/engine/theme/modern.css         → Modern theme layer
@hypercard/engine/desktop-theme-macos1     → macOS-inspired theme layer

@hypercard/engine/desktop-hypercard-adapter
├── createHypercardCardContentAdapter      → Card window rendering
├── PluginCardSessionHost, PluginCardRenderer
└── dispatchRuntimeIntent
```

**Rule of thumb:**
- Building UI or defining stacks? → `@hypercard/engine`
- Rendering the desktop shell? → `@hypercard/engine/desktop-react`
- Dispatching window actions from code? → `@hypercard/engine/desktop-core`
- Loading styles? → `@hypercard/engine/theme`

## Monorepo Structure

```
packages/engine/          ← @hypercard/engine — shared framework (zero domain knowledge)
  src/
    app/                  ← createAppStore, createDSLApp, createStoryHelpers
    cards/                ← DSL type system, runtime execution, scoped state
    chat/                 ← Streaming chat (slice, API client, fake stream)
    components/
      shell/windowing/    ← Desktop shell components + controller
      widgets/            ← 13 generic widgets (DataTable, ListView, FormView, ...)
    debug/                ← Debug slice + pane
    desktop/              ← Desktop state (core) and shell (react) barrels
    diagnostics/          ← Redux perf middleware, frame monitor, ring buffer
    features/             ← RTK slices (navigation, notifications, plugin runtime)
    theme/                ← CSS custom properties + theme packs
    parts.ts              ← data-part name registry

apps/
  inventory/              ← Full-featured app (10 cards, chat, debug, contributions)
  todo/                   ← Minimal app (7 cards, no custom contributions)
  crm/                    ← CRM app (13 cards, contacts/companies/deals/activities)
  book-tracker-debug/     ← Book tracker with debug pane (6 cards)
```

## Where to Go Next

Now that you have the big picture, choose your path:

| I want to...                          | Read this                                                         |
|---------------------------------------|-------------------------------------------------------------------|
| Get a shell running in 5 minutes      | [Desktop Framework Quickstart](./02-desktop-framework-quickstart.md) |
| Add custom menus, icons, and commands | [Contribution API Reference](./03-desktop-contribution-api-reference.md) |
| Render custom window types            | [Window Content Adapter Guide](./04-window-content-adapter-guide.md) |
| Customize colors, fonts, and styles   | [Theming and Parts Contract](./05-theming-and-parts-contract.md)  |
| Handle high-frequency interactions    | [Performance Model](./06-performance-model-durable-vs-ephemeral-lanes.md) |
| Copy-paste common patterns            | [Common Recipes](./08-common-recipes.md)                         |
| Understand the DSL card system        | [JS API User Guide](../../../docs/js-api-user-guide-reference.md) |
