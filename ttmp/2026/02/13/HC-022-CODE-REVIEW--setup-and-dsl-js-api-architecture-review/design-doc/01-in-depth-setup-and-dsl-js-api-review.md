---
Title: In-Depth Setup and DSL JS API Review
Ticket: HC-022-CODE-REVIEW
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: docs/js-api-user-guide-reference.md
      Note: Primary JS API drift analysis
    - Path: package.json
      Note: Root build/lint orchestration reviewed
    - Path: packages/engine/src/cards/runtime.ts
      Note: Action execution/scoping behavior reviewed
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Shell runtime wiring and layout behavior reviewed
    - Path: packages/engine/src/features/navigation/navigationSlice.ts
      Note: homeCard and navigation reset behavior reviewed
    - Path: tsconfig.json
      Note: Root typecheck project references reviewed
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/various/review-metrics.txt
      Note: Generated metrics evidence referenced in findings
ExternalSources: []
Summary: Exhaustive architecture and setup audit for HyperCard React, with concrete code-level findings, runtime/maintenance implications, and prioritized cleanup plan.
LastUpdated: 2026-02-13T15:42:21.372533836-05:00
WhatFor: Deep code review of setup and DSL JS API architecture
WhenToUse: When planning stabilization/refactor work for HyperCard engine + app surfaces
---


# In-Depth Setup and DSL JS API Review

## Executive Summary

This review audited setup, DSL JS API surface, runtime architecture, app integration patterns, and documentation quality across `packages/engine`, all `apps/*`, Storybook wiring, and root scripts.

The biggest risks are:

1. Documentation/API drift is severe: the public JS API guide and README describe a different architecture than what actually ships.
2. Repo-level quality gates are not operational (`build` and `lint` fail at root; root typecheck misses 2 apps).
3. DSL action scoping contract is partially implemented (`ActionDescriptor.to` exists but is never honored).
4. There is broad setup duplication and integration drift across apps (store wiring, Storybook decorators, app bootstrap).

Evidence highlights:

- `npm run typecheck` succeeds.
- `npm run build` fails at root because `packages/engine` has no `build` script.
- `npm run lint` fails because repo lint tooling/config is not established.
- Metrics script output (`various/review-metrics.txt`) shows:
  - `state.setField_bindings=16`
  - `patchScopedState_edits_resets=12`
  - `as_any_casts=17`
  - `test_file_count=0`

## Problem Statement

The codebase has a strong core runtime concept, but its surrounding setup and docs are inconsistent enough to slow onboarding, hide real constraints, and make changes riskier than they should be.

The specific problems are:

- Mismatch between documented and actual API contracts.
- Broken/partial root-level build and lint contracts.
- Repeated app wiring with small divergences and no single canonical bootstrap path.
- DSL/runtime contracts that are declared but not fully implemented.
- Missing confidence net (tests) while architecture evolves quickly.

## Proposed Solution

Adopt a staged stabilization plan:

1. **Truth-first docs pass**: update README and JS API reference from current source contracts.
2. **Setup contract hardening**: make root `build`, `typecheck`, and `lint` reliable and repo-wide.
3. **Runtime contract completion**: implement or remove unsupported DSL fields (`ActionDescriptor.to`, legacy claims).
4. **Consolidation pass**: standardize app and Storybook bootstrap on shared helpers.
5. **Test safety net**: add minimal runtime/action-selector integration tests before deeper refactors.

## Runtime Flow Map

Current runtime flow (actual code path):

1. `HyperCardShell` resolves current card and initializes runtime state via `ensureCardRuntime`.
2. `CardRenderer` evaluates DSL `ui.*` nodes and emits binding events.
3. Shell resolves `ActionDescriptor.args` through selector/event/param expressions.
4. Runtime executes built-ins (`nav.go`, `nav.back`, `toast`, `state.*`), then local handlers, then shared handlers.
5. Reducers update domain/runtime slices; shell re-renders.

Primary files:

- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/components/shell/CardRenderer.tsx`
- `packages/engine/src/cards/runtime.ts`
- `packages/engine/src/cards/runtimeStateSlice.ts`

## Findings

### 1) Public API Documentation Drift (High)
Problem: The primary API guide documents a legacy architecture and symbols that are absent from the current source (`dispatchDSLAction`, `defineActionRegistry`, `selectDomainData`, `customRenderers`, `domainData`, old `Stack.data` model).

Where to look: `docs/js-api-user-guide-reference.md:43`, `docs/js-api-user-guide-reference.md:79`, `docs/js-api-user-guide-reference.md:170`, `docs/js-api-user-guide-reference.md:430`, `docs/js-api-user-guide-reference.md:512`, `docs/js-api-user-guide-reference.md:919`; compare exports in `packages/engine/src/index.ts:1` and `packages/engine/src/app/index.ts:1`.

Example:
```ts
import {
  HyperCardShell,
  dispatchDSLAction,
  defineActionRegistry,
  createDomainActionHandler,
  defineSelectorRegistry,
  selectDomainData,
} from '@hypercard/engine';
```

Why it matters: This is the highest-leverage reliability issue for humans. Engineers following docs will implement non-existent integration layers, misread extension points, and fail to reproduce working app setup.

Cleanup sketch:
```text
- Generate docs from source exports + hand-authored narratives.
- Add a CI check that verifies every documented symbol exists in barrel exports.
- Split docs into:
  1) "Current API (truth)"
  2) "Migration notes" for any legacy concepts.
```

### 2) README Architecture Is Stale/Misleading (High)
Problem: Root README describes paths and extension points that no longer match actual code (e.g., `src/dsl/`, `overrides/`, `customRenderers`-centric model).

Where to look: `README.md:12`, `README.md:22`, `README.md:37`; compare actual folder structure under `packages/engine/src/cards` and app-level `sharedSelectors`/`sharedActions` usage in `apps/inventory/src/App.tsx:7`.

Example:
```text
dsl/                 — DSL type system (Stack, CardDefinition, DSLAction)
overrides/           — Card type renderers (wire widgets to domain data)
```

Why it matters: README is the first contract for contributors. Drift here multiplies setup mistakes and slows reviews.

Cleanup sketch:
```text
- Rewrite README architecture tree from current directories.
- Add one canonical "new app" bootstrap that matches createAppStore/createStoryHelpers reality.
- Link to a verified "API truth" doc (issue #1).
```

### 3) Root Build Contract Is Broken (High)
Problem: Root `build` script calls a workspace build script that does not exist.

Where to look: `package.json:10`, `packages/engine/package.json:1`.

Example:
```json
"build": "npm run build -w packages/engine && npm run build -w apps/inventory"
```

Observed failure:
```text
npm error workspace @hypercard/engine@0.1.0
npm error Missing script: "build"
```

Why it matters: CI/dev automation cannot rely on root build command, and failure happens before app build steps.

Cleanup sketch:
```text
Option A: Add engine build script (tsc -b) and keep orchestration.
Option B: Remove engine build target from root build and use a dedicated typecheck/build pipeline.
Also include all apps in root build target, not just inventory.
```

### 4) Root Lint Contract Is Missing (High)
Problem: Root `lint` script currently points to ESLint, but no lint toolchain is established at repo root.

Where to look: `package.json:12`; no matching lint config from `rg --files -g '*eslint*' -g '*biome*'`.

Observed failure (current state):
```text
ESLint couldn't find a configuration file.
```

Why it matters: Lint stage provides no enforcement, and style/safety drift accumulates silently.

Cleanup sketch (target: Biome):
```text
- Add Biome config (`biome.json`) with formatter + linter rules for TS/TSX.
- Update root lint scripts:
  - `lint`: `biome check .`
  - `lint:fix`: `biome check --write .`
- Scope includes/excludes for `apps/*`, `packages/*`, and ignore generated/build artifacts.
- Wire Biome check into CI as the canonical lint gate.
```

### 5) Root Typecheck Coverage Is Incomplete (High)
Problem: Root `tsc --build` only references engine + 2 apps, omitting `apps/todo` and `apps/crm`.

Where to look: `tsconfig.json:3`.

Example:
```json
"references": [
  { "path": "packages/engine" },
  { "path": "apps/inventory" },
  { "path": "apps/book-tracker-debug" }
]
```

Why it matters: root green checks can miss breakage in non-referenced apps.

Cleanup sketch:
```text
- Add all app projects to root references.
- Or replace with workspace-based typecheck runner that explicitly checks every app.
```

### 6) Action Scope Contract Is Declared But Not Implemented (High)
Problem: DSL `ActionDescriptor.to` exists in types/helpers but runtime dispatch path ignores it.

Where to look: `packages/engine/src/cards/types.ts:32`, `packages/engine/src/cards/helpers.ts:25`, `packages/engine/src/cards/runtime.ts:465`.

Example:
```ts
export interface ActionDescriptor {
  $: 'act';
  type: string;
  args?: ValueExpr;
  to?: ActionScope;
}

const localHandler = resolveActionHandler(actionType, lookup);
if (localHandler) { ... }
```

Why it matters: This creates false confidence in DSL behavior. App code already sets `{ to: 'shared' }` in some actions, but runtime treats it as advisory/no-op.

Cleanup sketch:
```ts
// Pseudocode
switch (descriptor.to ?? 'auto') {
  case 'shared': runSharedOnly(); break;
  case 'card': runScoped('card'); break;
  case 'cardType': runScoped('cardType'); break;
  case 'background': runScoped('background'); break;
  case 'stack': runScoped('stack'); break;
  case 'global': runScoped('global'); break;
  case 'auto': runLocalThenShared(); break;
}
```

### 7) Unhandled Actions Fail Silently (Medium-High)
Problem: Unknown action types emit debug metadata only; no warning/error path exists by default.

Where to look: `packages/engine/src/cards/runtime.ts:506`.

Example:
```ts
finalize('unhandled');
```

Why it matters: Mis-typed action names become hard-to-diagnose no-ops unless debug pane is actively used.

Cleanup sketch:
```ts
if (!handled) {
  console.warn(`[hypercard] Unhandled action: ${actionType}`, { cardId: ctx.cardId });
  // optionally dispatch toast in dev
}
```

### 8) Navigation Initialization Ignores `homeCard` (Medium)
Problem: Initial and layout-reset navigation always hard-code `'home'`, independent of stack-defined `homeCard`.

Where to look: `packages/engine/src/features/navigation/navigationSlice.ts:17`, `packages/engine/src/features/navigation/navigationSlice.ts:32`.

Example:
```ts
const initialState = {
  layout: 'split',
  stack: [{ card: 'home' }],
};
```

Why it matters: Stack metadata contract is partially broken and forces all stacks to include a `home` card even when `homeCard` differs.

Cleanup sketch:
```text
- Initialize nav per-stack from shell mount (stack.homeCard).
- Change setLayout reset target to current stack homeCard.
- Keep reducer generic by adding explicit reset action payload { homeCard }.
```

### 10) Store Wiring Is Inconsistent (Medium)
Problem: Two apps use `createAppStore`, two apps manually re-declare engine reducers.

Where to look: `apps/book-tracker-debug/src/app/store.ts:1`, `apps/crm/src/app/store.ts:1`, `apps/inventory/src/app/store.ts:1`, `apps/todo/src/app/store.ts:1`.

Example:
```ts
// inventory/todo
configureStore({ reducer: { hypercardRuntime, navigation, notifications, ... } })
```

Why it matters: Inconsistent setup makes global reducer evolution error-prone.

Cleanup sketch:
```text
- Move all apps to createAppStore.
- Expose typed helper overloads to reduce any-casts.
```

### 11) Storybook Patterns Are Split-Brain (Medium)
Problem: CRM/Book use `createStoryHelpers`, while Todo/Inventory keep bespoke decorators and card navigation story harnesses.

Where to look: `apps/crm/src/stories/CrmApp.stories.tsx:7`, `apps/book-tracker-debug/src/stories/BookTrackerDebugApp.stories.tsx:7`, `apps/todo/src/stories/TodoApp.stories.tsx:15`, `apps/inventory/src/stories/decorators.tsx:9`.

Why it matters: Story ergonomics and coverage quality vary per app; shared improvements do not propagate.

Cleanup sketch:
```text
- Migrate Todo + Inventory stories to createStoryHelpers.
- Keep one app-specific decorator hook only for special cases.
```

### 12) Repeated Card State-Binding Boilerplate (Medium)
Problem: `state.setField` and `patchScopedState('card', { edits: {} })` patterns are heavily duplicated.

Where to look: many card definitions + action handlers across apps.

Evidence: metrics file reports `state.setField_bindings=16`, `patchScopedState_edits_resets=12`.

Why it matters: Boilerplate obscures intent and makes behavior changes expensive.

Cleanup sketch:
```ts
// Pseudocode helpers
const bindForm = (key: string, submitAction: ActionDescriptor) => ({
  [key]: {
    change: Act('state.setField', { scope: 'card', path: 'formValues', key: Ev('field'), value: Ev('value') }),
    submit: submitAction,
  },
});
```

### 14) Type Safety Erosion at API Boundaries (Medium)
Summary: Significant `any` usage exists at shell/runtime/story boundaries and should be reduced with typed boundary contracts.

Detailed analysis: `design-doc/02-finding-14-type-safety-boundary-analysis.md`.

### 15) Footer Aggregation Edge Case (`min`/`max` on Empty) (Low-Medium)
Problem: `Math.min(...[])` and `Math.max(...[])` produce infinities for empty datasets.

Where to look: `packages/engine/src/components/widgets/ListView.tsx:63`.

Example:
```ts
case 'min': result = Math.min(...vals); break;
case 'max': result = Math.max(...vals); break;
```

Why it matters: If non-sum footer types are used with empty rows, UI may show `Infinity`/`-Infinity`.

Cleanup sketch:
```ts
case 'min': result = vals.length ? Math.min(...vals) : 0; break;
case 'max': result = vals.length ? Math.max(...vals) : 0; break;
```

### 16) Missing Test Safety Net (Medium)
Problem: No `*.test.*`/`*.spec.*` files detected.

Where to look: repo-wide search and metrics file (`test_file_count=0`).

Why it matters: DSL/runtime behavior is complex and currently validated mostly by manual Storybook/app exploration.

Cleanup sketch:
```text
Start with 6-10 high-value tests:
- executeActionDescriptor built-ins/local/shared precedence
- selector resolution order and scope
- state.setField/path behavior
- navigation homeCard reset behavior (after fix)
- ListView footer aggregations on empty/non-empty datasets
```

## Design Decisions

1. Keep the current DSL runtime architecture (it is fundamentally coherent).
2. Prioritize contract alignment (docs + setup + runtime semantics) over feature expansion.
3. Consolidate app scaffolding only after root contracts are repaired.
4. Add tests around runtime semantics before deep refactors.

## Alternatives Considered

1. **Large rewrite now**: rejected because setup/documentation drift would still break users during rewrite.
2. **Only docs fix**: rejected because root build/lint/typecheck contracts are objectively broken.
3. **Only setup fix**: rejected because API docs would remain misleading.

## Implementation Plan

### Phase 1: Contract Repair (highest leverage)

1. Fix root scripts (`build`, `lint`, `typecheck`) so they are trustworthy for all apps.
2. Update README + JS API guide to match current engine exports and runtime contracts.
3. Decide `ActionDescriptor.to` fate: implement scope semantics or remove from DSL surface.

### Phase 2: Consolidation

1. Standardize all app stores on `createAppStore`.
2. Standardize story wiring on `createStoryHelpers`.
3. Extract repeated form/detail action/binding helper factories.

### Phase 3: Confidence Net + Hardening

1. Add runtime integration tests.
2. Reduce `any` at shell/runtime boundaries.
3. Add doc drift check and symbol validation in CI.

## Open Questions

1. Should `ActionDescriptor.to` be fully enforced, or explicitly deprecated/removed?
2. Should legacy layout mode (`legacyTabs` + `renderAIPanel`) remain a first-class path?
3. Should JS API docs be generated from source annotations to avoid future drift?
4. How strict should boundary typing be for extensibility (`unknown` + validators vs broader generic APIs)?

## References

- `various/review-metrics.txt`
- Root validation commands run during review:
  - `npm run typecheck` (pass)
  - `npm run build` (fails at root orchestration)
  - `npm run lint` (fails: missing config)
  - per-app builds (`apps/inventory`, `apps/todo`, `apps/crm`, `apps/book-tracker-debug`) all pass
