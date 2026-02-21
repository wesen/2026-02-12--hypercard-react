---
Title: 'Developer Handoff: File Map, HyperCard Window Integration, and Middleware Wiring'
Ticket: HC-041-REDUX-FPS-DEBUG
Status: active
Topics:
    - debugging
    - frontend
    - performance
    - redux
    - developer-experience
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Startup window behavior and appKey-to-component mapping
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/app/store.ts
      Note: Inventory store creation callsite for diagnostics enable flag
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts
      Note: How plugin cards are declared and surfaced in desktop shell
    - Path: 2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts
      Note: configureStore location where middleware and diagnostics reducer should be wired
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: renderAppWindow contract and app window rendering behavior
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/types.ts
      Note: app/card/dialog content-kind contract
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts
      Note: openWindow action and dedupe behavior
    - Path: apps/inventory/src/App.tsx
      Note: Reference for appKey routing and startup window creation
    - Path: apps/inventory/src/domain/stack.ts
      Note: Reference for adding plugin cards versus app windows
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Reference for middleware wiring location
    - Path: packages/engine/src/features/windowing/types.ts
      Note: Reference for app window payload structure
ExternalSources: []
Summary: |
    Copy/paste handoff guide for implementing HC-041: where to add generic Redux diagnostics middleware, how to surface metrics in an app window, how to auto-open the window in dev mode, and how HyperCard card vs app window integration works today.
LastUpdated: 2026-02-17T09:12:00-05:00
WhatFor: |
    Allow a new developer to pick up HC-041 and implement directly without rediscovering architecture or integration points.
WhenToUse: Use during implementation, code review, and onboarding for Redux diagnostics window work.
---


# Developer Handoff: File Map, HyperCard Window Integration, and Middleware Wiring

## Goal

Provide an implementation-ready map for HC-041 so a new developer can:

1. Add a generic Redux throughput/FPS diagnostics middleware.
2. Wire it cleanly into the app store setup.
3. Add a HyperCard app window for diagnostics.
4. Auto-open the diagnostics window in dev mode only.

## Context

### DEV mode behavior under Vite

- `import.meta.env.DEV` is `true` when running `vite dev` (`npm run dev` / `pnpm dev` flow).
- `import.meta.env.DEV` is `false` in production build runtime.

This is the intended gate for startup auto-open and diagnostics enablement.

### Current architecture summary

- Store factory is centralized in engine: `createAppStore`.
- Inventory app composes engine + domain reducers in `apps/inventory/src/app/store.ts`.
- Desktop app windows are opened via `openWindow({ content: { kind: 'app', appKey } })`.
- `renderAppWindow` in `apps/inventory/src/App.tsx` resolves each `appKey` to a React component.

## Quick Reference

## File map (where to edit)

### Store and middleware wiring

1. `packages/engine/src/app/createAppStore.ts`
- Accepts optional `CreateAppStoreOptions` with `enableReduxDiagnostics` flag.
- When enabled: initialises module-level diagnostics store, appends timing middleware, starts frame monitor.
- **No diagnostics reducer in Redux** — data lives in module-level ring buffers.

2. `apps/inventory/src/app/store.ts`
- Passes `enableReduxDiagnostics: import.meta.env.DEV`.

### Dev diagnostics window integration

1. `apps/inventory/src/App.tsx`
- Add diagnostics `appKey` route in `renderAppWindow`.
- Auto-open diagnostics window on startup in dev mode.
- Optional: add icon/menu command for manual reopening.

2. `packages/engine/src/features/windowing/windowingSlice.ts`
- No change required for basic usage.
- Use existing `openWindow` + `dedupeKey` behavior.

3. `packages/engine/src/features/windowing/types.ts`
- No change required; already supports `content.kind = 'app'` and `appKey`.

### Final file map (implemented)

1. `packages/engine/src/diagnostics/types.ts` — ReduxPerfEvent, ReduxPerfSnapshot, FrameEvent, DiagnosticsConfig
2. `packages/engine/src/diagnostics/ringBuffer.ts` — Bounded ring-buffer helper
3. `packages/engine/src/diagnostics/diagnosticsStore.ts` — Module-level mutable storage, write/control/snapshot APIs
4. `packages/engine/src/diagnostics/reduxPerfMiddleware.ts` — Redux middleware (times dispatches, writes to diagnosticsStore)
5. `packages/engine/src/diagnostics/frameMonitor.ts` — rAF loop (writes to diagnosticsStore)
6. `packages/engine/src/diagnostics/useDiagnosticsSnapshot.ts` — React hook (polls at ~2Hz)
7. `packages/engine/src/diagnostics/index.ts` — Barrel exports
8. `apps/inventory/src/features/debug/ReduxPerfWindow.tsx` — Live diagnostics panel UI
9. `packages/engine/src/__tests__/diagnostics.test.ts` — 25 unit tests

## Copy/paste integration snippets

### 1) `createAppStore` options (final)

```ts
interface CreateAppStoreOptions {
  enableReduxDiagnostics?: boolean;
  diagnosticsWindowMs?: number;
}
```

When `enableReduxDiagnostics` is true, `createAppStore`:
- Calls `initDiagnostics({ windowMs })` to set up module-level ring buffers.
- Appends the timing middleware (writes to external store, no Redux dispatch).
- Starts `startFrameMonitor()` (writes to external store, no Redux dispatch).
- **Does NOT add any reducer** — diagnostics data lives outside Redux.

### 2) Enable in inventory store (dev only)

```ts
export const { store, createStore: createInventoryStore } = createAppStore(
  {
    inventory: inventoryReducer,
    sales: salesReducer,
    artifacts: artifactsReducer,
    chat: chatReducer,
  },
  {
    enableReduxDiagnostics: import.meta.env.DEV,
    diagnosticsWindowMs: 5000,
  },
);
```

### 3) Add diagnostics app window route in `App.tsx`

```tsx
const REDUX_PERF_APP_KEY = 'redux-perf-debug';

const renderAppWindow = useCallback((appKey: string): ReactNode => {
  if (appKey === REDUX_PERF_APP_KEY) return <ReduxPerfWindow />;
  // existing routes...
  return null;
}, []);
```

### 4) Auto-open diagnostics window on startup in dev

```tsx
useEffect(() => {
  openNewChatWindow(dispatch);

  if (import.meta.env.DEV) {
    dispatch(
      openWindow({
        id: 'window:redux-perf:dev',
        title: '📈 Redux Perf',
        icon: '📈',
        bounds: { x: 900, y: 40, w: 420, h: 320 },
        content: { kind: 'app', appKey: REDUX_PERF_APP_KEY },
        dedupeKey: REDUX_PERF_APP_KEY,
      }),
    );
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### 5) Suggested diagnostics metrics contract

```ts
interface ReduxPerfSnapshot {
  windowMs: number;
  actionsPerSec: number;
  stateChangesPerSec: number;
  avgReducerMs: number;
  p95ReducerMs: number;
  fps: number;
  longFramesPerSec: number;
  topActionRates: Array<{ type: string; perSec: number }>;
}
```

## How to add HyperCard cards vs app windows

### Add a plugin card (stack card)

Use `apps/inventory/src/domain/stack.ts`:

1. Add `id/title/icon` to `INVENTORY_CARD_META`.
2. Card is converted by `toPluginCard(...)`.
3. Desktop icons/menus derived from `STACK.cards` in `App.tsx` and/or `DesktopShell`.

Use this when the window body should come from plugin runtime card rendering.

### Add a non-card app window (recommended for diagnostics)

Use `openWindow({ content: { kind: 'app', appKey } })` in `App.tsx`, and handle `appKey` in `renderAppWindow`.

Use this when the window body is regular React UI (diagnostics panel, event viewer, tools).

## Usage Examples

### Example debugging scenario

1. Run inventory dev server.
2. Dev diagnostics window opens automatically.
3. Start chat streaming + drag windows.
4. Verify:
   - `actions/sec` rises with event bursts.
   - `windowing/moveWindow` and chat action rates are visible.
   - FPS drops can be correlated with reducer/dispatch pressure.

### Example manual reopen after close

Add menu command and icon in `App.tsx`:

- Command: `debug.redux-perf`
- Icon id: `redux-perf`

On command/icon open same `openWindow` payload with dedupe key.

## How to enable diagnostics in another app

1. In the app's `store.ts`, pass the diagnostics option:

```ts
const { store } = createAppStore(
  { /* your reducers */ },
  { enableReduxDiagnostics: import.meta.env.DEV },
);
```

2. Create a diagnostics window component (or copy `ReduxPerfWindow.tsx`):

```tsx
import { useDiagnosticsSnapshot, resetDiagnostics, toggleDiagnosticsPause, setDiagnosticsWindowMs } from '@hypercard/engine';

export function MyPerfWindow() {
  const { snapshot, paused, windowMs } = useDiagnosticsSnapshot(500);
  // render snapshot...
}
```

3. Add appKey route in your `renderAppWindow` and auto-open in dev mode.

That's it — no reducer registration, no Redux wiring beyond the middleware.

## Manual verification runbook

1. **Start dev server:** `npm run dev -w apps/inventory`
2. **Verify auto-open:** diagnostics window should appear at startup titled "📈 Redux Perf".
3. **Idle metrics:** actions/sec should be low (~0-2), FPS should be ~60.
4. **Chat streaming:** start a chat, observe actions/sec rise (chat/appendDelta, etc.).
5. **Window dragging:** drag windows, observe `windowing/moveWindow` in top action types.
6. **Controls:** click Pause → metrics freeze; click Resume → metrics update; click Reset → all zeroes.
7. **Window selector:** change window to 1s/10s, verify metric rates adjust.
8. **Close & reopen:** close the diagnostics window, reopen via Debug menu or 📈 icon.
9. **Production build:** `npm run build -w apps/inventory` → run preview → verify no diagnostics window opens and no diagnostics overhead.

### Expected metric ranges

| Scenario | Actions/sec | FPS | Avg reducer |
|----------|-------------|-----|-------------|
| Idle | 0–5 | 58–60 | <1ms |
| Chat streaming | 20–100+ | 50–60 | <2ms |
| Window dragging | 30–60 | 40–60 | <1ms |
| Heavy combined | 50–200+ | 30–55 | 1–5ms |

## Acceptance Checklist (final)

1. ✅ Diagnostics disabled in prod by default.
2. ✅ Diagnostics enabled in inventory dev mode.
3. ✅ Dev window opens once at startup and can be reopened.
4. ✅ Metrics update continuously and remain bounded in memory.
5. ✅ Tests cover rolling-window math and store behavior (25 tests).
6. ✅ Diagnostics data stored outside Redux (zero dispatch overhead).
7. ✅ Docs updated with final file paths and API signatures.

## Related

- `ttmp/2026/02/17/HC-041-REDUX-FPS-DEBUG--redux-throughput-fps-diagnostics-middleware-and-dev-hypercard-window/design-doc/01-implementation-plan-redux-throughput-fps-diagnostics-middleware-and-dev-window.md`
- `apps/inventory/src/App.tsx`
- `apps/inventory/src/app/store.ts`
- `packages/engine/src/app/createAppStore.ts`
