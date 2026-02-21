---
Title: Frontend, Storybook, State Management, and CSS Design-System Cleanup Investigation
Ticket: HC-037-UI-CLEANUP
Status: active
Topics:
    - frontend
    - redux
    - performance
    - ux
    - debugging
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/.storybook/main.ts
      Note: Unified Storybook configuration currently hosted in inventory app
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/EventViewerWindow.tsx
      Note: Non-Redux event debugging UI with local retention and inline styling
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: High-complexity chat integration and high-frequency dispatch fan-out
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/eventBus.ts
      Note: Raw event bus architecture used by debugging window
    - Path: 2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts
      Note: Base store composition contract and always-on reducers
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Window shell orchestration and drag/resize dispatch wiring
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: Pointermove-driven interaction path
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts
      Note: Windowing state reducers and geometry updates
    - Path: 2026-02-12--hypercard-react/packages/engine/src/parts.ts
      Note: Existing part-name registry for theming/design-system contracts
    - Path: 2026-02-12--hypercard-react/packages/engine/src/theme/base.css
      Note: Monolithic theme/token/style layer and current CSS architecture
    - Path: apps/inventory/.storybook/main.ts
      Note: Storybook topology and cross-app config host
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Primary chat dispatch fan-out and complexity hotspot
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Store composition and always-on reducers
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Windowing orchestration and drag wiring
    - Path: packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: Pointermove interaction dispatch path
    - Path: packages/engine/src/parts.ts
      Note: Parts registry contract and drift analysis
    - Path: packages/engine/src/theme/base.css
      Note: Monolithic CSS architecture and token layer
ExternalSources: []
Summary: |
    End-to-end audit of frontend architecture quality across app bootstrap, Storybook organization, Redux/state-management shape, duplication/deprecation hotspots, and CSS/theming structure. Proposes a staged cleanup/reorganization plan with explicit removal targets, API adjustments, migration pseudocode, and a design-system extraction strategy for reusable HyperCard UI foundations.
LastUpdated: 2026-02-17T08:20:00-05:00
WhatFor: |
    Guide the second HC-037 investigation and provide a concrete cleanup blueprint for engineering implementation and documentation work.
WhenToUse: Use when planning frontend cleanup, Storybook restructuring, Redux simplification, or CSS design-system extraction.
---


# Frontend, Storybook, State Management, and CSS Design-System Cleanup Investigation

## Executive Summary

This investigation audited the current HyperCard frontend codebase with focus on maintainability, duplication, architecture drift, and future reusability. The repo has strong foundations: a clear engine/app split, a windowing core with test coverage, and a part-based styling direction (`data-part` + `PARTS`). However, quality and operability are now constrained by structural duplication and feature accretion.

Highest-leverage findings:

1. App scaffolding and configuration are duplicated across apps (store bootstrap, entrypoint, Vite aliasing, stack scaffolding), increasing drift risk and slowing changes.
2. Storybook is effectively centralized in `apps/inventory/.storybook` while trying to represent all apps and engine stories; this creates ownership and coupling ambiguity.
3. State management has grown into two overlapping chat systems (engine `streamingChat` and inventory-specific chat runtime), plus always-on debug/window/runtime reducers in every app store.
4. High-complexity files are concentrated in inventory chat and large story files, reducing reviewability and making behavior changes risky.
5. CSS architecture is currently a single large `base.css` (914 lines) with mixed concerns; token/part contracts exist but are inconsistently applied due inline styles, ad hoc CSS vars, and unregistered part names.
6. There are concrete removal/deprecation candidates (legacy decorators file, empty directories, stale API helpers, unused slice wiring) that can be safely cleaned with tests.

Recommended program:

1. Introduce shared app scaffolding APIs and generate app setup from a small manifest.
2. Split Storybook ownership from inventory app config into a workspace-level frontend docs package.
3. Separate high-frequency ephemeral state paths from durable Redux domain state (already partially done for raw events).
4. Break inventory chat feature into bounded modules with explicit ingestion/projection/render interfaces.
5. Extract a first-class HyperCard design-system package with token tiers, component style modules, and registry-verified part contracts.
6. Deliver cleanup through phased, low-risk PRs with codemods, guardrail tests, and targeted docs.

## Scope and Method

### Scope

This investigation covered:

- Frontend monorepo structure under `apps/*` and `packages/engine/*`
- Storybook configuration and story distribution
- State management contracts and reducer topology
- Duplication and legacy/deprecated code hotspots
- CSS/theme/part architecture and design-system reuse potential
- Documentation and cleanup roadmap

### Method

1. Repository inventory and topology checks (`rg --files`, `find`, line-count sampling).
2. Runtime path tracing for chat ingestion and windowing interactions.
3. Code duplication inspection across app scaffolding and domain setup.
4. Storybook and test-surface inspection.
5. CSS contract analysis (token definitions, token usage, part-name coverage, inline-style prevalence).
6. Cleanup design and migration sketching with pseudocode.

### Quantitative Context (Current Snapshot)

- `apps/` + `packages/` files: 237
- Story files: 40 (`29` in engine, `8` inventory, `1` each for todo/crm/book-tracker)
- Store/slice/selectors files: 32
- `style={{ ... }}` occurrences: 234
- CSS files in theme layer: 3 (`base.css`, `classic.css`, `modern.css`)
- `base.css` size: 914 lines
- Inventory chat feature size: 4140 lines across 21 files
- Engine build output currently present locally: `packages/engine/dist` (480 files, 2.3M)

## Architecture Status: Current Frontend Shape

### Workspace and Package Topology

The structure is conceptually clean:

- `packages/engine`: reusable UI/runtime/state primitives
- `apps/inventory`, `apps/crm`, `apps/todo`, `apps/book-tracker-debug`: domain apps

But practical coupling remains high because apps import engine **source** paths directly for styling and aliases. Example:

```tsx
import '../../../packages/engine/src/theme/base.css';
```

Found in each app `src/main.tsx`, and Storybook preview imports from source as well.

Implication:

- Engine internal path moves become app-breaking changes.
- “Package boundary” is conceptual rather than enforced.
- Design-system extraction is harder while consumers import private-ish source locations.

### App Bootstrap Pattern

All apps share near-identical bootstrap shape:

- `apps/*/src/main.tsx`: `ReactDOM.createRoot`, `Provider`, `store`, `base.css`
- `apps/*/src/app/store.ts`: `createAppStore({ ...domainReducers })`
- `apps/*/vite.config.ts`: same alias, inventory adds proxy
- `apps/*/tsconfig.json`: near-identical compiler settings and path mapping

Concrete duplication indicators:

- `apps/book-tracker-debug/src/main.tsx`, `apps/crm/src/main.tsx`, and `apps/todo/src/main.tsx` are byte-identical.
- `apps/book-tracker-debug/vite.config.ts`, `apps/crm/vite.config.ts`, and `apps/todo/vite.config.ts` are byte-identical.
- Three app `tsconfig.json` files are byte-identical.

This is maintainable at small scale, but will quickly drift as more apps are added.

### Engine Store Composition Contract

`packages/engine/src/app/createAppStore.ts` unconditionally mounts:

- `pluginCardRuntime`
- `windowing`
- `notifications`
- `debug`

And then spreads app reducers.

Representative snippet:

```ts
const reducer = {
  pluginCardRuntime: pluginCardRuntimeReducer,
  windowing: windowingReducer,
  notifications: notificationsReducer,
  debug: debugReducer,
  ...domainReducers,
};
```

Implications:

- Every app always carries debug reducer cost, even when no debug UI/hooks are used.
- Store composition is less explicit than desired for productized apps.
- State shape assumptions leak into components like `PluginCardSessionHost` (`knownSlices` hardcoded list includes `debug`).

## Storybook Status and Cleanup Design

### Current State

Storybook configuration lives only in `apps/inventory/.storybook` and loads stories from all apps plus engine:

- `../src/**/*.stories.@(ts|tsx)`
- `../../todo/src/**/*.stories.@(ts|tsx)`
- `../../book-tracker-debug/src/**/*.stories.@(ts|tsx)`
- `../../crm/src/**/*.stories.@(ts|tsx)`
- `../../../packages/engine/src/**/*.stories.@(ts|tsx)`

The root script delegates to inventory’s Storybook script/config.

### Structural Risks

1. Ownership ambiguity

Storybook is effectively a workspace artifact, but housed under one app. This creates accidental coupling between workspace docs tooling and inventory app dependencies.

2. Addon/config drift

`apps/inventory/package.json` includes multiple addons (`addon-a11y`, onboarding, vitest integration), but `.storybook/main.ts` currently enables only `@storybook/addon-docs`.

3. Inconsistent story wiring patterns

Most app full-app stories use `createStoryHelpers`, but `apps/inventory/src/stories/FullApp.stories.tsx` still uses custom decorator implementation.

4. Legacy residue

`apps/inventory/src/stories/decorators.tsx` is explicitly marked legacy/no longer used.

5. Smoke test is minimal

`packages/engine/src/__tests__/storybook-app-smoke.test.ts` checks static story exports in four files, not render compatibility across story corpus.

### Proposed Storybook Reorganization

#### Option A (recommended): Workspace Storybook Package

Create `packages/storybook-workbench` (or `apps/storybook`) containing:

- `.storybook/` config
- shared decorators and preview setup
- workspace story import globs
- engine aliasing and theme providers

Pros:

- Correct ownership boundary.
- One place for addon policy and preview contracts.
- Makes app package dependencies cleaner.

Cons:

- Requires script and path migration.

#### Option B: Keep inventory host, formalize contract

Retain location but codify it as workspace-owned in docs and naming. Lower migration cost, but still confusing long-term.

### Storybook API/Structure Suggestions

1. Standardize app stories on `createStoryHelpers`.
2. Remove legacy decorators file.
3. Add Storybook render smoke that imports and renders all app entry stories via test renderer.
4. Add Storybook “visual contract” stories for token tiers and part registry coverage.

Pseudocode sketch:

```ts
// packages/storybook-workbench/src/stories/contracts/ThemeContract.stories.tsx
export const TokenGrid = () => <TokenInspector tokens={coreTokenList} />;
export const PartCoverage = () => <PartCoverageTable parts={PARTS} />;
```

## State Management Audit

### Topology Summary

Current state management is split into:

- Engine-level reducers for windowing/runtime/notifications/debug
- App domain reducers (inventory/sales/tasks/crm/books)
- Inventory-specific high-complexity chat runtime (`chat`, `artifacts`)
- Engine legacy/general streaming chat reducer (`streamingChat`)

### Key Issues

#### Issue S1: Two chat systems with unclear ownership

- Engine chat: `packages/engine/src/chat/*`
- Inventory chat: `apps/inventory/src/features/chat/*`

CRM store still mounts `streamingChatReducer`:

```ts
streamingChat: streamingChatReducer,
```

But no CRM app usage of chat hooks/selectors/components was found.

Risk:

- Redundant state model and conceptual overhead.
- New features may accidentally choose the wrong chat layer.

Recommendation:

- Decide explicit path: “engine chat as generic module” vs “inventory chat only”.
- Deprecate/remove unused wiring in CRM if no active requirement.

#### Issue S2: Always-on debug state with little/no app usage

`debugReducer` is always mounted by `createAppStore`, yet no app-level usage of `StandardDebugPane`/`useStandardDebugHooks` was found.

Recommendation:

- Make debug reducer opt-in via `createAppStore({ includeDebug: true })` or separate enhancer.

Pseudocode:

```ts
export function createAppStore<T extends Record<string, Reducer>>(
  domainReducers: T,
  opts: { includeDebug?: boolean } = {},
) {
  return configureStore({
    reducer: {
      pluginCardRuntime,
      windowing,
      notifications,
      ...(opts.includeDebug ? { debug: debugReducer } : {}),
      ...domainReducers,
    },
  });
}
```

#### Issue S3: High-fanout dispatch concentrator in inventory chat

`apps/inventory/src/features/chat/InventoryChatWindow.tsx` currently combines:

- websocket envelope handling
- bootstrap hydration from timeline snapshot
- event type routing
- multi-slice dispatch fan-out
- artifact runtime-card registration
- widget rendering decisions
- debug window opening actions

At 808 lines, this file is beyond comfortable review/ownership size.

Recommendation:

Split by function boundary:

- `chatIngestionService.ts`: websocket + envelope queue
- `semDispatcher.ts`: event type routing to action intents
- `timelineHydrator.ts`: snapshot hydrate logic
- `chatUiBridge.ts`: React adapter hooks

Pseudocode architecture:

```ts
// Ingestion layer (non-React)
class SemIngestionService {
  onEnvelope(cb) { ... }
  connect(convId) { ... }
}

// Translation layer
function translateEnvelope(env): ChatIntent[] { ... }

// Redux adapter
function applyIntents(dispatch, intents) {
  for (const intent of intents) dispatch(intent.toAction());
}
```

#### Issue S4: Dragging/resizing dispatches every pointermove

Path:

- `useWindowInteractionController` pointermove -> `onMoveWindow`/`onResizeWindow`
- `DesktopShell` callback dispatches `moveWindow`/`resizeWindow`
- reducers mutate store on each event

Also, sort work happens twice:

- selector `selectWindowsByZ`
- `WindowLayer` sorts again locally

Recommendation:

- Keep canonical window state in Redux.
- Add transient drag layer (ref/local state) and commit at frame cadence or pointer-up.
- Remove duplicate sort in `WindowLayer` when caller already provides sorted windows.

Pseudocode (frame-coalesced commit):

```ts
const pending = useRef<Map<id, BoundsDelta>>(new Map());
const rafId = useRef<number | null>(null);

function onPointerMove(id, delta) {
  pending.current.set(id, delta);
  if (rafId.current == null) {
    rafId.current = requestAnimationFrame(() => {
      for (const [id, d] of pending.current) {
        dispatch(moveWindow({ id, x: d.x, y: d.y }));
      }
      pending.current.clear();
      rafId.current = null;
    });
  }
}
```

#### Issue S5: CRUD slice duplication pattern repeated many times

Observed repeated patterns in:

- `apps/crm/src/features/{contacts,companies,deals,activities}/*Slice.ts`
- `apps/book-tracker-debug/src/features/books/booksSlice.ts`
- `apps/todo/src/features/tasks/tasksSlice.ts`
- `apps/inventory/src/features/inventory/inventorySlice.ts`

Common repeated code:

- `cloneSeed()` with `JSON.parse(JSON.stringify(...))`
- `nextId()` scanning existing items
- save/delete/create/reset reducers

Recommendation:

Introduce slice factory utilities for seed cloning and id generation.

Pseudocode:

```ts
function createEntityCrudSlice<T extends { id: string }>(opts: {
  name: string;
  seed: T[];
  idPrefix: string;
}) { ... }
```

### Secondary State Findings

1. `createDSLApp` appears unused by apps and includes stale example comments (`navShortcuts`, `snapshotSelector` not in interface). Either adopt or deprecate.
2. `selectConversationIds` in inventory chat selectors appears unused.
3. `ChatSidebar`/`RuntimeDebugPane` appear story-driven and not used by apps currently; keep if strategic, otherwise move to “experimental/legacy” namespace.

## Duplication, Legacy, and Mess Hotspots

### App Scaffolding Duplication

Files with high structural duplication:

- `apps/*/src/main.tsx`
- `apps/*/src/app/store.ts`
- `apps/*/src/domain/stack.ts`
- `apps/*/src/domain/pluginBundle.ts`
- `apps/*/vite.config.ts`
- `apps/*/tsconfig.json`

`stack.ts` repetition example pattern:

```ts
interface PluginCardMeta { id: string; title: string; icon: string; }
function toPluginCard(card: PluginCardMeta): CardDefinition { ... }
cards: Object.fromEntries(CARD_META.map((card) => [card.id, toPluginCard(card)])),
```

Recommendation:

- Add `createStackFromMeta` helper in engine app utilities.
- Add shared “app template” package for main/store/vite defaults.

### Runtime Logging and Debug Noise in Product Path

Runtime logging found in active components:

- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
- `packages/engine/src/plugin-runtime/runtimeCardRegistry.ts`

Recommendation:

- Replace direct `console.*` with gated logger (`if (import.meta.env.DEV && debugFlag)`).
- Route important warnings into notification/debug panels where appropriate.

### Large-File Complexity Concentration

Largest files include:

- `packages/engine/src/components/widgets/ChatWindow.stories.tsx` (1092)
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx` (808)
- `apps/inventory/src/features/chat/chatSlice.ts` (629)
- `packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx` (500)

Risk:

- Review fatigue and bug-prone edits.
- Poor modular testability.

Recommendation:

- Apply “max 250-300 LOC per core module” target for runtime files.
- Split large stories into scenario-focused story modules.

### Legacy and Removal Candidates

Strong candidates:

1. `apps/inventory/src/stories/decorators.tsx` (explicitly legacy).
2. Empty directories:
   - `packages/engine/src/features/navigation`
   - `apps/crm/src/domain/cards`
   - `apps/book-tracker-debug/src/domain/cards`
3. Unused/unclear APIs:
   - `packages/engine/src/app/createDSLApp.tsx` (if not adopted)
   - CRM `streamingChat` slice wiring (if unneeded)

Soft candidates (deprecate first):

- `ChatSidebar` and standard debug pane path, if strategy confirms inventory-specific chat/runtime debug superseded them.

## CSS and Design-System Reusability Audit

### Current CSS Architecture

Current theme layer:

- `packages/engine/src/theme/base.css` (914 lines)
- `packages/engine/src/theme/classic.css` (15 lines)
- `packages/engine/src/theme/modern.css` (19 lines)
- `packages/engine/src/theme/HyperCardTheme.tsx`

Strengths:

1. Tokenized `--hc-*` variables are established.
2. Scoped root (`[data-widget="hypercard"]`) is good for embedding.
3. `PARTS` registry exists as explicit contract source.

Weaknesses:

1. `base.css` mixes tokens + component styles + shell styles + syntax highlight + animations.
2. Many hardcoded colors remain in TSX runtime components.
3. Inline-style volume is high (234 occurrences), limiting theme overrides.
4. Token contract drift exists.

### Token Contract Drift (Concrete)

Used but not defined in theme css:

- `--hc-accent`
- `--hc-chat-sidebar-width`
- `--hc-color-bg-panel`
- `--hc-color-border-subtle`
- `--hc-color-danger`

Defined but currently unused:

- `--hc-ai-panel-width`
- `--hc-color-desktop-bg`
- `--hc-color-desktop-grid`
- `--hc-color-highlight`
- `--hc-drawer-max-height`

Implication:

- Theme customization cannot be relied upon as a stable contract.
- Fallback literals in components hide missing tokens.

### Part Contract Drift

Observed counts:

- `data-part` names in codebase: 94
- names in `PARTS` registry: 59

Examples of `data-part` names used but missing from registry:

- `chat-window-*` cluster
- `event-viewer-*` cluster
- `inventory-timeline-*` cluster
- `syntax-highlight`
- `content-area`, `footer-line`, `field-select`

Also, some registry entries are not styled in `base.css` (`card-body`, `card-toolbar`, `chat-input`, `hypercard`).

Implication:

- The part system is not yet authoritative.
- Design-system consumers cannot depend on complete registry coverage.

### Design-System Extraction Strategy (HyperCard DS)

Recommended package split:

```txt
packages/hypercard-design-system/
  src/
    tokens/
      core.css
      semantic.css
      component.css
    parts/
      parts.ts
      contract.test.ts
    components/
      button.css
      windowing.css
      chat.css
      tables.css
      debug.css
    themes/
      classic.css
      modern.css
      high-contrast.css
    bridge/
      HyperCardTheme.tsx
      applyThemeVars.ts
```

Contract goals:

1. Token tiers:
   - Core (raw palette/spacing/typography)
   - Semantic (bg, border, text, status)
   - Component alias tokens (window/chat/button)
2. Authoritative parts registry with test that scans JSX + CSS for drift.
3. Minimal inline styles in runtime components; move to CSS modules or DS style files.
4. Stable package exports (`@hypercard/design-system/base.css`, themes, parts constants).

Pseudocode for drift tests:

```ts
it('all data-part values are registered', () => {
  const partsInJsx = scanDataPartValues('apps', 'packages');
  expect(partsInJsx).toEqualSubsetOf(new Set(Object.values(PARTS)));
});

it('all tokens used via var(--hc-*) are defined in token files', () => {
  const used = scanUsedTokens();
  const defined = scanDefinedTokens();
  expect(used - defined).toEqual(new Set());
});
```

### CSS Cleanup Priorities

1. Move EventViewer and RuntimeCardDebugWindow inline style objects into CSS + token-backed vars.
2. Promote missing but used tokens into `base.css` token contract.
3. Split `base.css` by concern and import order.
4. Add style lint rule for direct hardcoded color literals in runtime (allow in stories/tests only).

## Reorganization Blueprint

### Phase 0: Safety Nets (no behavior change)

1. Add architecture tests for story config consistency and part/token drift.
2. Add state shape contract tests for `createAppStore` with/without optional reducers.
3. Add performance instrumentation counters (dispatch rate and render count) behind dev flag.

### Phase 1: Scaffolding Consolidation

1. Introduce `createHypercardApp` helper in engine for shared main/store/provider wiring.
2. Introduce `createStackFromMeta` helper for domain stack files.
3. Replace duplicated plugin bundle files with small generated wrappers or helper.
4. Consolidate Vite alias setup with shared config function.

Pseudocode:

```ts
// @hypercard/engine/app-scaffold
export function createHypercardApp<T>(opts: {
  App: React.ComponentType;
  createStore: () => Store<T>;
  theme?: string;
}) {
  return function mount(root: HTMLElement) { ... };
}
```

### Phase 2: Storybook Restructure

1. Move Storybook config to workspace-level package.
2. Normalize app stories onto shared helper path.
3. Expand smoke tests to render-level checks for representative stories.
4. Add design-system contract stories.

### Phase 3: State-Management Cleanup

1. Make debug reducer optional.
2. Remove/disable unused streaming chat wiring in CRM if confirmed unused.
3. Split `InventoryChatWindow.tsx` into ingestion/translation/render modules.
4. Add coalesced dispatch for high-frequency event classes and frame-coalesced drag commits.

### Phase 4: CSS/Design-System Extraction

1. Split `base.css` into token + component modules.
2. Register all `data-part` names in central contract.
3. Replace runtime inline styles with part selectors and token vars.
4. Publish DS package exports and migration guide.

## File-Level Cleanup Recommendations

### `apps/inventory/src/features/chat/InventoryChatWindow.tsx`

Problems:

- Too many responsibilities.
- Manual dispatch routing over broad event type space.
- Debug logs in runtime path.

Actions:

1. Extract pure event translators.
2. Keep React file mostly as hook + render bridge.
3. Remove direct logs; use debug channel.

### `packages/engine/src/components/shell/windowing/DesktopShell.tsx`

Problems:

- Handles too many command and orchestration concerns.
- Duplicate sorting with `WindowLayer`.
- Drag path dispatches too frequently.

Actions:

1. Extract command handler map.
2. Remove duplicate sort in child layer.
3. Introduce transient drag state + coalesced commits.

### `packages/engine/src/theme/base.css`

Problems:

- Monolithic file and mixed concern boundaries.
- Token drift and hardcoded color bleed.

Actions:

1. Split by layer (tokens/layout/components/utilities).
2. Normalize missing tokens.
3. Keep variant themes only as override maps.

### `apps/*/src/domain/stack.ts`

Problems:

- Highly repetitive stack-card conversion boilerplate.

Actions:

1. Introduce helper factory.
2. Keep app-specific card metadata only.

## What Can Be Removed or Deprecated

Immediate safe removals:

1. `apps/inventory/src/stories/decorators.tsx` (legacy placeholder).
2. Empty directories:
   - `packages/engine/src/features/navigation`
   - `apps/crm/src/domain/cards`
   - `apps/book-tracker-debug/src/domain/cards`

Candidate removals (after confirmation):

1. CRM `streamingChat` reducer wiring if no product use.
2. `createDSLApp` if not adopted by at least one app and no roadmap target.
3. Story-only legacy fixtures/comments no longer reflecting runtime behavior.

Candidate deprecations:

1. Generic engine chat API path if inventory-style chat is now canonical architecture.
2. Unused debug pane APIs if replaced by inventory runtime diagnostics.

## Documentation Plan (What Should Be Written)

### 1) Frontend Architecture Map

File suggestion: `docs/frontend/architecture-overview.md`

Content:

- Layer model (engine primitives vs app domain)
- Store composition contract
- Windowing and plugin runtime flow
- Chat/event pipeline ownership map

### 2) Storybook Ownership and Conventions

File suggestion: `docs/frontend/storybook-conventions.md`

Content:

- Story location rules
- Decorator/theming contract
- App story helper conventions
- Render smoke and CI expectations

### 3) State-Management Guide

File suggestion: `docs/frontend/state-management.md`

Content:

- Durable vs ephemeral state policy
- Reducer optionality (`debug`, experimental slices)
- High-frequency event handling patterns
- Selector memoization and re-render rules

### 4) HyperCard Design-System Contract

File suggestion: `docs/frontend/design-system.md`

Content:

- Token taxonomy and naming rules
- `PARTS` registry requirements
- How to add a new component style safely
- Theme variant rules and accessibility baseline

### 5) App Scaffolding Handbook

File suggestion: `docs/frontend/new-app-checklist.md`

Content:

- How to scaffold new app with shared helpers
- Required files and minimal customization points
- Tests, stories, and docs requirements before merge

## Implementation Plan (Concrete)

### Sprint 1 (low-risk cleanup and guardrails)

1. Remove legacy decorators file and empty dirs.
2. Add drift tests:
   - token usage vs definitions
   - data-part usage vs PARTS registry
3. Remove duplicate sorting (`WindowLayer`) when already sorted upstream.
4. Replace runtime debug logs with gated logger.

### Sprint 2 (structural extraction)

1. Create shared app scaffolding helper.
2. Refactor app `main.tsx` and `store.ts` to consume shared helper.
3. Introduce stack factory helper and migrate one app first (todo).
4. Move Storybook config to workspace-level package.

### Sprint 3 (state and CSS modernization)

1. Make `debug` reducer optional.
2. Split `InventoryChatWindow` into ingestion/router/render modules.
3. Add drag coalescing layer and measure dispatch drop.
4. Split `base.css` and migrate first debug/event components off inline style.

### Sprint 4 (design-system rollout)

1. Publish DS entry points and exports.
2. Migrate component families progressively (windowing -> chat -> data views).
3. Add DS stories and visual regression snapshots.
4. Write and enforce docs contracts.

## Alternatives Considered

### Alternative A: Leave architecture as-is, only optimize hotspots

Pros:

- Lowest near-term cost.

Cons:

- Duplication and drift continue accumulating.
- Design-system reusability remains blocked by inconsistent contracts.
- Future onboarding cost remains high.

Decision: rejected as insufficient for medium-term maintainability.

### Alternative B: Full rewrite of frontend framework boundaries

Pros:

- Could produce a clean architecture in one pass.

Cons:

- High risk and long freeze period.
- Hard to validate incremental behavior parity.

Decision: rejected in favor of phased refactor with guardrails.

### Alternative C: Keep CSS monolith, enforce conventions only

Pros:

- Minimal migration effort.

Cons:

- Hard to police at scale.
- No enforceable package boundary for reusable design-system.

Decision: rejected; explicit package/layer extraction provides clearer contracts.

## Risks and Mitigations

1. Risk: incremental refactor causes subtle behavior regressions.

Mitigation:

- Add focused reducer and interaction tests before moving logic.
- Migrate one app/component family at a time.

2. Risk: developers bypass token/part contracts with inline style.

Mitigation:

- Add lint rules and CI checks.
- Provide ergonomic DS utilities so compliant path is easiest.

3. Risk: Storybook migration disrupts existing workflows.

Mitigation:

- Keep backward-compatible scripts during transition window.
- Add migration notes and path mapping docs.

4. Risk: optional reducers break assumptions in existing selectors.

Mitigation:

- Explicit `hasSlice` selector guards.
- typed helper wrappers for optional slices.

## Review Checklist

Use this checklist during implementation review:

1. No new runtime `console.log` without debug gating.
2. No new unregistered `data-part` names.
3. No new undefined `--hc-*` token usage.
4. Storybook story files use shared helper/decorator policy.
5. High-frequency interaction paths are coalesced or batched.
6. New app scaffolding uses shared bootstrap/config utilities.

## Open Questions

1. Is engine generic streaming chat still a roadmap requirement, or should inventory chat model become canonical?
2. Should debug reducer be opt-in by default for all non-debug apps?
3. Do we want app-specific theme packs, or a single HyperCard DS with domain-level token overrides only?
4. Should event viewer remain app-local or become an engine-level diagnostic module with pluggable transports?
5. What is the target CI signal for visual regressions (Storybook test runner vs external snapshots)?

## Proposed Acceptance Criteria for This Cleanup Program

1. App bootstrap duplication reduced by at least 50% measured by file-template elimination.
2. Storybook config ownership moved out of inventory app path or formally documented and standardized.
3. `InventoryChatWindow.tsx` reduced to <= 300 lines with separated ingestion/router modules.
4. Drag/resize dispatch rate reduced significantly under pointer stress (target <= 1 dispatch/frame/window).
5. Inline runtime style occurrences reduced from 234 to <= 120 in first pass.
6. All `data-part` values in runtime code are represented in `PARTS` and tested.
7. All `var(--hc-*)` usages reference defined tokens.

## References

- `apps/inventory/.storybook/main.ts`
- `apps/inventory/.storybook/preview.ts`
- `apps/inventory/src/stories/FullApp.stories.tsx`
- `apps/inventory/src/stories/decorators.tsx`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/chatSlice.ts`
- `apps/inventory/src/features/chat/EventViewerWindow.tsx`
- `apps/inventory/src/features/chat/eventBus.ts`
- `apps/inventory/src/features/chat/InventoryTimelineWidget.tsx`
- `apps/inventory/src/features/chat/RuntimeCardDebugWindow.tsx`
- `packages/engine/src/app/createAppStore.ts`
- `packages/engine/src/app/createDSLApp.tsx`
- `packages/engine/src/app/generateCardStories.tsx`
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/components/shell/windowing/WindowLayer.tsx`
- `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`
- `packages/engine/src/features/windowing/windowingSlice.ts`
- `packages/engine/src/features/windowing/selectors.ts`
- `packages/engine/src/parts.ts`
- `packages/engine/src/theme/base.css`
- `packages/engine/src/theme/HyperCardTheme.tsx`
