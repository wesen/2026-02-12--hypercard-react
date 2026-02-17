---
Title: Diary
Ticket: HC-48-DESKTOP-STORYBOOK
Status: active
Topics:
    - frontend
    - architecture
    - storybook
    - windowing
    - developer-experience
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/DesktopContributions.contract.stories.tsx
      Note: Diary includes contribution contract story behavior
    - Path: packages/engine/src/components/shell/windowing/WindowContentAdapters.contract.stories.tsx
      Note: Diary includes adapter routing fixture behavior
    - Path: packages/engine/src/components/shell/windowing/useWindowInteractionController.stories.tsx
      Note: Diary includes dense drag harness addition
    - Path: scripts/storybook/check-taxonomy.mjs
      Note: Diary records path-to-title enforcement updates
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-17T16:48:24.611215145-05:00
WhatFor: ""
WhenToUse: ""
---


# Diary

## Goal

Track Workstream G Storybook restructuring, including taxonomy hard cutover and framework contract story additions.

## Step 1: Storybook Taxonomy Hard Cutover and Contract Story Coverage

I implemented Workstream G as a hard cutover. The key objective was to eliminate legacy engine story naming (`Engine/Components/*`) and replace it with a stable framework-oriented taxonomy tied to subsystem ownership (`Engine/Shell`, `Engine/Widgets`, `Engine/PluginRuntime`).

After taxonomy migration, I added contract stories for contribution composition and adapter routing, plus a 20-window drag-density harness story. These stories are intended to function as integration contracts and profiling fixtures for future framework changes.

### Prompt Context

**User prompt (verbatim):** "Ok, now create tickets for workstream F and workstream G, then work on them in the same way. continue keeping a frequent diary."

**Assistant interpretation:** Execute both remaining workstreams directly, with implementation commits and active diary updates.

**Inferred user intent:** Finish HC-45 roadmap execution with hard-cutover quality and clear handoff documentation.

**Commit (code):** c662195 — "refactor(storybook): hard-cutover engine taxonomy and add contract stories"

### What I did
- Updated taxonomy checker (`scripts/storybook/check-taxonomy.mjs`) to enforce:
  - `Engine/Shell/*` for `packages/engine/src/components/shell/**`
  - `Engine/Widgets/*` for `packages/engine/src/components/widgets/**`
  - `Engine/PluginRuntime/*` for `packages/engine/src/plugin-runtime/**`
  - reject legacy `Engine/Components/*`.
- Hard-cutover renamed existing engine story titles from:
  - `Engine/Components/Shell/*` -> `Engine/Shell/*`
  - `Engine/Components/Widgets/*` -> `Engine/Widgets/*`
- Added new contract/perf stories:
  - `packages/engine/src/components/shell/windowing/DesktopContributions.contract.stories.tsx`
  - `packages/engine/src/components/shell/windowing/WindowContentAdapters.contract.stories.tsx`
  - `TwentyWindowDensityHarness` story in `packages/engine/src/components/shell/windowing/useWindowInteractionController.stories.tsx`
- Updated Storybook sort preference in `.storybook/preview.ts` to reflect framework taxonomy.
- Ran validation:
  - `npm run storybook:check`
  - `npm run test -w packages/engine`
  - `npm run typecheck`

### Why
- Storybook navigation was previously inconsistent and less framework-oriented.
- HC-45 workstream required contract-driven stories to support framework reuse and safer refactors.

### What worked
- Taxonomy checker enforced the new story grouping cleanly.
- Bulk title migration did not break story placement checks.
- New contract stories compile and support deterministic output fixtures.

### What didn't work
- Initial typecheck failed in the new contribution contract story due to `DesktopMenuEntry` union access (`id` missing on separator entries). I fixed this with a safe `'id' in item` guard.

### What I learned
- The taxonomy checker is lightweight but effective once expected prefixes are path-specific.
- Contract stories are useful for validating composition/routing without booting full app shells.

### What was tricky to build
- Keeping taxonomy strict while not moving story files required path-aware prefix logic in the checker.
- The contract story needed to avoid relying on internal unsafe assumptions about union entry shape.

### What warrants a second pair of eyes
- Whether additional story groups should be added for future reusable framework packages (for example adapters as a separate top-level group).
- Whether we want snapshot coverage on the new contract fixture outputs.

### What should be done in the future
- Add visual/perf baselines around the 20-window harness if regression tracking is needed in CI.

### Code review instructions
- Start with enforcement logic:
  - `scripts/storybook/check-taxonomy.mjs`
- Review story taxonomy cutover examples:
  - `packages/engine/src/components/shell/ChatSidebar.stories.tsx`
  - `packages/engine/src/components/widgets/DataTable.stories.tsx`
- Review new contract/perf fixtures:
  - `packages/engine/src/components/shell/windowing/DesktopContributions.contract.stories.tsx`
  - `packages/engine/src/components/shell/windowing/WindowContentAdapters.contract.stories.tsx`
  - `packages/engine/src/components/shell/windowing/useWindowInteractionController.stories.tsx`
- Validate with:
  - `npm run storybook:check`
  - `npm run test -w packages/engine`
  - `npm run typecheck`

### Technical details
- Taxonomy checker now maps expected prefixes by engine story path segment.
- Legacy `Engine/Components/*` titles are rejected explicitly.
- Storybook sort now groups engine stories by `Shell`, `Widgets`, `PluginRuntime`.
