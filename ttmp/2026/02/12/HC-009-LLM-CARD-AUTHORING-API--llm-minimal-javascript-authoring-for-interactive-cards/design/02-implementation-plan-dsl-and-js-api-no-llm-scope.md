---
Title: 'Implementation Plan: DSL and JS API (No LLM Scope)'
Ticket: HC-009-LLM-CARD-AUTHORING-API
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/dispatchDSLAction.ts
      Note: Current extension point where domain action handling plugs into shell dispatch
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Current orchestration component where domain data and custom renderers are consumed
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/app/domainActionHandler.ts
      Note: Current handwritten domain action switch implementation to be replaced
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/todo/src/app/domainActionHandler.ts
      Note: Second handwritten domain action switch implementation to be replaced
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Current manual domainData selector wiring pattern
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/todo/src/App.tsx
      Note: Second manual domainData selector wiring pattern
Summary: "Implementation plan for DSL/JS API registries and runtime helpers, intentionally excluding LLM generation workflow."
LastUpdated: 2026-02-12T16:05:00-05:00
WhatFor: "Execute DSL/JS API improvements that reduce boilerplate and improve consistency in app integrations."
WhenToUse: "Use as implementation source-of-truth for HC-009 execution tasks."
---

# Implementation Plan: DSL and JS API (No LLM Scope)

## Scope Directive

This plan intentionally excludes LLM prompt/generation workflow work.

In-scope:

- DSL/JS API ergonomics for app authors.
- Reducing handwritten app glue for selectors and domain actions.
- Consolidating repeated patterns into reusable engine helpers.

Out-of-scope for this ticket:

- LLM prompt packs.
- JSON-spec generation/repair loop.
- LLM-specific validation pipelines.

## Problem to Solve

Current apps repeat two categories of boilerplate:

1. Domain action switch boilerplate
- `apps/inventory/src/app/domainActionHandler.ts`
- `apps/todo/src/app/domainActionHandler.ts`

2. Domain data selector plumbing boilerplate
- `apps/inventory/src/App.tsx`
- `apps/todo/src/App.tsx`

Goal:

- Replace switch-based domain action handlers with registry-driven handlers.
- Replace manual multi-selector app-root plumbing with selector registry helpers.

## Target DSL/JS API Additions

### 1) Action Registry API

Engine should expose:

- `defineActionRegistry(...)`
- `createDomainActionHandler(registry)`

Capabilities:

- map action type to payload transformer + action creator
- optional toast formatting
- optional side effects (e.g. navigation)

### 2) Selector Registry API

Engine should expose:

- `defineSelectorRegistry(...)`
- `selectDomainData(state, registry)`

Capabilities:

- central named domain-data selector map
- one `useSelector` call in app root for domainData hydration
- less per-card/per-app selector plumbing code

### 3) App Integration Pattern

Apps should move to:

- `domainActionRegistry.ts`
- `domainDataRegistry.ts`

Then:

- `App.tsx` imports both and stays thin.

## Delivery Phases

### Phase 1: Engine registry primitives

Deliverables:

- new engine module for registry helpers
- exports wired through engine barrel

Acceptance:

- typecheck passes
- helper APIs consumable by both apps

### Phase 2: Todo app integration

Deliverables:

- replace handwritten action switch with registry handler
- replace manual task selector plumbing with selector registry helper

Acceptance:

- app compiles
- current todo interactions still work

### Phase 3: Inventory app integration

Deliverables:

- replace handwritten action switch with registry handler
- replace manual items/sales selector plumbing with selector registry helper

Acceptance:

- app compiles
- current inventory interactions still work

### Phase 4: Documentation and ticket hygiene

Deliverables:

- update ticket diary with each step
- changelog entries
- tasks checked off

Acceptance:

- ticket artifacts reflect final implementation state

## Risks

1. Registry API over-generalization
- Keep MVP focused on current app patterns.

2. Type friction from dynamic DSL action shapes
- Use narrow helper utility types with runtime-safe coercion in payload mappers.

3. Behavior drift during switch replacement
- Preserve toast strings and side effects exactly.

## Done Criteria

HC-009 is complete when:

- both apps no longer rely on handwritten switch-based domain handlers
- both apps no longer manually assemble domainData via multiple `useSelector` calls in `App.tsx`
- engine exports reusable registry APIs that support both apps
- tasks are checked off and diary/changelog are current
