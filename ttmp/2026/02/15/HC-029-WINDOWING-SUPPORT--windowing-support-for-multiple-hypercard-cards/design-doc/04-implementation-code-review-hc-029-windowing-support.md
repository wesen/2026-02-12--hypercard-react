---
Title: 'Implementation Code Review: HC-029 Windowing Support'
Ticket: HC-029-WINDOWING-SUPPORT
Status: active
Topics:
    - frontend
    - ux
    - architecture
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/App.tsx
      Note: App-level cutover to DesktopShell
    - Path: packages/engine/src/__tests__/windowing.test.ts
      Note: Unit coverage for reducer and selector invariants
    - Path: packages/engine/src/cards/runtime.ts
      Note: DSL built-in nav behavior and context assumptions
    - Path: packages/engine/src/cards/runtimeStateSlice.ts
      Note: Runtime state ownership and cleanup limitations
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: |-
        Legacy shell used as behavior baseline and duplication comparison
        Baseline behavior comparison for duplication and compatibility
    - Path: packages/engine/src/components/shell/windowing/CardSessionHost.tsx
      Note: |-
        Per-window runtime bridge from card DSL to session nav
        Runtime/session integration risk analysis
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: |-
        Orchestrator that maps windowing state to UI primitives and command handlers
        Primary shell orchestration reviewed in depth
    - Path: packages/engine/src/components/shell/windowing/WindowSurface.tsx
      Note: |-
        Window accessibility semantics and focus behavior
        Focus and accessibility findings
    - Path: packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: Shared pointer drag/resize controller
    - Path: packages/engine/src/features/windowing/selectors.ts
      Note: Public read model for desktop and session state
    - Path: packages/engine/src/features/windowing/windowingSlice.ts
      Note: |-
        Core state transitions for open/focus/close/move/resize and session nav
        Reducer policy and invariants review
    - Path: packages/engine/src/theme/base.css
      Note: Windowing visual system and desktop chrome
ExternalSources: []
Summary: Deep implementation and architecture review of HC-029, including onboarding walkthrough, severity-ranked findings, and a follow-up plan for safe windowing platform growth.
LastUpdated: 2026-02-15T11:52:00-05:00
WhatFor: Explain the new windowing implementation in detail and identify correctness, quality, and extensibility risks before broader app rollout.
WhenToUse: Use when onboarding developers to the HC-029 implementation, preparing remediation work, or planning additional app/DSL integrations on top of windowing.
---


# Implementation Code Review: HC-029 Windowing Support

## Executive Summary

HC-029 introduced a substantial and valuable new capability: a desktop/windowing shell that can host multiple HyperCard card sessions concurrently. The implementation includes a new Redux windowing slice, a component primitive set (menu bar, icon layer, window layer/surface/title/resize), a per-window runtime bridge (`CardSessionHost`), Storybook coverage, and the first production app cutover (`apps/inventory`).

The implementation is productive and shipped with strong reducer-level tests (47 new unit tests in `windowing.test.ts`). The main risks are not basic reducer correctness but integration and architecture consistency. The most important risk is a compatibility regression in runtime context semantics: `CardSessionHost` replaces `cardId` with `cardId::sessionId`, which can break existing card DSL actions/selectors that assume canonical card IDs.

In short:
- The feature works and is a strong foundation.
- The codebase currently contains duplication and policy inconsistencies that will become expensive as more apps move to DesktopShell.
- The next phase should prioritize runtime-context correctness, window interaction/accessibility semantics, and extracting shared shell runtime wiring.

## Problem Statement

HC-029 attempts to evolve the engine from a single-card shell model (`HyperCardShell`) to a multi-window desktop model (`DesktopShell`) while preserving existing card DSL behavior.

That migration has three hard constraints:
- Preserve existing card runtime behavior (`nav.go`, `nav.back`, selectors/actions, scoped state mutation semantics).
- Add true multi-window support with isolated per-window navigation and local card state.
- Avoid architecture drift where windowing and legacy shell paths diverge in behavior, API shape, and test strategy.

The current branch has successfully delivered the first two at a functional level, but the third constraint is currently weak due to duplicated runtime orchestration, mixed geometry/focus policy layers, and missing integration tests for session isolation behavior.

## Scope And Methodology

Review scope:
- Commit range analyzed: `d41894c` through `a83d90b` on `task/hypercard-add-webchat`.
- Net diff vs `main`: 40 files changed, ~6.3k insertions.
- Core runtime/state files, UI primitives, stories, CSS, ticket docs, and app integration were inspected.

Validation performed:
- `npm test` passed (95 tests).
- `npm run typecheck` passed.
- `npm run lint` failed due to pre-existing config/schema mismatch and unrelated lint items in existing tests/formatting; no HC-029-specific runtime failure surfaced from lint.

## Functional Walkthrough (For New Developers)

This section explains what was built, how control/data flow works, and where key responsibilities live.

### 1. Store wiring and app entry

`createAppStore` now includes `windowingReducer` (`packages/engine/src/app/createAppStore.ts:26`). This means all engine consumers created through the shared store factory have windowing state available.

`apps/inventory/src/App.tsx:1` switched to `DesktopShell`, making inventory the first app running through the new windowing runtime path.

### 2. Windowing domain model

Windowing state is in `packages/engine/src/features/windowing/types.ts`.

Main structures:
- `WindowInstance`: geometry, z value, min size, content descriptor, optional dedupe key.
- `desktop`: focused window, active menu, selected icon, monotonic z counter.
- `sessions`: per-session nav stacks keyed by `cardSessionId`.

Content model supports `kind: 'card' | 'app' | 'dialog'`. Only `card` is deeply integrated with the HyperCard runtime today.

### 3. Reducer behavior

`windowingSlice.ts` defines reducers for:
- Lifecycle: `openWindow`, `focusWindow`, `closeWindow`.
- Geometry: `moveWindow`, `resizeWindow`.
- Desktop transient UI: active menu and selected icon.
- Session nav: `sessionNavGo`, `sessionNavBack`, `sessionNavHome`.

Important behavior details:
- `openWindow` can dedupe by `dedupeKey` and focus existing windows (`windowingSlice.ts:31`).
- Opening/focusing bumps `desktop.zCounter` and updates per-window `z`.
- `closeWindow` removes session nav for card windows and computes fallback focus from highest remaining z (`windowingSlice.ts:98`).
- Move clamps y >= 0 and allows partial x offscreen (`windowingSlice.ts:117`).

### 4. Selectors and read model

`selectors.ts` exposes the slice query API:
- Desktop signals (`selectFocusedWindowId`, `selectActiveMenuId`, `selectSelectedIconId`).
- Window collections (`selectWindowsInOrder`, `selectWindowsByZ`).
- Session queries (`selectSessionCurrentNav`, `selectSessionNavDepth`).

This read model is what shell components consume; reducers are not read directly in UI.

### 5. Primitive UI layer

Windowing primitives in `packages/engine/src/components/shell/windowing`:
- `DesktopMenuBar.tsx`
- `DesktopIconLayer.tsx`
- `WindowLayer.tsx`
- `WindowSurface.tsx`
- `WindowTitleBar.tsx`
- `WindowResizeHandle.tsx`
- `useWindowInteractionController.ts`

Responsibilities:
- `DesktopMenuBar`: top-level menus and command callbacks.
- `DesktopIconLayer`: icon selection/open gestures.
- `WindowLayer`: deterministic render ordering by z.
- `WindowSurface`: frame chrome + focus + resize handle rendering.
- `useWindowInteractionController`: pointer listeners and movement/resizing deltas.

### 6. DesktopShell orchestration

`DesktopShell.tsx` is the high-level orchestrator. It performs:
- Selector subscriptions (`selectWindowsByZ`, `selectFocusedWindow`, desktop transient states).
- Window-to-view mapping (`toWindowDef`).
- Default icon/menu generation from stack definitions.
- Command routing (`window.open.*`, `window.close-focused`, `window.tile`, `window.cascade`).
- Initial home window opening on mount.
- Window content rendering through `CardSessionHost` for card windows.

The desktop view composition is:
- `DesktopMenuBar`
- `DesktopIconLayer`
- `WindowLayer`
- Optional toast overlay

### 7. CardSessionHost runtime bridge

`CardSessionHost.tsx` is the core integration piece between windowing and card DSL runtime.

For each window session it:
- Reads current nav entry from windowing session state.
- Ensures runtime state exists (`ensureCardRuntime`).
- Builds runtime context (`createCardContext`) with `nav.go/back` bound to session reducers (`sessionNavGo`, `sessionNavBack`).
- Delegates command execution/resolution through existing runtime helpers (`executeCommand`, `resolveValueExpr`, shared selectors/actions).
- Renders with `CardRenderer`.

This is the key mechanism that gives each window its own navigation stack.

### 8. Styling and parts mapping

HC-029 added many new `PARTS` constants (`parts.ts:57`) and matching CSS tokens/rules in `base.css` (`base.css:127` onward), including desktop pattern, menubar/menu states, icon selected states, window title stripe affordances, dialog variant, resize handle, and open animation.

### 9. Test and story support

- Reducer/selectors: strong unit coverage in `windowing.test.ts`.
- Storybook: broad scenario coverage for primitives, shell, session host, and interaction hook.

Current quality profile:
- Strong state-level confidence.
- Weaker integration confidence between `DesktopShell` and runtime internals (currently story-driven more than assertion-driven).

### 10. End-to-end runtime event flow (step-by-step)

This is the practical lifecycle a new developer should understand first.

Flow A: app launch to first rendered card window
- `apps/inventory/src/App.tsx` renders `DesktopShell`.
- `DesktopShell` mount effect opens one home card window with a generated session id (`DesktopShell.tsx:140`).
- `openWindow` creates `WindowInstance`, initializes z, and bootstraps session nav (`windowingSlice.ts:27` and `windowingSlice.ts:60`).
- `DesktopShell` selector pass derives sorted windows and focused window.
- `WindowLayer` renders a `WindowSurface`.
- `renderWindowBody` chooses `CardSessionHost` for `content.kind === 'card'` (`DesktopShell.tsx:254`).
- `CardSessionHost` resolves current nav entry and ensures runtime state (`CardSessionHost.tsx:72`).
- `CardRenderer` receives the card def and runtime adapter and renders UI tree.

Flow B: user presses a card DSL button with `Act('nav.go', { card: 'detail' })`
- Button event is emitted through `CardRenderer` runtime path.
- `executeCommand` reaches built-in `nav.go` handling in runtime (`runtime.ts:375`).
- In `CardSessionHost`, `ctx.nav.go` is wired to `sessionNavGo` for that window session (`CardSessionHost.tsx:154`).
- Session nav stack updates in `windowing.sessions`.
- `selectSessionCurrentNav` now points to the next card.
- `CardSessionHost` recomputes `currentCardId`, ensures runtime for target card/session key, and rerenders.

Flow C: user drags a window
- Title bar pointer down calls `beginMove` from `useWindowInteractionController`.
- Hook installs `window`-level pointer listeners and computes deltas (`useWindowInteractionController.ts:72`).
- `DesktopShell` callback dispatches `moveWindow` with updated coordinates.
- Reducer writes clamped geometry.
- Window rerenders from selector output.

Flow D: user closes a card window
- Close button triggers `closeWindow`.
- Reducer removes window and session nav, recalculates fallback focus (`windowingSlice.ts:85`).
- `DesktopShell` stops rendering that `CardSessionHost`.
- Runtime state map currently retains historical card runtime entries (see CR-6).

### 11. File-by-file implementation map

`packages/engine/src/features/windowing/types.ts`
- Defines the domain language for windowing state.
- Most important developer contract: `WindowInstance.content` and `WindowingState.sessions`.
- This file is stable and readable; it is a strong base for future extension.

`packages/engine/src/features/windowing/windowingSlice.ts`
- Encodes business rules.
- Current policy concerns: id collision behavior, split geometry policy with interaction layer, and no runtime cleanup coupling.

`packages/engine/src/features/windowing/selectors.ts`
- Thin selector layer.
- No memoization needed at current scale, but future heavy desktop scenarios may benefit from memoized derived selectors.

`packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- Main orchestration.
- Handles too many concerns today: menu command router, icon synthesis, window state-to-view mapping, content host selection, and mount-time auto-open policy.
- This file is the center of gravity and likely first refactor target.

`packages/engine/src/components/shell/windowing/CardSessionHost.tsx`
- Critical adapter from card runtime to session nav.
- Duplicates legacy shell runtime wiring and introduces semantic drift (CR-1).
- Future maintainability depends on extracting shared runtime-host logic.

`packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`
- Clean and relatively self-contained.
- The right place for pointer-lifecycle concerns, but constraints should not be policy-authoritative (CR-4).

`packages/engine/src/components/shell/windowing/WindowSurface.tsx`
- Small but high-impact file because it owns focus and accessibility semantics.
- Current focus and role behavior causes multiple high-severity concerns (CR-2, CR-3).

`packages/engine/src/theme/base.css`
- Good tokenization and visual parity effort.
- Interaction semantics and accessibility still need matching JS behavior updates.

`packages/engine/src/__tests__/windowing.test.ts`
- Excellent reducer coverage.
- Missing integration assertions for runtime/session behavior remain the biggest test gap.

## Critical Review (Severity-Ranked Findings)

### Finding CR-1 (Critical): Runtime `cardId` semantic regression in CardSessionHost

Problem:
`CardSessionHost` uses `runtimeCardId = "${currentCardId}::${sessionId}"` as the `cardId` passed into `createCardContext` and debug context (`CardSessionHost.tsx:62`, `CardSessionHost.tsx:145`, `CardSessionHost.tsx:193`).

Evidence:
- New path: `CardSessionHost.tsx:62`, `CardSessionHost.tsx:145`.
- Baseline path: `HyperCardShell.tsx:117`, `HyperCardShell.tsx:191` uses canonical `currentCardId`.

Why it matters:
Card DSL actions/selectors that inspect `ctx.cardId` now receive an instance key (`browse::session-7`) rather than a real card ID (`browse`). Existing logic that indexes `stack.cards[ctx.cardId]`, applies card-level rules, or reports analytics by card ID can break silently.

Impact:
Potential behavior regressions in existing stacks as soon as they move to DesktopShell.

Recommendation:
- Keep canonical `cardId` in runtime context.
- Introduce a separate `runtimeInstanceId` (or `cardInstanceId`) for per-window runtime state keying.
- Extend runtime state APIs to accept both `cardId` and instance key explicitly instead of overloading `cardId`.

### Finding CR-2 (High): Focus events over-increment z-order and dispatch churn

Problem:
`WindowSurface` dispatches focus on both mouse and bubbling focus events (`WindowSurface.tsx:39`, `WindowSurface.tsx:40`). `focusWindow` always increments z (`windowingSlice.ts:75`).

Why it matters:
Any focus movement within a window can trigger z bumps. Clicking one window can generate multiple focus actions. This creates avoidable re-renders and causes zCounter inflation unrelated to actual stacking intent.

Impact:
State churn, noisy debug traces, subtle ordering instability over long sessions.

Recommendation:
- Dispatch focus only on pointer-down on chrome/window frame (single path).
- Ignore focus requests when target is already focused.
- Optionally debounce within one animation frame for composite focus events.

### Finding CR-3 (High): Accessibility semantics are currently incorrect for non-dialog windows

Problem:
All windows are rendered with `role="dialog"` (`WindowSurface.tsx:29`) even when they are standard desktop windows and not modal dialogs.

Why it matters:
Screen readers interpret dialog role with stronger interaction expectations. Non-modal app windows should not present as dialogs. This also blocks future keyboard model clarity (window roving focus, menu keyboard nav, close shortcuts).

Impact:
A11y compliance risk and confusing assistive technology behavior.

Recommendation:
- Use dialog role only when `isDialog` is true.
- For standard windows use a different role strategy (`region` with labeled headings, or custom window container semantics).
- Implement the currently open accessibility task in `tasks.md:25` with explicit keyboard navigation acceptance criteria.

### Finding CR-4 (High): Geometry policy is split and inconsistent across reducer and interaction layer

Problem:
Reducer allows partial offscreen x (`windowingSlice.ts:118`, clamp to `-width + 40`) and min size defaults 180x120 (`windowingSlice.ts:48`, `windowingSlice.ts:49`).

DesktopShell interaction controller clamps to minX=0 and min size 220x140 (`DesktopShell.tsx:182`).

Why it matters:
Two policy sources produce different behavior depending on entry path (pointer interaction versus direct dispatch/commands/tests). This is exactly the mixed-style drift the ticket should avoid.

Impact:
Hard-to-debug geometry behavior and inconsistent UX.

Recommendation:
- Centralize geometry policy in one place (prefer reducer/domain policy).
- Have interaction controller read policy from window instance or shared constants sourced from reducer defaults.
- Update tests to assert one canonical policy.

### Finding CR-5 (Medium): Runtime orchestration logic is duplicated between HyperCardShell and CardSessionHost

Problem:
`CardSessionHost.tsx` repeats substantial logic from `HyperCardShell.tsx`: runtime creation, debug wrapping, action execution, resolver construction, emit mapping.

Why it matters:
Any runtime bugfix or DSL evolution must now be implemented in two shells. Divergence has already started (CR-1).

Impact:
Maintenance cost and behavioral drift.

Recommendation:
Extract shared runtime bridge into a dedicated hook/module, for example:
- `useCardRuntimeHost({ stack, cardId, navAdapter, sessionMeta, mode, sharedSelectors, sharedActions, debugHooks })`

Then compose both shell types from that shared primitive.

### Finding CR-6 (Medium): Runtime state lifecycle leak on window close

Problem:
Closing a window deletes session nav (`windowingSlice.ts:90`) but does not remove runtime state entries created via `ensureCardRuntime` in `hypercardRuntime.stacks[stackId].cards` (`runtimeStateSlice.ts:74`).

Why it matters:
With session-keyed runtime IDs, repeated open/close cycles accumulate stale card runtime state.

Impact:
Potential memory growth in long-running sessions and stale-debug noise.

Recommendation:
- Add runtime cleanup action (for card instance removal).
- Dispatch cleanup when closing a card window via middleware/thunk orchestration.
- Add stress test that opens/closes many sessions and asserts bounded runtime map size.

### Finding CR-7 (Medium): `openWindow` allows duplicate order entries when IDs collide

Problem:
`openWindow` writes `state.windows[win.id] = win` and always `order.push(win.id)` without id-existence guard (`windowingSlice.ts:56`, `windowingSlice.ts:57`).

Why it matters:
If caller reuses id without dedupeKey, render order can contain duplicate IDs while map only contains one item.

Impact:
Inconsistent selectors/rendering; possible UI anomalies.

Recommendation:
- If id exists, either focus existing or replace-in-place without pushing duplicate order entry.
- Add reducer test for duplicate id payloads.

### Finding CR-8 (Medium): Desktop transient-state clearing is incomplete

Problem:
`clearDesktopTransient` is only triggered when root background itself is clicked (`DesktopShell.tsx:282`). Clicking many non-menu targets does not consistently close menus.

Why it matters:
Desktop menu behavior feels sticky and inconsistent.

Impact:
UX paper cuts and command misfires.

Recommendation:
- Add document-level click-away handling for menu state.
- Close active menu on window focus and icon interaction start.

### Finding CR-9 (Low-Medium): Global mutable session counter introduces nondeterminism

Problem:
`sessionCounter` is module global (`DesktopShell.tsx:67`). Session IDs are therefore shared across all DesktopShell instances and test/story lifetimes.

Why it matters:
Global mutable counters are brittle under HMR, test parallelism, multi-root rendering, and future SSR.

Recommendation:
- Move ID generation to reducer/store via action creator thunk or utility injected per store.
- If global is retained, at least scope by stack ID and instance.

### Finding CR-10 (Low-Medium): Missing pluggable non-card content host

Problem:
Non-card windows currently render fallback placeholder content (`DesktopShell.tsx:268`).

Why it matters:
`WindowContent.kind` advertises `app` and `dialog`, but runtime integration exists only for `card`.

Impact:
Limits future composability and app-window plugins.

Recommendation:
Implement explicit `WindowContentHost` registry abstraction:
- `kind: 'card'` -> `CardSessionHost`
- `kind: 'app'` -> app host resolver
- `kind: 'dialog'` -> dialog resolver

## Deeper Integration Analysis: Cards And DSL On A Windowed Platform

This section focuses on the long-term architectural question in your request: how to build applications on top of the windowing system while preserving DSL consistency.

### A. What currently works well for DSL integration

- Existing `Act('nav.go')` and `Act('nav.back')` actions work without changing card definitions.
- Shared selectors/actions can still be passed from apps into `DesktopShell` and into `CardSessionHost`.
- Runtime debug hooks are still present and now include window/session metadata.

This means teams can migrate existing cards with low immediate authoring changes.

### B. Where integration currently leaks abstraction

Leak 1: card identity overload
- DSL layer concept: `cardId` identifies a definition in `stack.cards`.
- Windowing implementation concept: `runtimeCardId` identifies a card instance in runtime storage.
- Current implementation merges these two into one field in context.
- Result: abstraction leak into selector/action code that expects canonical card IDs.

Leak 2: nav model divergence
- Legacy shell uses navigation slice semantics (`navigate`, `goBack`).
- Windowing shell uses session nav reducers.
- DSL caller sees same action names, but backend nav model differs.
- Without explicit contract docs/tests, edge-case behavior can drift.

Leak 3: command routing is shell-local
- Menu and icon commands are interpreted directly in `DesktopShell` with ad-hoc string checks.
- DSL has no first-class way to invoke or extend desktop-level commands.
- This blocks clean app-level extensibility for new window management behaviors.

### C. Recommended DSL-windowing contract (target state)

Contract principle 1: keep canonical identity pure
- `ctx.cardId` must always be canonical.
- Add `ctx.instanceId` (or `ctx.windowSessionId`) for per-window identity.

Contract principle 2: explicit nav adapter
- Runtime host accepts a nav adapter with methods: `go`, `back`, optional `home`, optional `replace`.
- Legacy and windowing shells each provide an adapter implementation.
- DSL command execution remains runtime-host agnostic.

Contract principle 3: declarative desktop commands
- Define typed command descriptors:
  - `window.open`
  - `window.close`
  - `window.focus`
  - `window.tile`
  - `window.cascade`
- Allow menu items and icon configs to reference typed commands with structured args.

Contract principle 4: content host registry
- Register handlers by `WindowContent.kind`.
- Keep `DesktopShell` unaware of specific app/dialog rendering logic.

### D. Practical migration path for existing apps

Step 1:
- Fix CR-1 first. Do not migrate more apps until card identity semantics are corrected.

Step 2:
- Extract shared runtime host from `HyperCardShell` and `CardSessionHost`.

Step 3:
- Add integration tests proving that the same card DSL behaviors pass in both shells.

Step 4:
- Migrate one additional app (for example `todo`) and run behavioral diff checks against legacy shell.

Step 5:
- Only then start legacy shell deprecation tasks.

## Verification Matrix (Current State)

State-management correctness:
- Status: strong.
- Evidence: 47 reducer/selector tests in `windowing.test.ts`.

Runtime behavior parity with legacy shell:
- Status: moderate risk.
- Evidence: duplicated runtime wiring and card identity drift.

Interaction semantics:
- Status: moderate risk.
- Evidence: focus dispatch duplication and split constraint policies.

Accessibility:
- Status: high risk.
- Evidence: dialog role usage on all windows and missing keyboard nav completion.

Extensibility for multi-app platform:
- Status: moderate risk.
- Evidence: hardcoded fallback content host and stringly command router.

Documentation and ticket traceability:
- Status: strong.
- Evidence: thorough changelog/diary history and explicit task decomposition.

## Positive Signals And Strengths

The review is critical, but there are substantial strengths worth preserving.

- Reducer-level test coverage is strong and readable (`windowing.test.ts`).
- State shape is conceptually clean for desktop + window instances + session nav.
- Primitive decomposition is sensible and enables Storybook-driven iteration.
- CSS token/part mapping is systematic and positions the UI for theme-level evolution.
- Session nav modeling is a practical way to make `nav.go/nav.back` window-local.

These strengths make remediation feasible without a rewrite.

## Design Decisions Observed (Good, Risky, Or Mixed)

### Good decisions

- Introduced dedicated windowing slice rather than overloading navigation slice.
- Isolated pointer drag/resize handling in a reusable hook.
- Added selector layer for stable read APIs.
- Started migration with one app (`inventory`) instead of changing all apps at once.

### Risky or mixed decisions

- Overloaded `cardId` semantics for runtime isolation (CR-1).
- Duplicated runtime orchestration across shell variants (CR-5).
- Split geometry policy between reducer and interaction layer (CR-4).
- Story-heavy validation without enough integration assertions.

## Bigger Picture: Building Applications On Top Of Windowing

The current implementation is a workable v1 desktop. To make it a reliable application platform for cards and DSL-driven apps, the architecture needs a small but important hardening phase.

### Platform requirement 1: Canonical card identity must remain stable

Card definitions, selectors, actions, and analytics all typically reason in canonical card IDs. Window/session isolation should be represented as instance identity, not a card ID mutation. This is the single highest-leverage fix.

### Platform requirement 2: One runtime bridge abstraction for all shells

Keep one source of truth for:
- context construction
- action dispatch/debug instrumentation
- selector resolution
- runtime initialization

Then supply shell-specific nav adapters:
- legacy single-stack nav adapter
- per-window session nav adapter

### Platform requirement 3: Typed desktop command bus

Today command IDs are stringly-typed and shell-local (`window.open.card.*`, `window.tile`, etc.). For app-scale composability:
- define command schema/types
- support registration and capability guards
- map menu/icon/keyboard into one command pipeline

### Platform requirement 4: Content host registry

Windowing state already models `card/app/dialog`. Make it real with a host registry so future apps can open specialized windows without hardcoding fallback content in `DesktopShell`.

### Platform requirement 5: Integration tests as contract layer

State-unit tests are necessary but insufficient. Add integration tests for:
- duplicate same-card windows and true local-state isolation
- close/focus handoff and z-order behavior under interaction events
- DSL nav behavior under multi-window scenarios
- runtime cleanup after repeated open/close
- menu keyboard and click-away behavior

## Alternatives Considered

### Alternative A: Keep `cardId::sessionId` as the permanent `cardId` contract

Rejected because it leaks infrastructure identity into domain identity and breaks compatibility assumptions in existing stack code.

### Alternative B: Fork HyperCardShell and DesktopShell runtime code indefinitely

Rejected because maintenance cost compounds quickly and guarantees behavior drift.

### Alternative C: Move all window geometry policy into interaction controller

Rejected because non-pointer actions (commands, scripted dispatches, tests) still need a canonical state policy.

## Implementation Plan (Remediation)

### Phase R1: Correctness hotfixes (priority)

- Introduce runtime instance id separate from canonical card id.
- Patch `CardSessionHost` context to preserve canonical cardId.
- Add integration tests for selector/action compatibility with multi-session contexts.
- Fix focus dispatch inflation (`WindowSurface` -> single focus path).

### Phase R2: Policy and lifecycle consistency

- Consolidate geometry constraints in reducer/shared domain constants.
- Add runtime cleanup action and close-window cleanup orchestration.
- Add guard for duplicate openWindow ids.

### Phase R3: Platform abstractions

- Extract shared runtime bridge hook used by both shell variants.
- Introduce content host registry and typed command router.
- Expand keyboard/a11y model for menu/window interactions.

### Phase R4: Migration hardening

- Migrate second app after R1-R2 complete.
- Run full regression suite and manual UX checks.
- Update docs/tasks/changelog with explicit resolved risks and known limitations.

## Open Questions

1. Product behavior: should same-card multi-instance windows be allowed by default, optional, or prohibited?
2. Runtime ownership: should runtime card instance cleanup happen synchronously on window close, or deferred with LRU/session policies?
3. A11y strategy: should non-dialog windows emulate desktop-window semantics or use a region-based accessible model with explicit keyboard shortcuts?
4. Migration strategy: when should legacy `HyperCardShell` be deprecated, and what compatibility window is acceptable?

## References

- `apps/inventory/src/App.tsx`
- `packages/engine/src/features/windowing/windowingSlice.ts`
- `packages/engine/src/features/windowing/selectors.ts`
- `packages/engine/src/__tests__/windowing.test.ts`
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/components/shell/windowing/CardSessionHost.tsx`
- `packages/engine/src/components/shell/windowing/WindowSurface.tsx`
- `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/cards/runtime.ts`
- `packages/engine/src/cards/runtimeStateSlice.ts`
- `packages/engine/src/theme/base.css`
