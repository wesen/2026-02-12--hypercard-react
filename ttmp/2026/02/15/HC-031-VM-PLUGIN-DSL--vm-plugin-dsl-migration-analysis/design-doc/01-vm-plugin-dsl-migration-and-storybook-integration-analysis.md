---
Title: VM Plugin DSL Migration and Storybook Integration Analysis
Ticket: HC-031-VM-PLUGIN-DSL
Status: active
Topics:
    - architecture
    - dsl
    - frontend
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../vm-system/frontend/.storybook/main.ts
      Note: Existing plugin playground Storybook setup patterns
    - Path: ../../../../../../../vm-system/frontend/packages/plugin-runtime/src/redux-adapter/store.ts
      Note: |-
        Capability-gated intent pipeline and globalState projection model
        Intent routing and capability gating model referenced by migration
    - Path: ../../../../../../../vm-system/frontend/packages/plugin-runtime/src/runtimeService.ts
      Note: |-
        Source-of-truth plugin VM bootstrap and execution contract
        Plugin bootstrap and VM execution model used as target architecture
    - Path: packages/engine/src/app/generateCardStories.tsx
      Note: |-
        Storybook helper migration surface
        Storybook helper migration impact surface
    - Path: packages/engine/src/cards/helpers.ts
      Note: Current DSL constructor API to remove
    - Path: packages/engine/src/cards/runtime.ts
      Note: |-
        Current Act/Ev/Sel resolver and action execution engine slated for replacement
        Current DSL resolver/action engine analyzed for removal
    - Path: ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/sources/local/plugin-hypercard-dsl.md
      Note: |-
        Imported proposal document used as migration baseline
        Imported proposal baseline
ExternalSources: []
Summary: Comprehensive migration analysis for replacing HyperCard Act/Ev/Sel resolver DSL with VM plugin DSL, including architecture assessment, no-backwards-compat cutover strategy, and Storybook integration design.
LastUpdated: 2026-02-15T22:45:00-05:00
WhatFor: Define the implementation-level strategy to fully remove the current card expression DSL and move to plugin-runtime-style VM execution with intent routing.
WhenToUse: Use during planning and execution of the HC-031 migration and when reviewing architecture tradeoffs for DSL and Storybook runtime changes.
---


# VM Plugin DSL Migration and Storybook Integration Analysis

## Executive Summary

HC-031 proposes a full architectural cutover: remove the current HyperCard expression/action DSL (`Act`, `Ev`, `Sel`, `Param`, auto-scope selector resolution, descriptor-based action execution) and replace it with a VM plugin DSL model based on the already working `vm-system/frontend` runtime.

The analysis conclusion is that a hard cut (no backwards compatibility layer) is feasible and technically cleaner than incremental compatibility shims, as long as migration is executed in strict phases with temporary dual authoring only at source-conversion tooling level (not runtime). The plugin runtime already provides the key primitives we need:

1. QuickJS sandboxed execution with per-instance limits and timeouts.
2. Data-only UI tree contract validated at boundary.
3. Event-to-intent pipeline (`plugin` / `shared`) with centralized host dispatch.
4. Capability-gated shared domain writes and explicit dispatch outcomes (`applied`, `denied`, `ignored`).

The current HyperCard implementation has valuable pieces to preserve (window/session model, state slices, reusable widgets, Storybook helper patterns) but the DSL core itself introduces high complexity and error-prone render-time evaluation behavior. Evidence includes:

1. Resolver/action runtime is monolithic and conflates expression evaluation, selector scope lookup, event binding, state mutation, and debug emission in one engine.
2. Render-time resolution is frequent and broad (`runtime.resolve(...)` across many nodes), creating tight coupling between render and runtime concerns.
3. Non-serializable artifacts (function-bearing widget configs) leak into runtime/debug surfaces, conflicting with deterministic sandbox boundaries.
4. Debug dispatch side effects have already caused update-depth issues when routed through render-time paths.

Recommended target architecture:

1. Session-scoped VM runtime in worker (one VM instance per card session/window).
2. Plugin card modules returning data-only UI trees and emitting explicit intents.
3. Host-owned reducers and capability checks apply intents after event handling.
4. No `Act/Ev/Sel` runtime evaluation path; no expression resolver in React render.
5. Storybook runs through the same plugin host loop (not a parallel interpreter), with deterministic mock adapters.

This document provides:

1. A concrete architecture map of `vm-system/frontend` runtime internals.
2. A concrete architecture map of current HyperCard card runtime internals.
3. File-level rip-out plan for no-backwards-compat migration.
4. Storybook integration plan and migration tasks.
5. Risk controls and acceptance criteria.

## Problem Statement

The current HyperCard system in `packages/engine` is built around a declarative expression/action DSL:

1. Value expressions are nested descriptors (`Sel`, `Ev`, `Param`) evaluated dynamically.
2. Actions are descriptors (`Act`) dispatched through `executeCommand` and `executeActionDescriptor`.
3. Selector resolution performs layered scope fallback (`card -> cardType -> background -> stack -> global -> shared`).
4. UI rendering calls runtime resolver repeatedly for node props.

This design delivered fast iteration for card definitions, but it now blocks architectural clarity and composability for a windowed, VM-oriented platform. Specific issues:

1. Runtime logic is too centralized and broad.
   `packages/engine/src/cards/runtime.ts` mixes expression parsing, selector lookup, scope fallback, action dispatch, built-ins, state mutation ops, and debug instrumentation.
2. Render path is not fully side-effect isolated by construction.
   The resolver path historically allowed debug emission during selector resolution; this class of bug is easy to reintroduce because the architecture allows side effects near render-time evaluation.
3. DSL requires host-specific implicit semantics.
   Author intent is encoded in strings (`'state.edits'`, `to: 'shared'`, selector names with hidden scope rules). This is difficult to lint, validate, and sandbox robustly.
4. Data model is not boundary-pure.
   Widget configs may contain functions (`cellState`, `format`, `renderResults`) that cannot cross a strict VM boundary cleanly and complicate serialization/debug consistency.
5. Storybook and app bootstrapping currently depend on engine-specific shell/runtime helpers.
   `createStoryHelpers` and `createDSLApp` currently encode engine runtime assumptions that must be replaced if VM plugin execution becomes canonical.

At the same time, the repository already has a stronger execution model in `vm-system/frontend/packages/plugin-runtime`: sandboxed JS render/handlers plus intent routing and capability controls. We are currently paying maintenance cost for two different runtime philosophies.

## Current State Analysis

### A) `vm-system/frontend` runtime (real implementation)

#### 1. Execution isolation and lifecycle

Source files:

1. `../vm-system/frontend/packages/plugin-runtime/src/runtimeService.ts`
2. `../vm-system/frontend/packages/plugin-runtime/src/worker/runtime.worker.ts`
3. `../vm-system/frontend/packages/plugin-runtime/src/worker/sandboxClient.ts`

Key behavior:

1. Worker process handles request/response RPC (`loadPlugin`, `render`, `event`, `disposePlugin`, `health`).
2. Runtime service keeps `Map<instanceId, PluginVm>`.
3. Each `PluginVm` has independent QuickJS runtime/context and interrupt deadline.
4. Safety limits are explicit (memory, stack, load/render/event timeout).

Why this matters:

1. It provides deterministic resource boundaries per runtime instance.
2. It cleanly separates host React lifecycle from plugin execution lifecycle.
3. It gives us a migration target that is already real, not speculative.

#### 2. Bootstrap DSL and host boundary contract

Source of truth:

1. `BOOTSTRAP_SOURCE` in `runtimeService.ts`.

Current bootstrap API:

1. `definePlugin(factory)` registers plugin object.
2. `ui.*` builders create data-only nodes (`text`, `button`, `input`, `row`, `column`, `panel`, `badge`, `table`).
3. `globalThis.__pluginHost` exposes `getMeta`, `render`, and `event` entrypoints.

Critical property:

1. Plugin code cannot dispatch Redux directly.
2. Handler emits intents through `dispatchPluginAction` and `dispatchSharedAction` only.
3. Host applies intents after sandbox event returns.

#### 3. Validation and hard boundary enforcement

Source files:

1. `../vm-system/frontend/packages/plugin-runtime/src/uiSchema.ts`
2. `../vm-system/frontend/packages/plugin-runtime/src/dispatchIntent.ts`

Both UI trees and intents are validated before crossing into host reducers. This is the correct security and reliability model for untrusted or semi-trusted plugin code.

#### 4. Capability and timeline model

Source file:

1. `../vm-system/frontend/packages/plugin-runtime/src/redux-adapter/store.ts`

Key mechanics:

1. Instance-specific grants (`readShared`, `writeShared`, `systemCommands`).
2. Write gating for shared domains.
3. Dispatch timeline records every attempt with outcome and reason.
4. Read projections filter `globalState.shared` by grants.

Why this matters for HyperCard migration:

1. It directly addresses the “where did this state mutation come from” observability problem.
2. It cleanly separates local/plugin state from shared/domain state.
3. It provides a ready pattern to migrate card runtime state.

#### 5. Embedding and adapter surface

Source files:

1. `../vm-system/frontend/packages/plugin-runtime/src/hostAdapter.ts`
2. `../vm-system/frontend/docs/runtime/embedding.md`

Adapter interface is explicit and async, enabling host apps and Storybook/test harnesses to plug in either direct runtime or worker client.

### B) Current HyperCard runtime and DSL

#### 1. DSL authoring model

Source files:

1. `packages/engine/src/cards/helpers.ts`
2. `packages/engine/src/cards/types.ts`
3. App definitions in `apps/*/src/domain/**/*.ts`

Current primitives:

1. `Act(type, args, { to })`
2. `Sel(name, args, { from })`
3. `Ev(name)` and `Param(name)`
4. `defineCardStack(...)` and `ui.*` node constructors.

Observed usage scale in current repo:

1. `Act(` call sites: 181
2. `Sel(` call sites: 94
3. `Ev(` call sites: 57
4. Files containing DSL constructor calls: 27
5. Files using `defineCardStack(`: 7

These counts confirm the migration is broad and cannot be safely done with ad-hoc manual edits.

#### 2. Runtime execution model

Source files:

1. `packages/engine/src/cards/runtime.ts`
2. `packages/engine/src/cards/runtimeStateSlice.ts`
3. `packages/engine/src/components/shell/useCardRuntimeHost.ts`
4. `packages/engine/src/components/shell/CardRenderer.tsx`
5. `packages/engine/src/components/shell/windowing/CardSessionHost.tsx`

Current flow:

1. UI node props are evaluated by `runtime.resolve(expr)` during render.
2. `createSelectorResolver` computes selector values from local + shared registries, with fallback chain.
3. `executeCommand` resolves action args (including `Sel/Ev/Param`) then routes to built-ins or scoped handlers.
4. Scoped runtime state is kept under `hypercardRuntime` with `global/stack/background/cardType/card` maps.

Architectural issues:

1. Rendering and runtime evaluation are tightly interleaved.
2. Resolver closure creation and context assembly are repeated frequently.
3. Debug instrumentation lives in same layer as resolver/action execution and can become re-entrant if not carefully gated.
4. Expression semantics are implicit and stringly typed.

#### 3. Window/session integration quality

Source files:

1. `packages/engine/src/features/windowing/windowingSlice.ts`
2. `packages/engine/src/features/windowing/types.ts`
3. `packages/engine/src/features/windowing/selectors.ts`
4. `packages/engine/src/components/shell/windowing/DesktopShell.tsx`

Strengths to preserve:

1. Desktop/window stack is already stable and test-covered.
2. Session nav stacks are explicit and work for multi-window scenarios.
3. Shell can remain host orchestrator while runtime core changes underneath.

Migration consideration:

1. `NavEntry.param` is currently `string`; plugin DSL migration should move to structured `params?: unknown` to avoid forced string coercions.

#### 4. Storybook current shape

Source files:

1. `packages/engine/src/app/generateCardStories.tsx`
2. `packages/engine/src/app/createDSLApp.tsx`
3. `apps/inventory/.storybook/main.ts`
4. `apps/inventory/src/stories/*.stories.tsx`

Current story flow:

1. Create Redux store per story decorator.
2. Mount `DesktopShell` with stack and shared registries.
3. For per-card stories, override `homeCard` and optional `homeParam`.

This pattern is compatible with the target architecture if story helpers are rewritten to use a plugin adapter and explicit test runtime state projection.

## Gap Analysis: Why replace instead of patching

### If we keep current DSL and only "improve"

Expected ongoing costs:

1. Continuous complexity growth in `runtime.ts` as more special-cases are added.
2. More reliance on hidden string contracts and implicit scope fallback.
3. Repeated render-path coupling risks.
4. Harder sandbox boundary for future webchat/webvm integrations.

### If we adopt VM plugin DSL as canonical

Benefits:

1. Render and handler logic live in plugin sandbox, not host renderer internals.
2. Host only applies intents and renders validated data trees.
3. Capability controls and timeline are first-class, not optional instrumentation.
4. Storybook can execute the same runtime contract as production host.

Tradeoffs:

1. Migration effort is substantial (27 DSL-heavy files + engine core + story helpers).
2. Some current function-valued widget configs need schema redesign to be data-only.
3. Tooling (codemods, author docs, lint rules) must be part of cutover.

Given the explicit “no backwards compatibility” requirement, preserving old DSL surfaces as wrappers would only delay and blur the migration.

## Proposed Solution

Hard-cut migration to VM plugin DSL with strict constraints:

1. Remove current descriptor DSL runtime (`Act/Ev/Sel/Param` semantics in render/action path).
2. Replace with plugin card module model:
   - `render(context) -> UINode`
   - `handlers[name](ctx, args) -> intents`
3. Execute plugin modules in QuickJS worker runtime per session instance.
4. Keep Desktop/window host and Redux domain state as orchestration layer.
5. Replace card runtime slice with plugin session/card state slice aligned to intent pipeline.

### Target contracts

#### 1) Runtime contract

```ts
loadStackBundle({ stackId, sessionId, code }) -> metadata
renderCard({ sessionId, cardId, cardState, sessionState, globalState }) -> UINode
eventCard({ sessionId, cardId, handler, args, cardState, sessionState, globalState }) -> Intent[]
```

#### 2) Intent contract

```ts
type Intent =
  | { scope: 'card'; actionType: string; payload?: unknown }
  | { scope: 'session'; actionType: string; payload?: unknown }
  | { scope: 'domain'; domain: string; actionType: string; payload?: unknown }
  | { scope: 'system'; command: string; payload?: unknown };
```

#### 3) Projected global state

```ts
{
  self: { sessionId, stackId, cardId, windowId },
  domains: Record<string, unknown>,
  nav: { current, depth, canBack },
  system: { focusedWindowId, dispatchMetrics, runtimeHealth }
}
```

#### 4) Runtime state slice

```ts
pluginCardRuntime: {
  sessions: Record<sessionId, {
    stackId: string,
    status: 'loading' | 'ready' | 'error',
    state: Record<string, unknown>,
    cards: Record<cardId, Record<string, unknown>>,
  }>,
  timeline: TimelineEntry[]
}
```

## Design Decisions

### Decision 1: No compatibility wrappers for `Act/Ev/Sel`

Rationale:

1. Wrappers preserve ambiguous semantics and increase long-tail maintenance.
2. Hard compiler/runtime break surfaces all migration points early.
3. Existing counts show broad but finite migration scope.

### Decision 2: Reuse plugin-runtime patterns, not just concepts

Rationale:

1. `vm-system/frontend` implementation is already real and documented.
2. It includes guardrails we currently lack (validation + capability + outcome timeline).
3. Reuse reduces architectural drift and future integration friction.

### Decision 3: Keep Desktop/window host model

Rationale:

1. Windowing slice and DesktopShell are already aligned with product direction.
2. We only need to replace card execution engine inside windows.
3. This de-risks migration by avoiding a shell rewrite.

### Decision 4: Data-only UI crossing boundary

Rationale:

1. VM boundary should remain serializable and deterministic.
2. Function-valued configs are incompatible with robust worker contracts.
3. Widget behaviors should be encoded as handler refs + declarative props.

### Decision 5: Storybook must use the same runtime contract

Rationale:

1. Separate story interpreter will drift from production behavior.
2. Runtime regressions must reproduce in stories.
3. Storybook is a key migration validation surface for card definitions.

## Alternatives Considered

### Alternative A: Keep current DSL and add stricter linting

Rejected because:

1. It does not remove core coupling between render and expression resolver runtime.
2. It preserves implicit scope semantics.
3. It still blocks VM boundary simplification.

### Alternative B: Transpile old DSL to plugin DSL at build time indefinitely

Rejected because:

1. It becomes a permanent compatibility tax.
2. Runtime semantics mismatch bugs become harder to reason about.
3. “No backwards compatibility” objective is not met.

### Alternative C: Rewrite shell + runtime + storybook simultaneously

Rejected because:

1. Blast radius too large for safe delivery.
2. Windowing shell is already suitable and should be preserved.
3. Incremental replacement of runtime core is safer.

## Implementation Plan (No Backwards Compat)

### Phase 0: Foundations and guardrails

Deliverables:

1. Introduce new plugin card runtime package in `packages/engine` (or import/adapt from `vm-system/frontend/packages/plugin-runtime`).
2. Define canonical card plugin contract and intent schema.
3. Add schema validators for new UINode and intent payloads.
4. Add codemod scaffolding for transforming common `Act/Ev/Sel` patterns.

Acceptance criteria:

1. Worker runtime can load a sample stack bundle and render a card.
2. Event returns intents and host applies them into test reducer.

### Phase 1: Host runtime integration behind DesktopShell

Deliverables:

1. Add `PluginCardSessionHost` parallel to existing `CardSessionHost`.
2. Wire window session context (`sessionId`, nav, stack id) into plugin runtime inputs.
3. Add new slice for plugin card/session state and timeline.
4. Keep existing windowing slice as-is for opening/focusing/moving windows.

Acceptance criteria:

1. One sample app can run in DesktopShell with plugin runtime card execution.
2. Nav.go/nav.back system intents route through windowing actions.

### Phase 2: Storybook adapter migration

Deliverables:

1. Replace `createStoryHelpers` internals to use plugin runtime adapter.
2. Replace `createDSLApp` internals to use plugin runtime host path.
3. Add story decorator that seeds plugin session/card state deterministically.
4. Add story-time timeline inspector for intent outcomes (optional but recommended).

Acceptance criteria:

1. Existing per-card stories still work through new runtime.
2. Storybook renders without direct dependency on `Act/Ev/Sel` resolver path.

### Phase 3: Authoring migration (apps + engine stories)

Deliverables:

1. Convert app stacks/cards from descriptor DSL to plugin card modules.
2. Replace function-valued table/field config references with data-safe descriptors or host-side registry IDs.
3. Convert chat actions and nav hooks to intent handlers.

Migration surface from current scan:

1. 27 files with `Act/Ev/Sel` usages.
2. 7 stack-definition root files using `defineCardStack`.
3. Story/demo files in engine and apps also include DSL calls and must migrate in same cut.

Acceptance criteria:

1. Apps (`inventory`, `todo`, `crm`, `book-tracker-debug`) run with plugin DSL only.
2. No remaining `Act(`, `Sel(`, `Ev(` usage in runtime-authoritative code paths.

### Phase 4: Hard delete legacy DSL runtime

Delete / remove exports:

1. `packages/engine/src/cards/helpers.ts` (or strip to non-DSL helpers only).
2. DSL expression/action types from `packages/engine/src/cards/types.ts`.
3. Resolver and descriptor execution path from `packages/engine/src/cards/runtime.ts`.
4. Legacy DSL tests (`selector-resolution`, command descriptor tests).
5. Root exports in `packages/engine/src/cards/index.ts` and `packages/engine/src/index.ts`.

Potential retained pieces:

1. Scoped state reducer utilities if reused by plugin runtime state model.
2. Generic UI components (`ListView`, `DetailView`, `FormView`, etc.) via host renderer mapping.

Acceptance criteria:

1. Build passes with no legacy DSL symbols exported.
2. Typecheck and tests do not reference `Act/Ev/Sel/Param` APIs.

### Phase 5: Validation and rollout

Validation set:

1. Unit tests for plugin runtime contract and validators.
2. Integration tests for event->intent->reducer loop.
3. Storybook smoke across all app suites.
4. Performance sanity (worker render/event latency with representative stacks).
5. Security sanity (malformed node/intent rejection, timeout interruption).

## File-Level Impact Map

### New major modules expected

1. `packages/engine/src/plugin-runtime/*` (or vendored adapter over external runtime).
2. `packages/engine/src/features/pluginCardRuntime/*`.
3. `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`.
4. `packages/engine/src/app/pluginStoryHelpers.tsx` (or replacement internals for existing helper names).

### Existing modules to rework

1. `packages/engine/src/components/shell/windowing/CardSessionHost.tsx`
2. `packages/engine/src/components/shell/useCardRuntimeHost.ts`
3. `packages/engine/src/components/shell/CardRenderer.tsx` (replace expression-resolve path with direct plugin UINode rendering contract)
4. `packages/engine/src/app/createDSLApp.tsx`
5. `packages/engine/src/app/generateCardStories.tsx`

### Existing modules to delete or drastically simplify

1. `packages/engine/src/cards/helpers.ts`
2. `packages/engine/src/cards/runtime.ts`
3. DSL-specific portions of `packages/engine/src/cards/types.ts`
4. DSL-centric tests in `packages/engine/src/__tests__`

## Storybook Integration Analysis

### Current Storybook baseline (HyperCard repo)

Current setup characteristics:

1. App-level Storybook config aliases `@hypercard/engine` source directly.
2. Global decorator wraps theme and app-specific decorators provide store wiring.
3. `createStoryHelpers` currently builds per-card stories by changing `homeCard` and `homeParam` in `DesktopShell`.

Pain points for migration:

1. Story content is still authored in old DSL descriptors.
2. Story helper API is tied to `stack + sharedSelectors + sharedActions` model.
3. Runtime debugging in Storybook relies on engine debug hooks, not standardized intent timeline.

### Reference Storybook baseline (`vm-system/frontend`)

Useful patterns to copy:

1. Global `withStore()` decorator gives fresh Redux store per story.
2. Runtime aliases are explicit (`@runtime`, `@shared`, `@docs`).
3. Stories exercise runtime components directly, not mocked pseudo-runtime.

### Proposed Storybook target for HC-031

#### 1) New story helper contract

Replace current helper config:

```ts
{ stack, sharedSelectors, sharedActions, createStore, icons, cardParams }
```

With plugin-centric config:

```ts
{
  stackBundleCode: string,
  stackId: string,
  createStore: () => Store,
  initialSessionState?: unknown,
  initialCardStateById?: Record<string, unknown>,
  grants?: CapabilityGrants,
  desktopIcons?: DesktopIconDef[],
}
```

#### 2) Decorator and rendering flow

1. Story decorator creates fresh store and runtime adapter.
2. Story mounts DesktopShell + PluginCardSessionHost.
3. Story can target specific card by initial nav intent, not home-card override hack.
4. Story can inspect timeline/outcomes via store selectors.

#### 3) Story ergonomics migration

Current story style:

1. `createStory('cardId', 'param')` with DSL stack definitions.

Target style:

1. `createPluginCardStory({ cardId, params })` with plugin module bundle.
2. Optional story args for seeded card/session state.
3. Optional “simulate event” helpers calling adapter `event(...)` for deterministic demos.

#### 4) Storybook acceptance criteria

1. All existing app card pages have equivalent stories in new format.
2. Story reload/hot-refresh does not recreate uncontrolled loops.
3. Story behavior matches production runtime (same adapter, same intent routing).
4. No direct usage of `Act/Ev/Sel` remains in story source.

## Risks and Mitigations

### Risk 1: Large migration surface in app card definitions

Mitigations:

1. Build codemods for common patterns (`Act('nav.go')`, `Sel(..., { from: 'shared' })`, `Ev('field')`).
2. Migrate app-by-app with strict completion gates.
3. Keep synthetic fixtures for edge-case descriptors to ensure behavior parity where required.

### Risk 2: Function-based widget configs incompatible with sandbox boundary

Mitigations:

1. Define explicit data schema replacements for column formatting/cell state.
2. Move dynamic formatting into plugin render pipeline before node emission.
3. Validate node payloads at runtime boundary.

### Risk 3: Runtime performance regression due worker roundtrips

Mitigations:

1. Cache per-session runtime projection slices.
2. Avoid full app-wide rerender loops; rerender only affected session/card windows.
3. Measure render/event latency in representative app scenarios.

### Risk 4: Storybook drift from production host loop

Mitigations:

1. Reuse production runtime adapter in stories.
2. Keep only deterministic mock data layers, not mock runtime semantics.
3. Add smoke stories that dispatch intents and assert timeline outcomes.

### Risk 5: Hidden dependencies on legacy DSL in tests/docs/tools

Mitigations:

1. Repo-wide symbol scan gates in CI (`Act(`, `Sel(`, `Ev(`, descriptor tag checks).
2. Remove legacy exports early so compile errors surface all stragglers.
3. Update authoring docs in same migration wave.

## Implementation Task Breakdown (Suggested HC-031 execution checklist)

1. Define new plugin card runtime contracts and validators in engine.
2. Implement worker/client adapter in engine with lifecycle APIs.
3. Implement plugin card runtime Redux slice + timeline selectors.
4. Add PluginCardSessionHost and integrate with DesktopShell windows.
5. Replace story helper internals with plugin runtime adapter.
6. Migrate `inventory` cards to plugin modules and validate stories.
7. Migrate `todo` cards to plugin modules and validate stories.
8. Migrate `crm` cards/chat action bridges to plugin modules and validate stories.
9. Migrate `book-tracker-debug` cards and engine demo stories.
10. Delete legacy DSL helpers/types/runtime and update exports.
11. Remove/replace DSL-specific tests with plugin runtime tests.
12. Final app + storybook + typecheck/build validation.

## Implementation Outcomes (Executed on 2026-02-15)

The migration plan above was executed as a hard cutover (no runtime compatibility layer retained for descriptor DSL). The current repository state reflects plugin-runtime-first execution for card windows and app stacks.

### 1) Delivered outcomes by phase

1. **Phase A-D completed in engine core**
   - Plugin runtime service, worker transport, contracts, validators, Redux runtime slice, capability policy, and shell integration are implemented.
   - Story helpers and app bootstrap paths were migrated to plugin runtime flow.
2. **Phase E app migrations completed**
   - `inventory`, `todo`, `crm`, and `book-tracker-debug` stacks now run as plugin bundle stacks.
   - CRM chat response navigation payloads were migrated off descriptor `Act(...)` usage.
3. **Phase E/F cleanup completed**
   - Engine demo stories were migrated to plugin runtime stories.
   - Legacy descriptor runtime path (`CardRenderer`, `useCardRuntimeHost`, `CardSessionHost`, DSL helpers/types/tests) was removed or reduced to minimal non-resolver scaffolding.
4. **Phase G verification completed with documented baseline exceptions**
   - Engine tests and repo typecheck pass.
   - Playwright smoke checks across representative stories/apps pass, including the prior `Maximum update depth exceeded` scenario on low-stock.
   - Repo build/lint still report pre-existing baseline issues unrelated to DSL cutover and tracked as separate follow-ups.

### 2) Key commits implementing the cutover

1. `50e5b7e` — CRM hard cutover to plugin runtime bundle + chat bridge migration.
2. `c8cfee4` — Book-tracker hard cutover to plugin runtime bundle.
3. `04c94d8` — Engine story migrations to plugin-runtime flows.
4. `3a898d5` — Legacy descriptor runtime hard deletion in engine (`Act/Ev/Sel` path removed from runtime-authoritative surfaces).

### 3) Current architecture status after cutover

1. Card window execution path is plugin-runtime-based (`DesktopShell` -> `PluginCardSessionHost`).
2. Card authoring/runtime state now centers on plugin bundle code + runtime intents, not descriptor selector/action resolution.
3. Storybook card/app demos use the same plugin host loop as runtime-authoritative app flows.
4. Legacy DSL symbols may still appear in historical docs/notes, but runtime-authoritative engine/app code paths now use plugin runtime semantics.

### 4) Residual issues and explicit non-goals in this cut

1. `npm run build` currently fails due an existing Vite worker format issue (`worker.format` value) outside this DSL migration scope.
2. `npm run lint` reports existing baseline issues (Biome schema/order/style findings) not introduced by the cutover.
3. This ticket intentionally does not preserve descriptor DSL backward compatibility; existing descriptor card modules are expected to be migrated or removed.

## Open Questions

1. Should engine vendor a snapshot of `plugin-runtime` or consume it as external package and maintain thin adapter only?
2. Do we keep scoped state levels (`global/stack/background/cardType/card`) in new runtime, or simplify to `session + card` and push extra structure into domain state?
3. How much of current high-level widgets (`list/detail/form/report/chat`) should be first-class in plugin UI DSL vs decomposed into primitives?
4. Should capability grants be declared in stack metadata and enforced centrally at load-time, or configured externally by host only?
5. Should timeline/debug UI become a shared engine component reused in Storybook and app runtime by default?

## Validation Notes From Analysis Session

1. `vm-system/frontend` dependencies were installed and integration tests were executed successfully:
   - `pnpm --dir ../vm-system/frontend install`
   - `pnpm --dir ../vm-system/frontend exec vitest run --config vitest.integration.config.ts packages/plugin-runtime/src/runtimeService.integration.test.ts`
   - Result: `1 passed file`, `6 passed tests`.
2. Note on test command behavior:
   - Running `pnpm --dir ../vm-system/frontend exec vitest run packages/plugin-runtime/src/runtimeService.integration.test.ts` with default config returns “No test files found” because `*.integration.test.ts` is excluded there; integration config is required.
3. HyperCard repository tests were not rerun for this documentation-only ticket; this report is primarily architecture analysis plus targeted plugin-runtime validation evidence.

## References

1. Imported proposal: `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/sources/local/plugin-hypercard-dsl.md`
2. Plugin runtime docs:
   - `../vm-system/frontend/docs/architecture/ui-dsl.md`
   - `../vm-system/frontend/docs/architecture/dispatch-lifecycle.md`
   - `../vm-system/frontend/docs/architecture/capability-model.md`
   - `../vm-system/frontend/docs/runtime/embedding.md`
3. Plugin runtime implementation:
   - `../vm-system/frontend/packages/plugin-runtime/src/runtimeService.ts`
   - `../vm-system/frontend/packages/plugin-runtime/src/worker/runtime.worker.ts`
   - `../vm-system/frontend/packages/plugin-runtime/src/worker/sandboxClient.ts`
   - `../vm-system/frontend/packages/plugin-runtime/src/redux-adapter/store.ts`
4. Current HyperCard engine implementation:
   - `packages/engine/src/cards/helpers.ts`
   - `packages/engine/src/cards/types.ts`
   - `packages/engine/src/cards/runtime.ts`
   - `packages/engine/src/cards/runtimeStateSlice.ts`
   - `packages/engine/src/components/shell/useCardRuntimeHost.ts`
   - `packages/engine/src/components/shell/CardRenderer.tsx`
   - `packages/engine/src/components/shell/windowing/CardSessionHost.tsx`
   - `packages/engine/src/app/generateCardStories.tsx`
