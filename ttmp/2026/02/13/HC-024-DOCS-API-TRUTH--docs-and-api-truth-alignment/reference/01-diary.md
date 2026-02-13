---
Title: Diary
Ticket: HC-024-DOCS-API-TRUTH
Status: done
Topics: [documentation, api]
DocType: reference
Intent: long-term
---

# Diary

## Goal
Rewrite README and JS API guide from current source truth, removing all stale/legacy references.

## Step 1: Full rewrite (commit ab3a33b)

### What I did
- **README.md**: Complete rewrite. New architecture tree matching actual directories. Added "Creating an App" section with 7 concrete steps (types+slice → createAppStore → shared bridge → cards → stack → HyperCardShell → createStoryHelpers). Added runtime action resolution order, selector resolution order, tooling table.
- **docs/js-api-user-guide-reference.md**: Rewrote from 1493 lines to ~260 lines of verified content. 13 sections covering DSL model, built-in actions, action/selector resolution, app bootstrap (createAppStore, createDSLApp, createStoryHelpers), streaming chat, debug utilities, navigation, theming, tooling. Added Legacy Notes section listing 6 removed symbols.

### What I removed
- `dispatchDSLAction` — never existed in current exports
- `defineActionRegistry` — replaced by sharedActions prop
- `selectDomainData` — replaced by shared selectors
- `customRenderers` — replaced by CardRenderer + ui.* nodes
- `domainData` — replaced by Redux + shared selectors
- `Stack.data` — replaced by Redux slices
- `src/dsl/`, `src/overrides/` directory references
- All synthetic examples that didn't match actual API

### How I verified
- Cross-referenced every documented symbol against `packages/engine/src/index.ts` barrel
- Verified example patterns match actual app code in `apps/crm`, `apps/todo`, `apps/inventory`
- typecheck ✓, lint ✓, test ✓
