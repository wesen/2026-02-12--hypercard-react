---
Title: OSHA-Style Modularization Audit Report
Ticket: HC-001-IMPORT-JSX
Status: active
Topics:
    - react
    - storybook
    - theming
    - rtk-toolkit
    - vite
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md
      Note: |-
        Primary modularization proposal under audit
        Primary modularization proposal inspected
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md
      Note: |-
        Layer-separation addendum under audit
        Layer separation addendum inspected
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/reference/02-investigation-diary-modularization-audit.md
      Note: Investigation chronology and command log for this inspection
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/sources/local/hypercard(4).jsx
      Note: |-
        Source of truth monolith inspected line-by-line for behavior parity constraints
        Monolith behavior baseline inspected for parity and contamination evidence
ExternalSources: []
Summary: Exhaustive OSHA-style inspection of modularization proposals with critical findings, tightened architecture, and expanded migration controls.
LastUpdated: 2026-02-12T12:25:00-05:00
WhatFor: Stress-test and harden the HC-001 modularization plan before implementation starts.
WhenToUse: Use before coding the refactor, and as the acceptance gate during implementation.
---


# OSHA-Style Modularization Audit Report

## Goal

Perform an exhaustive, findings-first inspection of the modularization proposals for HC-001, with a bias toward operational safety: behavior parity, architecture boundary integrity, runtime correctness, upgrade safety, and implementation readiness.

## Scope

Inspection coverage includes:

- Monolith behavior baseline in `/sources/local/hypercard(4).jsx`
- Proposal v1 in `design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md`
- Proposal v2 addendum in `design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md`
- Docmgr ticket hygiene and execution readiness

## Inspection Method

1. Built a behavior baseline from source line evidence (state transitions, action semantics, computed fields, AI flow, styling tokens).
2. Cross-mapped every proposal claim against the baseline and against the other proposal.
3. Classified findings by severity based on production risk and migration blast radius.
4. For each finding: documented problem, location, evidence, impact, and a tightened remediation sketch.
5. Produced an expanded migration control system with measurable acceptance gates.

## Executive Severity Summary

- Critical: 6 findings
- High: 8 findings
- Medium: 6 findings

Overall verdict: the proposed direction is strong and salvageable, but not implementation-safe yet. The plan is missing hard contractual controls, has unresolved contradictions between docs, and still includes runtime patterns that can create regressions or security debt.

---

## Critical Findings

### C1. Primary design doc is structurally non-indexable in docmgr

Problem:
The main design doc is not valid ticket metadata in practice, so it is invisible to normal `docmgr doc list` workflows.

Where to look:
- `ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:1`
- `ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:2`
- `ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:6`

Example snippet:
```yaml
Title: ""
Ticket: ""
DocType: ""
```

Why it matters:
If the core plan is not discoverable, the team will fork versions informally and implementation will drift from architecture intent.

Cleanup sketch:
```text
Normalize design/01 frontmatter to real ticket metadata.
Run `docmgr validate frontmatter --doc <path> --suggest-fixes`.
Require doc validation in CI for `ttmp/**/design/*.md`.
```

Expanded control:
Add an "Architecture Docs Must Be Indexable" gate to Phase 0. No code work starts until docmgr can list every governing design doc.

---

### C2. Claimed safe expression handling still uses dynamic code execution

Problem:
Proposal v1 says computed expression evaluation is made safe, but the suggested helper still uses `new Function`.

Where to look:
- `ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:613`
- `ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:623`

Example snippet:
```ts
/** Safe expression evaluator ... */
const fn = new Function(...Object.keys(variables), `"use strict"; return ${expr};`);
```

Why it matters:
This is not a real hardening; it is a relocation of the same execution model. It preserves injection risk and creates false security confidence.

Cleanup sketch:
```ts
// Option A (preferred): ban expression strings entirely
type ComputedFieldConfig<T> = { compute: (record: T) => string };

// Option B: use a constrained expression parser (no property access, no function calls)
// validate AST nodes against allowlist before eval
```

Expanded control:
Security gate: "No dynamic evaluation APIs (`new Function`, `eval`) in engine or app packages" enforced via lint rule and CI grep.

---

### C3. Action contract is stringly-typed and non-defensive

Problem:
Both proposals rely on `DSLAction` as a loose type with many optional fields, then use non-null assertions and `as any` in bridge handlers.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:398`
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:1224`
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:1233`
- `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:803`
- `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:810`

Example snippet:
```ts
dispatch(updateQty({ sku: action.sku!, delta: action.delta! }));
dispatch(saveItem({ sku: action.sku!, edits: action.edits as any }));
```

Why it matters:
This allows malformed DSL actions to compile and fail only at runtime. In a declarative DSL system, that is a primary failure mode.

Cleanup sketch:
```ts
type DSLAction =
  | { type: 'navigate'; card: string; paramValue?: string }
  | { type: 'back' }
  | { type: 'toast'; message: string }
  | { type: 'updateQty'; sku: string; delta: number }
  | ...

function assertNever(x: never): never { throw new Error(`Unhandled: ${JSON.stringify(x)}`); }
```

Expanded control:
- Runtime parse/validate all incoming actions from stack definitions.
- Contract tests for each action type with invalid payload permutations.

---

### C4. Proposed domain handler introduces behavior regressions vs source semantics

Problem:
The proposed domain action handler in v2 does not preserve key source behaviors (validation + failure messaging), especially for `receiveStock`.

Where to look:
- Baseline: `ttmp/.../sources/local/hypercard(4).jsx:786`
- Baseline: `ttmp/.../sources/local/hypercard(4).jsx:791`
- Proposal: `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:822`
- Proposal: `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:824`

Example snippet:
```ts
// source semantics include not-found handling:
if (!found) { setToast(`SKU ${sku} not found`); return p; }

// proposal always toasts success:
dispatch(receiveStock({ sku: action.values?.sku as string, qty: Number(action.values?.qty) }));
dispatch(showToast(`Received +${action.values?.qty} for ${action.values?.sku}`));
```

Why it matters:
This silently changes user-facing behavior and can mask failed operations, which is a trust and correctness failure.

Cleanup sketch:
```ts
const result = dispatch(receiveStockChecked({ sku, qty }));
if (receiveStockChecked.rejected.match(result)) {
  dispatch(showToast(`SKU ${sku} not found`));
} else {
  dispatch(showToast(`Received +${qty} for ${sku}`));
}
```

Expanded control:
Add a parity test matrix that asserts identical toasts and data outcomes for all 10 legacy action classes.

---

### C5. No enforced boundary controls between `@hypercard/engine` and domain apps

Problem:
The design says dependency flow is one-way (engine never imports app), but no enforcement mechanism is specified.

Where to look:
- `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:103`

Example snippet:
```text
Rule: Dependencies only flow downward. The engine never imports from the app.
```

Why it matters:
Without static enforcement, this rule will eventually be violated during feature pressure, reintroducing contamination.

Cleanup sketch:
```text
Add import-lint boundaries:
- engine package cannot import `apps/**`
- domain apps can import engine public API only
- no deep imports into engine internals
```

Expanded control:
Use `eslint-plugin-boundaries` or `dependency-cruiser` as a mandatory CI gate.

---

### C6. No stack schema versioning or migration strategy

Problem:
The plan introduces broad type refactors but no versioned schema lifecycle for persisted stacks or evolving cards.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:358`
- `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:1077`

Why it matters:
Future changes to card shape, action payloads, or settings will break older stack definitions unless a migration contract exists.

Cleanup sketch:
```ts
interface VersionedStack<TData, TSettings> {
  schemaVersion: 1 | 2 | 3;
  stack: Stack<TData, TSettings>;
}

function migrateToLatest(input: unknown): StackLatest {
  const parsed = parseAnyKnownVersion(input);
  return runOrderedMigrations(parsed);
}
```

Expanded control:
Every schema change requires:
- migration function
- backward-compat test fixtures
- changelog entry with compatibility note

---

## High Findings

### H1. Inconsistent semantic state naming across docs (`error/warning` vs `out-of-stock/low-stock`)

Problem:
v1 CSS semantics and v2 formatter semantics use different state vocabularies.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:1690`
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:1695`
- `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:755`
- `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:756`

Example snippet:
```ts
// v2
if (qty === 0) return 'error';
if (qty <= threshold) return 'warning';

// v1 CSS expects
[data-state="out-of-stock"]
[data-state="low-stock"]
```

Why it matters:
Styling contracts break silently and Storybook examples become misleading.

Cleanup sketch:
```ts
type StockState = 'out-of-stock' | 'low-stock' | undefined;
```

---

### H2. Unstyled mode strategy is not bundling-realistic as documented

Problem:
v1 recommends "skip importing CSS" through a prop, but imports are static side effects and not normally controlled by component props.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:1732`

Why it matters:
Consumers may believe they can isolate styling via prop alone and then discover bundle-level leakage.

Cleanup sketch:
```text
Provide explicit entry points:
- @hypercard/engine/styles.css (opt-in styles)
- @hypercard/engine/core (unstyled components)
Document required import pattern for each mode.
```

---

### H3. Storybook examples risk shared mutable store state across stories

Problem:
Theme playground and some examples use long-lived store instances, enabling state bleed between stories.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:1922`
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:1930`

Why it matters:
Visual QA becomes flaky and can hide data flow bugs.

Cleanup sketch:
```ts
decorators: [
  (Story) => {
    const isolatedStore = createStoreWithFixture();
    return <Provider store={isolatedStore}><Story /></Provider>;
  }
]
```

---

### H4. Residual global coupling in selectors remains in v1

Problem:
Selectors in v1 still pull thresholds from global `STACK.settings`, contrary to modular isolation goals.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:952`
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:954`

Example snippet:
```ts
(items) => items.filter(i => i.qty <= STACK.settings.lowStockThreshold)
```

Why it matters:
Selectors become environment-dependent and hard to reuse/test.

Cleanup sketch:
```ts
export const makeSelectLowStockItems = (threshold: number) =>
  createSelector([selectItems], (items) => items.filter(i => i.qty <= threshold));
```

---

### H5. Performance controls are absent for high-row tables and unbounded chat history

Problem:
No virtualization/pagination plan for list rendering and no retention policy for chat messages.

Where to look:
- Baseline table mapping: `ttmp/.../sources/local/hypercard(4).jsx:368`
- Baseline chat growth: `ttmp/.../sources/local/hypercard(4).jsx:650`
- v2 generic DataTable shape: `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:296`

Why it matters:
The architecture claims generic reuse, but without scaling controls it only safely supports toy datasets.

Cleanup sketch:
```text
DataTable: add pagination API + optional windowed renderer.
Chat: cap message history in slice (e.g. last 200) with persisted archive if needed.
```

---

### H6. Accessibility is listed as a checkbox, not a design contract

Problem:
The proposal mentions accessibility checks but does not define concrete requirements for keyboard interaction, ARIA semantics, or focus management.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:2150`

Why it matters:
Retro visuals can remain accessible, but only with explicit contracts. Late accessibility retrofits are expensive.

Cleanup sketch:
```text
Define A11y spec per widget:
- DataTable row activation keyboard behavior
- aria-live strategy for Toast
- focus trap and restoration for drawer/chat flows
- minimum contrast tokens validated in CI
```

---

### H7. Testing strategy lacks contract layers and parity harness

Problem:
Migration checklist includes generic "verify" steps but no executable parity framework.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:2128`
- `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:1109`

Why it matters:
Refactor safety depends on deterministic parity tests, not manual checks.

Cleanup sketch:
```text
Build three test layers:
1) action-reducer parity tests (legacy vs refactor)
2) snapshot interaction tests for card flows
3) visual diff tests for default theme fidelity
```

---

### H8. Chat intent matching remains ambiguous and order-fragile

Problem:
First-substring match behavior is preserved, but no priority model or disambiguation rules are documented.

Where to look:
- Baseline matcher: `ttmp/.../sources/local/hypercard(4).jsx:593`
- Baseline note: `ttmp/.../sources/local/hypercard-dev-guide.md:240`

Why it matters:
Intent routing quality can degrade rapidly as new patterns are added. This is the main operational surface for "AI" behavior.

Cleanup sketch:
```ts
type Intent = { id: string; patterns: string[]; priority: number; ... };
Sort by priority, then by specificity score.
Add deterministic tests for ambiguous phrases.
```

---

## Medium Findings

### M1. Plan text drifts from source line map and file metrics

Problem:
Narrative line partitioning and size estimates in proposal v1 are stale relative to actual source.

Where to look:
- Claim: `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:46`
- Actual file length: `ttmp/.../sources/local/hypercard(4).jsx` (848 lines)

Why it matters:
Not dangerous by itself, but stale analysis metadata lowers trust in nearby recommendations.

Cleanup sketch:
Add a small generated "source inventory" section produced from scripted line counts.

---

### M2. JSON deep-clone pattern is used as initialization contract

Problem:
Proposal v1 mirrors baseline `JSON.parse(JSON.stringify(...))` initialization semantics.

Where to look:
- Baseline: `ttmp/.../sources/local/hypercard(4).jsx:752`
- v1: `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:898`

Why it matters:
This drops non-JSON values and hides cloning assumptions.

Cleanup sketch:
Use explicit `createInitialStateFromStack(stack)` with typed cloning rules.

---

### M3. Proposal v1 and v2 are not reconciled into one canonical implementation spec

Problem:
v2 improves boundaries, but v1 remains large and still contains contradictory patterns (global coupling, action bridge scope, styling semantics).

Where to look:
- v1 overall: `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md`
- v2 change table: `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:934`

Why it matters:
Parallel design documents without a canonical merge create implementation ambiguity.

Cleanup sketch:
Create a single merged "v3 implementation spec" and demote older docs to historical references.

---

### M4. Engine API governance and semver policy are not defined

Problem:
The plan sets up a reusable engine package but does not define public API boundaries or deprecation rules.

Where to look:
- Engine package intent: `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:968`

Why it matters:
Without API governance, consumers will deep import internals and refactors will break downstream apps.

Cleanup sketch:
```text
Define `exports` map with stable public surface only.
Maintain API report (or type signature snapshot) per release.
Deprecations require one minor-cycle notice before removal.
```

---

### M5. Migration plan lacks explicit cutover and rollback strategy

Problem:
Checklist has phased tasks but no deploy-time cutover strategy or rollback protocol.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:2096`
- `ttmp/.../design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md:1069`

Why it matters:
Large refactors need reversible milestones to avoid dead-end branches.

Cleanup sketch:
```text
Add dual-run gate:
- legacy and modular builds co-exist behind runtime flag
- parity suite required before default switch
- one-command rollback to legacy path until phase freeze
```

---

### M6. LLM integration section lacks a security and abuse model

Problem:
Future LLM integration is sketched but no threat model is included for prompt injection, data exfiltration, or action injection.

Where to look:
- `ttmp/.../design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md:2070`

Why it matters:
"AI" surfaces become an attack path when connected to mutable app actions.

Cleanup sketch:
```text
Define action allowlist for model outputs.
Require model output schema validation.
Use read-only context summarization by default.
```

---

## Tightened Architecture (v3 Recommendation)

### 1) Enforce Hard Package Contracts

- `packages/engine` exports only stable public modules (`widgets`, `shell`, `dsl`, `styles`, `testing`).
- `apps/inventory` imports engine public API only.
- CI enforces forbidden imports and circular dependency checks.

### 2) Replace Loose Action Flow with Registered Action Specs

```ts
interface ActionSpec<T extends { type: string }> {
  type: T['type'];
  validate: (input: unknown) => input is T;
  handle: (action: T, ctx: DispatchContext) => void;
}

const engineSpecs = [navigateSpec, backSpec, toastSpec];
const domainSpecs = [updateQtySpec, saveItemSpec, ...];
```

Benefits:
- no non-null assertions
- no `as any`
- uniform runtime validation path

### 3) Make Behavior Parity a First-Class Artifact

Define a parity harness that executes scripted user flows against:
- legacy monolith (frozen baseline)
- refactored implementation

Compare:
- final state
- toast stream
- nav stack
- rendered key text snapshots

### 4) Split Styling Delivery from Component Runtime

- `core` entry: no side-effect CSS import.
- `styled` entry: imports default CSS + theme.
- Token and part registry remain stable in both.

### 5) Formalize Schema Lifecycle

- `schemaVersion` required in stack.
- migrations folder with ordered transforms.
- fixture tests for every historical version.

### 6) Define Non-Functional Budgets

- list render budget target at N=5k rows
- chat retention max messages
- cold start and interactive latency targets
- Storybook build performance budget

---

## Expanded Migration Controls

### Phase Gate Matrix

| Gate | Required Evidence | Blocker if Missing |
|---|---|---|
| G0 Docs | frontmatter valid, canonical v3 spec published | Yes |
| G1 Contracts | action specs + schema validation tests green | Yes |
| G2 Boundaries | import-lint and dependency graph checks green | Yes |
| G3 Parity | parity suite passes on all 10 legacy action classes | Yes |
| G4 Visual | default theme diff below tolerance threshold | Yes |
| G5 A11y | keyboard and aria contract tests pass | Yes |
| G6 Release | rollback flag and runbook verified | Yes |

### Required Test Inventory

- Unit:
  - reducers, selectors, action validators, formatters, compute functions
- Contract:
  - stack schema parser + migrations
  - action bridge dispatch table
- Integration:
  - card navigation flows
  - chat intent and action chip flows
- Visual:
  - story screenshot diffs (default theme)
- Accessibility:
  - axe checks + keyboard navigation scenarios

---

## Strengths Worth Keeping

The proposals already get several fundamentals right and should be preserved:

- Clear move from monolith to modular packages.
- Correct identification of contamination points in source (`DataTable`, `DetailCard`, `FormCard`, `ChatCard`, dispatch switch).
- Strong direction toward generic widget APIs (`ColumnConfig`, `renderCell`, callback-driven form/report/chat views).
- Good theming direction with tokenization and part registry.
- Correct instinct to separate engine concerns from inventory domain concerns.

---

## Final Inspector Verdict

The modularization effort is pointed in the right direction, but it is not yet execution-safe. The current docs can guide brainstorming and prototyping, but they need one hardening pass before implementation begins.

Minimum required before coding starts:

1. Repair doc discoverability and publish one canonical merged v3 spec.
2. Replace loose action handling with validated discriminated contracts.
3. Remove all dynamic code-evaluation pathways.
4. Add parity harness and phase gate controls.
5. Enforce package boundaries in CI.

Once these five controls are in place, the refactor can proceed with acceptable risk.

---

## Usage

Use this report as the governing safety checklist while implementing HC-001. Every phase should reference the findings IDs (C1..M6) and document closure evidence before moving forward.

## Appendix A: Implementation Blueprint (Tightened and Expanded)

This appendix converts the findings into concrete implementation structures so teams can start with guardrails, not just intentions.

### A1. Engine Public API Manifest

`@hypercard/engine` should publish only these stable entry points:

- `@hypercard/engine/core`
  - DSL types
  - widget components
  - shell components
  - engine reducers/selectors
  - action dispatcher contracts
- `@hypercard/engine/styled`
  - everything in `core`
  - plus default style side-effects
- `@hypercard/engine/styles`
  - CSS assets for explicit consumer import
- `@hypercard/engine/testing`
  - fixtures
  - parity helpers
  - action validator test utilities

Any deep import outside these entry points should fail lint/build.

### A2. Action Registry Contract (Engine + Domain)

The architecture becomes substantially safer when action handling is declarative and validated. Example shape:

```ts
type DispatchContext = {
  dispatch: AppDispatch;
  getState: () => RootState;
};

interface ActionSpec<T extends { type: string }> {
  type: T['type'];
  validate: (input: unknown) => input is T;
  handle: (action: T, ctx: DispatchContext) => void;
}

function executeAction(
  raw: unknown,
  ctx: DispatchContext,
  specs: Map<string, ActionSpec<any>>,
): { ok: true } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Action must be object' };
  const type = (raw as any).type;
  const spec = specs.get(type);
  if (!spec) return { ok: false, error: `Unknown action type: ${String(type)}` };
  if (!spec.validate(raw)) return { ok: false, error: `Invalid payload for ${type}` };
  spec.handle(raw, ctx);
  return { ok: true };
}
```

This directly addresses C3 and reduces accidental action drift.

### A3. Schema Validation and Migration Pipeline

Recommended structure:

```text
packages/engine/src/dsl/schema/
  stack.v1.ts
  stack.v2.ts
  parse.ts
  migrate.ts
  fixtures/
```

Parse path:

1. Detect `schemaVersion`.
2. Validate against corresponding schema.
3. Run migrations to latest.
4. Re-validate latest result.
5. Emit typed stack object.

Failure should be explicit and observable in UI (error card) and logs.

### A4. Parity Harness Design

The fastest way to keep confidence during refactor is a deterministic parity harness:

- Input: serialized user action script
- Runtimes:
  - legacy monolith reducer adapter
  - refactored store adapter
- Output comparison:
  - data tables
  - nav stack
  - active layout
  - toast timeline
  - generated report values

Example script scenarios:

- `updateQty` positive and negative deltas
- `saveItem` with partial edits
- `deleteItem` and navigation pop
- `createItem` with required fields present/missing
- `receiveStock` found/not found SKU
- chat action chips to navigation and `aiSend`

Parity failure should print machine-readable diffs.

### A5. Accessibility Baseline Contract

Required for each shipped widget:

- `Btn`/`Chip`
  - visible focus indicator
  - keyboard activation on Enter/Space
- `DataTable`
  - row click equivalents keyboard-accessible
  - headers and cells with semantic roles
- `Toast`
  - `aria-live="polite"` and proper dismissal timing
- `LayoutDrawer`
  - focus retention and restoration on open/close
- `ChatView`
  - input labels
  - action chips reachable in tab order

Add dedicated Storybook accessibility stories with keyboard steps documented.

### A6. Performance Budget Contract

Define budgets now, enforce later:

- 5,000 rows render target for `DataTable` with acceptable interactivity
- chat timeline retention cap with archived overflow
- cold load under target threshold on development laptop baseline
- Storybook build max duration threshold

Any budget violation must block release until waived with rationale.

### A7. Release and Rollback Runbook

Deployment steps for the refactor should include:

1. build both legacy and modular paths
2. run parity suite
3. enable modular path via runtime feature flag for internal users
4. monitor error rates, action validation failures, performance metrics
5. full cutover only after stability window

Rollback steps:

- flip feature flag to legacy
- invalidate cached modular assets if needed
- preserve user data compatibility via schema migration rollback policy

---

## Appendix B: Finding Closure Matrix

Use this matrix to track completion of each finding.

| Finding | Owner | Closure Evidence | Status |
|---|---|---|---|
| C1 | Docs owner | `docmgr doc list` includes all governing docs; validation CI green | Open |
| C2 | Security owner | no dynamic eval APIs in codebase; lint rule enforced | Open |
| C3 | Platform owner | discriminated action union + runtime action validators merged | Open |
| C4 | App owner | parity tests show identical toasts and receiveStock behavior | Open |
| C5 | Architecture owner | import boundary lint in CI with failing fixture test | Open |
| C6 | Platform owner | schemaVersion + migrations + fixtures merged | Open |
| H1 | UI owner | unified data-state enum and CSS mapping tests | Open |
| H2 | UI owner | documented styled/unstyled entrypoint split | Open |
| H3 | Storybook owner | per-story store isolation validated | Open |
| H4 | State owner | selector factories use explicit settings inputs | Open |
| H5 | Perf owner | pagination/virtualization path + chat retention cap | Open |
| H6 | A11y owner | widget accessibility contract test suite passing | Open |
| H7 | QA owner | parity + contract + visual suite in CI | Open |
| H8 | AI owner | deterministic intent priority model + tests | Open |
| M1 | Docs owner | auto-generated source inventory section | Open |
| M2 | State owner | explicit typed state initialization factory | Open |
| M3 | Architecture owner | canonical merged v3 spec published | Open |
| M4 | Package owner | `exports` map + API governance policy | Open |
| M5 | Release owner | cutover/rollback runbook in ticket | Open |
| M6 | Security owner | LLM action allowlist + schema validation | Open |

---

## Appendix C: Recommended Immediate Next Sequence

If implementation starts this week, this is the safest first sequence:

1. Fix and normalize doc metadata for legacy docs (`design/01`, `reference/01`) and publish canonical v3 merged spec.
2. Implement action contract hardening (C3) and dynamic-eval elimination (C2) before any UI extraction.
3. Stand up boundary lint (C5) and schema migration scaffold (C6).
4. Build parity harness with the 10 baseline action classes (C4/H7).
5. Begin package extraction only after the above controls are green.

This ordering front-loads risk controls and prevents architecture drift during extraction pressure.
