---
Title: Diary
Ticket: HC-009-LLM-CARD-AUTHORING-API
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-009-LLM-CARD-AUTHORING-API--llm-minimal-javascript-authoring-for-interactive-cards/design/02-implementation-plan-dsl-and-js-api-no-llm-scope.md
      Note: Canonical implementation plan for this execution run
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-009-LLM-CARD-AUTHORING-API--llm-minimal-javascript-authoring-for-interactive-cards/tasks.md
      Note: Task checklist that is executed and checked off step-by-step
ExternalSources: []
Summary: "Implementation diary for HC-009 DSL/JS API execution sequence."
LastUpdated: 2026-02-12T14:46:14-05:00
WhatFor: "Track implementation steps, decisions, failures, and validation evidence for HC-009."
WhenToUse: "Use during execution and review of HC-009 implementation tasks."
---

# Diary

## Goal

Track the concrete execution of HC-009 after scope pivot: implement DSL/JS API improvements (selector/action registries) and migrate existing apps without LLM-generation workflow work.

## Step 1: Scope Pivot and Task Setup

I started by converting HC-009 from a research-first ticket into an implementation execution ticket. The new plan explicitly removes LLM workflow tasks and focuses on the practical registry APIs needed to reduce app glue boilerplate.

I then created an executable task list in `tasks.md` so work can be completed in sequence with commits and checkoffs, and initialized this diary for continuous tracking.

### Prompt Context

**User prompt (verbatim):** "Ok, let's updateh te implementation plan by leaving the LLM stuff out for now and concentrating on getting our DSL / JS API to work well. Then:

Create tasks in the ticket, the nwork them off one by one, comitting and checking them off as you go, keeping a frequent diary."

**Assistant interpretation:** Re-scope HC-009 plan to non-LLM DSL/JS API implementation, create actionable task checklist, then execute tasks with per-task commits and diary updates.

**Inferred user intent:** Move from analysis to incremental implementation with visible operational discipline.

**Commit (code):** pending

### What I did
- Wrote `design/02-implementation-plan-dsl-and-js-api-no-llm-scope.md` as the canonical execution plan.
- Replaced placeholder ticket tasks with 6 concrete implementation tasks.
- Replaced placeholder diary content with a real execution log structure.

### Why
- Needed a concrete implementation sequence before touching runtime code.
- Needed explicit exclusion of LLM workflow to prevent scope bleed.

### What worked
- Ticket now has clear plan + task list + diary baseline.

### What didn't work
- N/A

### What I learned
- The current repo is ready for immediate implementation of registry APIs; no additional scaffolding is required.

### What was tricky to build
- The key challenge was narrowing scope without losing momentum from prior research.

### What warrants a second pair of eyes
- Confirm that Task 2-5 scope is the right minimal MVP for DSL/JS API improvements.

### What should be done in the future
- After registry migration is stable, decide whether to proceed with higher-level card authoring abstractions.

### Code review instructions
- Review `design/02-implementation-plan-dsl-and-js-api-no-llm-scope.md` and `tasks.md` together to confirm task sequencing.

### Technical details
- Initial execution tasks are now declared in `tasks.md` and will be checked off as each task commit lands.

## Step 2: Implement Engine Action Registry API

Implemented an engine-level action registry abstraction and exported it via the engine barrel so domain apps can replace handwritten switch handlers with registry declarations.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Execute Task 2 by building reusable action registry primitives in the engine package.

**Inferred user intent:** Reduce repetitive domain action glue and make app action wiring more declarative.

**Commit (code):** pending

### What I did
- Added `packages/engine/src/api/actionRegistry.ts` with:
  - `defineActionRegistry`
  - `createDomainActionHandler`
  - `ActionRegistryEntry` and context types
- Added `packages/engine/src/api/index.ts`.
- Exported new API from `packages/engine/src/index.ts`.
- Ran `npm run typecheck` successfully.

### Why
- Current apps duplicate switch-based handlers with near-identical structural logic.
- Registry abstraction centralizes the pattern and prepares app migrations.

### What worked
- New API compiles cleanly.
- Engine exports now expose registry helpers for app usage.

### What didn't work
- N/A

### What I learned
- Existing `DomainActionHandler` signature is sufficient for first registry pass; no interface change required.

### What was tricky to build
- Needed to preserve flexibility for payload mapping and side effects while staying thin enough for immediate adoption.

### What warrants a second pair of eyes
- Confirm whether future evolution should include async action support in registry entries.

### What should be done in the future
- Add tests for registry behavior once integrations are complete.

### Code review instructions
- Start at `packages/engine/src/api/actionRegistry.ts` and verify `mapPayload`, `toast`, and `effect` behavior.
- Verify export surface at `packages/engine/src/index.ts`.

### Technical details
- Validation command: `npm run typecheck`

## Step 4: Migrate Todo App to Registry APIs

Migrated the Todo application to consume the new engine registries instead of handwritten action/selector glue. The app root now derives `domainData` through a selector registry function, and the domain action handler is now registry-driven.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Execute Task 4 by converting Todo app wiring to `defineActionRegistry`/`createDomainActionHandler` and `defineSelectorRegistry`/`selectDomainData`.

**Inferred user intent:** Prove the new engine APIs are practical in a real app and reduce local boilerplate.

**Commit (code):** pending

### What I did
- Added `apps/todo/src/app/domainDataRegistry.ts` with a selector registry and `selectTodoDomainData`.
- Replaced switch-based handler in `apps/todo/src/app/domainActionHandler.ts` with `todoActionRegistry`.
- Updated `apps/todo/src/App.tsx` to consume registry-derived `domainData`.
- Ran `npm run typecheck` successfully.

### Why
- This is the first real-app validation of the DSL/JS API abstractions.
- It removes duplicated imperative wiring and aligns Todo with the new canonical pattern.

### What worked
- Typecheck remained green after migration.
- Action and selector registries covered current Todo flows without extra engine changes.

### What didn't work
- N/A

### What I learned
- Payload normalization through `mapPayload` keeps the action registry resilient to loose card-action payloads.

### What was tricky to build
- Preserving existing behavior (including navigation effect on delete) while changing handler architecture.

### What warrants a second pair of eyes
- Validate whether `createTask` payload typing should be shared with slice action payload types to avoid drift.

### What should be done in the future
- Apply the same migration pattern to Inventory to ensure cross-app consistency.

### Code review instructions
- Review `apps/todo/src/app/domainActionHandler.ts` for parity with prior switch behavior.
- Review `apps/todo/src/app/domainDataRegistry.ts` and `apps/todo/src/App.tsx` for selector registry usage.

### Technical details
- Validation command: `npm run typecheck`

## Step 3: Implement Engine Selector Registry API

Implemented the selector registry helper layer so domain apps can centralize domain-data selector wiring and derive `domainData` via one selector call.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Execute Task 3 by adding selector registry APIs in engine.

**Inferred user intent:** Reduce App-level selector boilerplate and make data binding declarative.

**Commit (code):** pending

### What I did
- Added `packages/engine/src/api/selectorRegistry.ts` with:
  - `defineSelectorRegistry`
  - `selectDomainData`
  - helper types (`SelectorRegistry`, `DomainDataFromRegistry`)
- Exported selector registry from `packages/engine/src/api/index.ts`.
- Ran `npm run typecheck` successfully.

### Why
- Current app roots manually call multiple selectors and build `domainData` objects by hand.
- Registry helper enables one stable pattern for both apps.

### What worked
- API compiles and exports correctly.
- Type inference preserves per-key return arrays in derived `domainData` object.

### What didn't work
- N/A

### What I learned
- A pure `selectDomainData` helper is sufficient for current architecture; no hook wrapper is necessary.

### What was tricky to build
- Needed to retain precise mapped return types while iterating keys dynamically.

### What warrants a second pair of eyes
- Confirm whether future versions should permit non-array selector returns in this registry.

### What should be done in the future
- Add unit tests covering key iteration and type-level expectations.

### Code review instructions
- Review `packages/engine/src/api/selectorRegistry.ts` for type shape and iteration logic.
- Verify public export via `packages/engine/src/api/index.ts`.

### Technical details
- Validation command: `npm run typecheck`
