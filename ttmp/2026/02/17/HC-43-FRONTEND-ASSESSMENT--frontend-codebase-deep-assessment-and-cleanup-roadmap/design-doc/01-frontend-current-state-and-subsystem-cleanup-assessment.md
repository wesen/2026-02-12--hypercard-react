---
Title: Frontend Current State and Subsystem Cleanup Assessment
Ticket: HC-43-FRONTEND-ASSESSMENT
Status: active
Topics:
    - frontend
    - architecture
    - cleanup
    - storybook
    - state-management
    - css
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/.storybook/main.ts
      Note: Global Storybook source aggregation and aliasing
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Monolithic chat orchestration and projection entry point
    - Path: apps/inventory/src/features/chat/chatSlice.ts
      Note: Conversation/timeline reducer complexity center
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Core shared Redux store factory and diagnostics entry point
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Primary shell integration point and window orchestration hotspot
    - Path: packages/engine/src/components/shell/windowing/dragOverlayStore.ts
      Note: External store fast lane for drag interaction updates
    - Path: packages/engine/src/theme/base.css
      Note: Monolithic token and component style baseline
ExternalSources: []
Summary: Deep technical assessment of the HyperCard frontend architecture, subsystem-by-subsystem quality findings, and a concrete cleanup/reorganization roadmap with code-level proposals.
LastUpdated: 2026-02-17T16:20:00-05:00
WhatFor: Provide a developer-onboarding-grade map of current frontend behavior and a practical cleanup plan.
WhenToUse: Use when planning frontend refactors, onboarding to engine/apps/storybook/theme architecture, or prioritizing cleanup work.
---


# Frontend Current State and Subsystem Cleanup Assessment

## Executive Summary

The frontend codebase is in a productive but transitional state: core architecture is coherent, but high-complexity files, cross-cutting concerns, and repeated patterns are accumulating maintenance cost. The strongest parts are:

- A shared engine package (`packages/engine`) that centralizes shell, widgets, runtime, and store scaffolding.
- A practical app-factory pattern via `createAppStore` with dev diagnostics support.
- A functional windowing system with recent high-frequency drag optimization (`dragOverlayStore` + Redux commit-on-end).
- A single Storybook surface that can render all apps and engine stories.

The most important cleanup opportunities are:

- Decompose monolithic orchestration in inventory chat (`apps/inventory/src/features/chat/InventoryChatWindow.tsx`) into explicit pipeline modules.
- Normalize repeated parsing/helpers and seed/id patterns across apps and chat utilities.
- Split `DesktopShell` orchestration concerns (window lifecycle, command routing, body caching, app host wiring).
- Replace ad-hoc inline styles in runtime components with part-based CSS and tokenized variants.
- Clarify Storybook structure and remove legacy/dead patterns (`decorators.tsx`, potentially unused `createDSLApp`, worker client export path).

This document includes:

- A 5+ page current-state architecture walkthrough.
- Subsystem-by-subsystem findings with concrete file anchors.
- Cleanup proposals, pseudocode, and migration sequencing.
- Documentation plan for long-term maintainability.

---

## Current State of Affairs (Detailed Baseline)

### 1. Repository Topology and Responsibility Boundaries

The repo is a workspace-style monorepo with one shared frontend package and four apps.

- Root: `package.json`
- Shared frontend engine: `packages/engine`
- Apps:
- `apps/inventory`
- `apps/todo`
- `apps/crm`
- `apps/book-tracker-debug`

A notable operational detail is that root scripts are inventory-centric:

```json
{
  "scripts": {
    "dev": "npm run dev -w apps/inventory",
    "storybook": "npm run -w apps/inventory storybook -- --config-dir .storybook"
  }
}
```

This is pragmatic, but creates an implicit “primary app” model. New developers can assume all apps are first-class at runtime, while in practice only inventory is wired as default DX entrypoint.

#### Quantitative snapshot

- `packages/engine/src` TypeScript files: 123
- `apps/inventory/src` TypeScript files: 50
- Other app TypeScript files: 11-18 each
- Engine stories: 29
- Inventory stories: 10
- Other app stories: 1 each

Largest files (non-generated) emphasize complexity concentration:

- `packages/engine/src/components/widgets/ChatWindow.stories.tsx` (1092 lines)
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx` (818 lines)
- `apps/inventory/src/features/chat/chatSlice.ts` (629 lines)
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx` (464 lines)
- `apps/inventory/src/features/debug/ReduxPerfWindow.tsx` (341 lines)

Interpretation: complexity is concentrated in chat orchestration, shell orchestration, and large story/demo files.

---

### 2. Runtime Composition and App Boot Flow

Every app follows essentially the same boot path:

1. `main.tsx` imports `base.css`, wraps `App` in Redux `Provider`.
2. `App.tsx` renders `DesktopShell`.
3. `DesktopShell` maps Redux `windowing` state to window definitions and window body renderers.
4. Card windows render through `PluginCardSessionHost`; app windows render through host callbacks.

Representative files:

- `apps/inventory/src/main.tsx`
- `apps/inventory/src/App.tsx`
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`

#### Architecture sketch

```text
main.tsx
  -> <Provider store={store}>
    -> <App />
      -> <DesktopShell stack=... renderAppWindow=...>
        -> Menu/Icon layers
        -> WindowLayer
          -> WindowSurface*
            -> card window: PluginCardSessionHost
            -> app window: renderAppWindow(appKey)
```

This is a strong composition model: data/state stays centralized, while specific window content is pluggable via `content.kind` and `appKey`.

Primary weakness: `DesktopShell` currently owns too many policy decisions (home window lifecycle, menu generation, icon generation, command dispatching, drag overlay interactions, body cache signatures, app fallback rendering). This is maintainable today but high-risk for feature growth.

---

### 3. Store and State Management Baseline

The engine exposes a store factory in `packages/engine/src/app/createAppStore.ts`.

Key characteristics:

- Engine reducers are always included:
- `pluginCardRuntime`
- `windowing`
- `notifications`
- `debug`
- Apps inject domain reducers.
- Diagnostics can be enabled with `enableReduxDiagnostics`.
- Diagnostics data is intentionally kept outside Redux.

Code anchor:

```ts
const reducer = {
  pluginCardRuntime: pluginCardRuntimeReducer,
  windowing: windowingReducer,
  notifications: notificationsReducer,
  debug: debugReducer,
  ...domainReducers,
};
```

Inventory enables diagnostics in dev:

- `apps/inventory/src/app/store.ts:15`
- `enableReduxDiagnostics: import.meta.env.DEV`

This is a good separation: high-frequency diagnostic telemetry is not fed back into Redux.

#### Selector shape

- Windowing selectors are mostly standard memoized selectors (`selectWindowsByZ`, etc.) in `packages/engine/src/features/windowing/selectors.ts`.
- Chat selectors in inventory are direct-access functions without `createSelector` composition (`apps/inventory/src/features/chat/selectors.ts`).

This works, but selector strategy is inconsistent between domains.

---

### 4. Windowing System and Interaction Throughput

Windowing state remains Redux-managed via `windowingSlice`:

- lifecycle: `openWindow`, `focusWindow`, `closeWindow`
- geometry: `moveWindow`, `resizeWindow`
- desktop transient state: active menu, selected icon
- card session nav stack

Recent optimization is implemented in shell-level overlay state:

- `packages/engine/src/components/shell/windowing/dragOverlayStore.ts`
- `useSyncExternalStore`-based external store
- pointer move/resize writes go to external store
- Redux receives only commit actions on interaction end

Flow:

```text
pointerdown -> interaction controller
pointermove -> dragOverlayStore.update(...) [external store]
render -> overlay draft bounds (no Redux dispatch flood)
pointerup -> dispatch moveWindow/resizeWindow once
```

This substantially lowers store churn during drag without changing durable state ownership.

Additional render isolation is present via memoization:

- `WindowSurface` is memoized with a custom comparator in `packages/engine/src/components/shell/windowing/WindowSurface.tsx`.

This combination (external drag lane + memoized surfaces) is strong and aligns with high-performance UI patterns.

Remaining concern: `DesktopShell` still recomputes several maps and handlers globally; although memoized, it remains a large integration surface.

---

### 5. Chat and Timeline/Event Pipeline (Inventory)

The inventory chat implementation is highly capable but densely coupled. `InventoryChatWindow.tsx` currently handles:

- websocket bootstrap and lifecycle
- timeline hydration fetch
- SEM envelope parsing and dispatch branching
- artifact extraction and runtime-card registration
- timeline projection and widget panel fanout
- message rendering adaptation and debug-mode overlays
- event viewer integration and window opening

Core ingestion path:

```text
WebSocket envelope
  -> emitConversationEvent(...)              [event viewer bus]
  -> onSemEnvelope(...)                      [projection/orchestration]
    -> 0..N Redux actions (chat, artifacts, timeline panel)
```

File anchors:

- Orchestrator: `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- Reducers: `apps/inventory/src/features/chat/chatSlice.ts`
- Timeline projection helper: `apps/inventory/src/features/chat/timelineProjection.ts`
- Artifact extraction helper: `apps/inventory/src/features/chat/artifactRuntime.ts`
- Event bus: `apps/inventory/src/features/chat/eventBus.ts`
- Transport client: `apps/inventory/src/features/chat/webchatClient.ts`

#### Observed duplication in parsing helpers

Very similar helper functions are repeated across files:

- `stringField`
- `recordField`
- `booleanField`
- `compactJSON`
- `shortText`

Examples:

- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/timelineProjection.ts`
- `apps/inventory/src/features/chat/artifactRuntime.ts`

This duplication increases drift risk when event schema edges evolve.

#### State mutation load profile

`llm.delta` events currently dispatch into Redux (`applyLLMDelta`) and may include accompanying token updates (`updateStreamTokens`). This is correct semantically, but under high-frequency streams it increases reducer and selector pressure.

Because the current feature includes timeline/event debugging requirements, a split model is recommended in future cleanup:

- keep canonical persisted/round-complete state in Redux
- keep high-frequency transient stream buffers in external store(s)
- periodically checkpoint or commit final assembled state back to Redux

This pattern is already validated by the windowing drag overlay architecture.

---

### 6. Plugin Runtime and Dynamic Card Injection

The runtime path in `PluginCardSessionHost` is robust and feature-rich:

- Session registration in Redux
- Bundle load via `QuickJSCardRuntimeService`
- Pending runtime card injection through registry
- Runtime intent dispatch back into Redux
- Projected `globalState` domain snapshoting for card execution context

Files:

- `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
- `packages/engine/src/plugin-runtime/runtimeService.ts`
- `packages/engine/src/plugin-runtime/runtimeCardRegistry.ts`

Design strengths:

- Runtime does not hardcode app domains: it projects unknown root slices as `domains`.
- Session lifecycle cleanup is explicit.
- Runtime cards can be injected dynamically from chat artifacts.

Design pressure points:

- Inline fallback/error styles and console logging remain in production runtime path.
- `PluginCardSessionHost` is large (350 lines) and mixes loading lifecycle, projection logic, event dispatching, and rendering decisions.

Potentially unused branch:

- Worker sandbox client (`packages/engine/src/plugin-runtime/worker/sandboxClient.ts`) is exported via barrel (`packages/engine/src/plugin-runtime/index.ts`) but not referenced in app runtime paths.

This may be intentional for future usage, but should be explicitly labeled experimental/deferred to avoid confusion.

---

### 7. Storybook Structure and Developer Experience

Only one Storybook config exists: `apps/inventory/.storybook/main.ts`, but it imports stories from all apps and the engine package.

Story sources configured:

- `../src/**/*.stories.@(ts|tsx)`
- `../../todo/src/**/*.stories.@(ts|tsx)`
- `../../book-tracker-debug/src/**/*.stories.@(ts|tsx)`
- `../../crm/src/**/*.stories.@(ts|tsx)`
- `../../../packages/engine/src/**/*.stories.@(ts|tsx)`

This centralization is efficient but has tradeoffs:

- Storybook ownership appears inventory-specific, though it serves the whole monorepo.
- Alias setup (`@hypercard/engine` -> source path) is duplicated across Storybook and each app Vite config.

Positive standardization pattern already exists:

- `createStoryHelpers` (`packages/engine/src/app/generateCardStories.tsx`) reduces boilerplate for app stack story generation.

Remaining inconsistency:

- inventory still has extra bespoke stories/decorators and a legacy stub file:
- `apps/inventory/src/stories/decorators.tsx` (`"no longer used"` marker)

Large story files are acting as semi-integration tests and demo labs (especially `ChatWindow.stories.tsx`). This is useful but should be split to reduce cognitive load and review noise.

---

### 8. CSS and Theming Baseline

Current CSS footprint is concentrated in one file:

- `packages/engine/src/theme/base.css` (919 lines)
- plus tiny overlays: `classic.css` (15), `modern.css` (19)

The system uses `data-widget="hypercard"` scoping and `data-part="..."` selectors, with part names centralized in `packages/engine/src/parts.ts`.

This is an excellent foundation for a design-system trajectory.

But there are structural issues:

- `base.css` mixes tokens, primitives, shell/windowing, chat, widgets, syntax highlighting, and animation concerns.
- many runtime components still use inline styles, especially in debug/chat windows.
- part coverage is incomplete for inventory-specific components (`EventViewerWindow`, timeline panels, debug windows).

A practical rule emerges:

- shared reusable visuals should migrate to part-based styles/tokens.
- one-off story scaffolding can keep inline styles.

Today this boundary is not consistently enforced.

---

### 9. Testing and Reliability Baseline

There is meaningful test coverage in engine and chat logic:

- windowing: `packages/engine/src/__tests__/windowing.test.ts`
- diagnostics: `packages/engine/src/__tests__/diagnostics.test.ts`
- drag overlay store: `packages/engine/src/components/shell/windowing/dragOverlayStore.test.ts`
- plugin runtime: several tests in `packages/engine/src/plugin-runtime/*.test.ts`
- inventory chat reducers/projection/event bus tests in `apps/inventory/src/features/chat/*.test.ts`

Gaps are mostly integration-level and architectural:

- `InventoryChatWindow` orchestration itself is not isolated behind a testable pipeline boundary.
- Storybook-heavy behavior implies manual confidence but not all behaviors are encoded in concise tests.
- no explicit performance budget tests for high-frequency chat events.

---

### 10. Summary of Current State

The frontend is operationally strong and evolving in the right direction. Key architecture choices (engine package, app factory, external-store diagnostics, external-store drag lane) are good. The dominant risk is not foundational design, but concentration and duplication:

- concentration: very large orchestration files
- duplication: helper functions/configs/seed patterns
- blurred boundaries: runtime components mixing UI styles, debug behavior, and integration logic

The next cleanup phase should focus on decomposition and standardization, not wholesale rewrites.

---

## Subsystem Review and Improvement Proposals

## A. Workspace/App Bootstrapping and Build Configuration

### Assessment

The app bootstrapping model is simple and consistent across apps (`main.tsx` + `Provider` + `App`), but config duplication is noticeable.

Duplication examples:

- Vite alias repeated in all apps:
- `apps/inventory/vite.config.ts`
- `apps/todo/vite.config.ts`
- `apps/crm/vite.config.ts`
- `apps/book-tracker-debug/vite.config.ts`

- Similar app entry wiring across each `main.tsx`.

### Why it matters

- Increases maintenance friction for alias changes, plugin additions, or common Vite flags.
- Makes accidental divergence likely (inventory already has proxy config while others do not).

### Proposal

Introduce shared config helpers:

```ts
// tooling/vite/createHypercardViteConfig.ts
export function createHypercardViteConfig(opts?: { chatProxy?: boolean }) {
  return defineConfig({
    plugins: [react()],
    resolve: { alias: { '@hypercard/engine': path.resolve(...)} },
    server: opts?.chatProxy ? { proxy: { ... } } : undefined,
  });
}
```

Apply helper in each app config, keeping app-specific deltas explicit.

### Suggested tasks

- Add `tooling/vite/createHypercardViteConfig.ts`.
- Refactor all app `vite.config.ts` files to use it.
- Add small docs: `docs/frontend/build-config.md`.

---

## B. Engine App Factory and Potential Dead Paths

### Assessment

`createAppStore` is healthy and actively used. `createDSLApp` appears exported but currently unused by apps.

- Definition: `packages/engine/src/app/createDSLApp.tsx`
- Search usage: only the defining file.

### Why it matters

Unused surface area creates onboarding confusion:

- Is it deprecated?
- Is it intended replacement for app `App.tsx`?
- Is it intentionally kept for external consumers?

### Proposal

Pick one explicit status:

1. Keep and document as supported API, with one app using it as proof.
2. Mark as deprecated with frontmatter doc + removal timeline.
3. Remove if no near-term usage.

Also clarify worker client export status similarly (`sandboxClient`).

### Suggested tasks

- Add `@deprecated` TSDoc or `@public` clarification on `createDSLApp`.
- Add engine API status page.

---

## C. Desktop Shell and Windowing Integration

### Assessment

`DesktopShell` is a powerful integration point but currently carries multiple responsibilities:

- auto-open home card
- menu/icon default generation
- command routing
- drag/resize preview + commit integration
- window body signature caching
- app/card/dialog body fallback

File: `packages/engine/src/components/shell/windowing/DesktopShell.tsx`

### Problem pattern

The shell now contains both:

- policy (what commands do)
- mechanics (how interaction is applied)

### Why it matters

- Harder to test command policy independently.
- Harder to onboard new contributors to one area without understanding all others.
- Makes performance tuning harder because all behaviors share one render/closure boundary.

### Proposal

Split shell by concern:

- `useDesktopCommands` hook: command dispatch policy only.
- `useWindowBodies` hook: cache/signature logic.
- `DesktopShell` stays as composition layer.

Pseudocode:

```ts
const {handleCommand, handleOpenIcon, menus, icons} = useDesktopCommands(...)
const {windowDefs, beginMove, beginResize, handleFocus, handleClose} = useDesktopInteraction(...)
const {renderWindowBody} = useWindowBodies({windows, stack, mode, renderAppWindow})
return <DesktopShellLayout ... />
```

### Further performance proposal

Window-layer subscription partitioning:

- Keep global store for durable window metadata.
- Move per-window volatile interaction state entirely external (already done for drag).
- Consider optional external lane for resize ghost rendering only if needed.

---

## D. Windowing Domain Slice and Selectors

### Assessment

`windowingSlice` is concise and understandable. Selectors are clean and mostly memoized.

Files:

- `packages/engine/src/features/windowing/windowingSlice.ts`
- `packages/engine/src/features/windowing/selectors.ts`

### Risk

One selector pattern can become costly at scale:

- `selectWindowsByZ` clones and sorts each recomputation.

At current scale this is fine; for larger window counts or frequent updates it may become non-trivial.

### Proposal

Add optional normalized derived order caching:

- Keep `zSortedIds` in state only if performance data shows necessity.
- Otherwise keep current simple selector path.

Because W-C + memoization now reduces update frequency during drag, this is likely low priority.

---

## E. Chat Orchestration and Event Projection

### Assessment

`InventoryChatWindow.tsx` currently acts as transport adapter, projection engine, and UI host.

Evidence of mixed concerns:

- helpers + parsing at top
- hydration functions (`hydrateEntity`, `hydrateFromTimelineSnapshot`)
- main envelope switch (`onSemEnvelope`)
- widget rendering and app-window launch callbacks
- UI composition and debug-mode controls

### Why it matters

- Hard to test event mapping in isolation.
- Hard to evolve schema handling safely.
- High cognitive load for contributors.

### Proposal: Pipeline modules

Split into explicit pipeline units:

1. `chatSemParser.ts`: parse envelope -> typed semantic events
2. `chatProjector.ts`: semantic event -> list of actions/effects
3. `chatEffects.ts`: runtime side-effects (registerRuntimeCard, event bus emit)
4. `useInventoryChatSession.ts`: lifecycle (bootstrap, websocket subscribe, dispatch)
5. `InventoryChatWindow.tsx`: mostly view composition

Proposed event flow:

```text
SEM envelope
  -> parseSemEnvelope(envelope): ParsedEvent
  -> projectChatEvent(parsed): ProjectedOps[]
  -> for each op:
     - dispatch(action) OR
     - run effect (artifact registry, analytics, debug stream)
```

Pseudocode:

```ts
const parsed = parseSemEnvelope(envelope)
const ops = projectChatEvent(parsed, { conversationId, now: Date.now() })
applyProjectedOps(ops, { dispatch, effectContext })
```

### Additional proposal: high-frequency stream lane

For `llm.delta` high-frequency updates:

- Maintain a per-conversation external buffer store for transient deltas.
- Throttle Redux commits to animation frame or 100-250ms.
- Always commit final text at `llm.final`.

This keeps chat correctness while reducing reducer churn.

---

## F. Chat Reducer and Domain Duplication

### Assessment

`chatSlice.ts` is functionally rich and currently stable, but includes both business logic and widget-specific projection details.

Examples:

- per-round widget IDs
- timeline panel construction
- streaming token stats
- suggestions management

### Why it matters

- The reducer knows too much about rendering structure (`inventory.timeline`, `inventory.cards`, `inventory.widgets`).
- Tight coupling makes future UI changes impact domain reducer complexity.

### Proposal

Introduce explicit domain model separation:

- Keep chat conversation core state lean (messages, stream state, stats).
- Move timeline/card/widget panel projections to projection sub-state or selector-computed model.

Incremental path (no big rewrite):

- Step 1: extract widget-id helper group and panel-upsert helpers to separate module.
- Step 2: add typed action creators for timeline panel updates from projector layer.
- Step 3: reduce direct widget-structure mutation in reducer body.

---

## G. Artifact Runtime and Timeline Projection Helpers

### Assessment

`artifactRuntime.ts` and `timelineProjection.ts` carry similar schema parsing logic and overlapping helper utilities.

### Why it matters

Schema change propagation currently requires multi-file helper updates.

### Proposal

Create shared `chatSemFields.ts` module:

```ts
export const semField = {
  string(record,key): string | undefined,
  record(record,key): Record<string, unknown> | undefined,
  boolean(record,key): boolean | undefined,
  number(record,key): number | undefined,
}
export function compactJSON(value: unknown): string
export function shortText(value?: string, max=180): string | undefined
```

Then import in:

- `InventoryChatWindow.tsx`
- `timelineProjection.ts`
- `artifactRuntime.ts`

---

## H. Event Viewer and Debugging UX

### Assessment

Event viewer architecture is effective:

- decoupled event bus (`eventBus.ts`)
- bounded entry list (`MAX_ENTRIES`)
- filter/pause/expand interactions

But visual implementation is inline-style-heavy (`EventViewerWindow.tsx`) and has direct style mutation on hover.

### Why it matters

- Hard to theme consistently with HyperCard tokens.
- Hard to evolve debug UX into reusable component set.

### Proposal

Extract event viewer UI primitives with `data-part` selectors:

- `event-viewer`, `event-viewer-toolbar`, `event-viewer-entry`, etc.
- style in `base.css` extension file or dedicated `debug.css` imported by engine/app.

Add optional virtualization for very large logs if needed (currently bounded to 500 entries, so not urgent).

---

## I. Plugin Runtime Host and Dynamic Card Injection

### Assessment

Runtime host is one of the most technically sophisticated subsystems.

Strengths:

- clear lifecycle states (`loading`, `ready`, `error`)
- session-scoped runtime management
- domain projection for plugin context

Improvement areas:

- Reduce inline fallback rendering styles.
- Move logging to debug hooks or gated logger.
- Split `projectGlobalState` and runtime lifecycle effects from render component.

### Proposal

Introduce `usePluginSessionRuntime` hook:

- handles registration/loading/injection/cleanup
- exposes `{status, error, tree, emitRuntimeEvent}`
- `PluginCardSessionHost` becomes thin UI wrapper

This improves testability and separation.

---

## J. Storybook Architecture and Documentation Surface

### Assessment

The codebase has broad story coverage, but structure can be clearer.

Strength:

- single Storybook sees all app and engine stories.
- `createStoryHelpers` reduces app story boilerplate.

Pain points:

- inventory-only config location for globally-scoped stories.
- monolithic story files (notably `ChatWindow.stories.tsx`).
- legacy file still present (`apps/inventory/src/stories/decorators.tsx`).

### Proposal

Reorganize storybook ownership:

Option A (recommended):

- Keep one Storybook runtime, but move config to root `/.storybook`.
- Keep story sources explicit per package/app.

Option B:

- Keep current location, add `docs/frontend/storybook.md` explaining global role.

Also split monolithic stories into thematic story files:

- `ChatWindow.basic.stories.tsx`
- `ChatWindow.streaming.stories.tsx`
- `ChatWindow.widgets.stories.tsx`
- `ChatWindow.edge-cases.stories.tsx`

---

## K. CSS Structure and Design-System Readiness

### Assessment

The code already has strong design-system primitives:

- tokenized variables (`--hc-*`)
- part naming registry (`PARTS`)
- scoped root wrapper (`data-widget="hypercard"`)

Current blocker is file organization and inconsistent usage.

### Proposed CSS architecture for reusable HyperCard design system

Target layout:

```text
packages/engine/src/theme/
  tokens/
    core.css
    semantic.css
    motion.css
  primitives/
    button.css
    chip.css
    field.css
    table.css
  shell/
    desktop.css
    window.css
    menu.css
    icon.css
  widgets/
    chat.css
    report.css
    detail.css
  debug/
    event-viewer.css
    runtime-debug.css
  themes/
    classic.css
    modern.css
  index.css  // imports all base layers
```

Rules:

- `base.css` can be split into these files gradually; keep temporary compatibility import.
- runtime components should prefer `data-part` + CSS classes over large inline style objects.
- debug tooling should still be theme-aware and token-driven.

Design-system API proposal:

- Keep `HyperCardTheme` as canonical root wrapper.
- Expand docs for `themeVars` usage and part overrides.
- Add stable list of supported parts and tokens in docs.

---

## L. Cross-App Domain Duplication (Stacks and Slices)

### Assessment

Multiple apps repeat near-identical patterns:

- `PluginCardMeta[]` + `toPluginCard` + `Object.fromEntries` in every `domain/stack.ts`.
- Seed cloning via `JSON.parse(JSON.stringify(...))` in many slices.
- Similar CRUD reducer boilerplate and ID generation patterns.

### Why it matters

- Easy to introduce subtle divergence.
- Harder to apply cross-app behavior changes consistently.

### Proposal

1. Add shared stack builder in engine:

```ts
createPluginStack({ id, name, icon, homeCard, bundleCode, capabilities, cardsMeta })
```

2. Add shared seed utility:

```ts
export function cloneSeed<T>(seed: T): T {
  return structuredClone(seed)
}
```

Fallback to JSON clone only where `structuredClone` unavailable.

3. Add small ID helper utilities per prefix.

---

## M. Deprecated, Duplicate, or Ambiguous Code Candidates

### Candidate list

1. `apps/inventory/src/stories/decorators.tsx`
- marked legacy/unused; safe archive/removal candidate.

2. `packages/engine/src/app/createDSLApp.tsx`
- exported but no current app usage; status needs explicit decision.

3. `packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
- exported, not used in active app runtime paths; label as experimental or integrate.

4. `ChatView` / `StreamingChatView` / `ChatWindow`
- functional overlap; define intended layering and deprecate redundant variants if appropriate.

5. Storybook monoliths
- split large story files to reduce review and maintenance burden.

---

## Cleanup Roadmap (Prioritized)

### Phase 1 (Low risk, high clarity)

1. Remove legacy dead-file markers and archive actual dead files.
2. Consolidate duplicate SEM helper utilities.
3. Centralize Vite alias config helper.
4. Add docs clarifying Storybook ownership and app boot model.

### Phase 2 (Medium risk, high leverage)

1. Decompose `InventoryChatWindow` into parser/projector/session hook modules.
2. Split `DesktopShell` concern boundaries.
3. Start CSS modular split of `base.css` by subsystem.

### Phase 3 (Targeted performance and DX)

1. Add external transient store for high-frequency LLM delta aggregation.
2. Add lightweight performance budget checks in chat integration tests.
3. Standardize debug window styling onto part-based CSS tokens.

### Phase 4 (Design-system hardening)

1. Publish part/token reference docs.
2. Define theming contract and override guarantees.
3. Add visual regression stories for major parts.

---

## Documentation to Write (Recommended)

1. `docs/frontend/architecture-overview.md`
- engine/apps boundaries, runtime flow, state ownership map.

2. `docs/frontend/state-management.md`
- Redux durable state vs external transient state rules.

3. `docs/frontend/chat-pipeline.md`
- transport -> parse -> project -> dispatch/effects contract.

4. `docs/frontend/windowing.md`
- window lifecycle, interaction model, drag overlay lane.

5. `docs/frontend/storybook.md`
- story sources, conventions, naming, scenario split guidance.

6. `docs/frontend/design-system.md`
- tokens, parts, theming, CSS layering, component styling rules.

7. `docs/frontend/deprecation-policy.md`
- when/how to mark unused exports and remove them safely.

---

## Open Questions

1. Is `createDSLApp` intended as a public long-term API, or legacy scaffolding?
2. Should worker-based runtime client remain exported now, or be clearly experimental?
3. Do we want one global Storybook config at repo root for explicit ownership?
4. Should chat high-frequency delta buffering be implemented in inventory only first, then promoted to engine?
5. Is `ChatView` still needed now that `ChatWindow` exists?

---

## References

Primary code references used in this assessment:

- `package.json`
- `apps/inventory/.storybook/main.ts`
- `apps/inventory/.storybook/preview.ts`
- `packages/engine/src/app/createAppStore.ts`
- `packages/engine/src/app/createDSLApp.tsx`
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/components/shell/windowing/WindowSurface.tsx`
- `packages/engine/src/components/shell/windowing/dragOverlayStore.ts`
- `packages/engine/src/features/windowing/windowingSlice.ts`
- `packages/engine/src/features/windowing/selectors.ts`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/chatSlice.ts`
- `apps/inventory/src/features/chat/timelineProjection.ts`
- `apps/inventory/src/features/chat/artifactRuntime.ts`
- `apps/inventory/src/features/chat/eventBus.ts`
- `apps/inventory/src/features/chat/webchatClient.ts`
- `apps/inventory/src/features/chat/EventViewerWindow.tsx`
- `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
- `packages/engine/src/plugin-runtime/index.ts`
- `packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
- `packages/engine/src/theme/base.css`
- `packages/engine/src/theme/HyperCardTheme.tsx`
- `packages/engine/src/parts.ts`
- `apps/inventory/src/stories/decorators.tsx`

