---
Title: Diary
Ticket: HC-020-DSL-SCAFFOLDING-TOOLING
Status: active
Topics:
    - frontend
    - architecture
    - redux
    - storybook
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/debug/debugSlice.ts
      Note: "Extracted standard debug slice (commit eed5eb4)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/debug/useStandardDebugHooks.ts
      Note: "Extracted standard debug hooks (commit eed5eb4)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/debug/StandardDebugPane.tsx
      Note: "Generic debug pane with snapshotSelector (commit eed5eb4)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts
      Note: "Pre-wired store factory (commit eed5eb4)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/generateCardStories.tsx
      Note: "createStoryHelpers for per-card stories (commit 7cb792c)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/createDSLApp.tsx
      Note: "One-call App+store+debug setup (commit eed5eb4)"
ExternalSources: []
Summary: Implementation diary for HC-020 — extracting DSL app scaffolding into reusable engine utilities.
LastUpdated: 2026-02-13T13:30:00-05:00
WhatFor: Track the scaffolding extraction journey.
WhenToUse: Reference when reviewing or extending the engine utilities.
---

# Diary

## Goal

Extract 504 lines of copy-paste scaffolding from DSL apps into reusable `@hypercard/engine` utilities so that building a new app only requires writing domain files.

## Step 1: Plan and Engine Extraction (Tasks 1-5)

Built all 5 engine utilities in a single pass: debug slice, debug hooks, StandardDebugPane, createAppStore, createStoryHelpers, and createDSLApp. Each utility targets a specific category of boilerplate.

### Prompt Context

**User prompt (verbatim):** "Ok, make a new ticket for all tooling improvement, with an implementation plan document and tasks. then work on the tasks one by one, commit, update your diary, check off the task, and build it."

**Assistant interpretation:** Create HC-020 ticket, write implementation plan, then implement all scaffolding extraction tasks with incremental commits.

**Inferred user intent:** Make the DSL app creation process so streamlined that an LLM only needs to produce domain-specific code.

**Commit (code):** eed5eb4 — "feat(engine): extract scaffolding utilities"

### What I did
- Created `packages/engine/src/debug/` with debugSlice.ts, useStandardDebugHooks.ts, StandardDebugPane.tsx
- Created `packages/engine/src/app/` with createAppStore.ts, generateCardStories.tsx, createDSLApp.tsx
- Exported NavigationState and NotificationsState for store type inference
- Added barrel exports to engine index.ts

### Why
- debugSlice.ts and useRuntimeDebugHooks.ts were byte-identical across book-tracker and CRM apps
- DebugPane.tsx differed only in snapshot keys and title string
- store.ts was pure reducer wiring boilerplate
- Stories followed a mechanical per-card pattern

### What worked
- All 5 utilities compiled on first attempt after fixing two type issues
- The `snapshotSelector` prop pattern for StandardDebugPane cleanly abstracts the only varying piece

### What didn't work
- Initial compile had two type errors: `NavigationState` and `NotificationsState` were not exported from their slice files. Fixed by making them `export interface`.

### What I learned
- TypeScript's `composite: true` mode requires all types referenced in return types to be exported
- The `createAppStore` helper needs to use generics to preserve the domain reducer types in the returned store type

### What was tricky to build
- The `createAppStore` return type needed careful handling. RTK's `configureStore` infers the state type from the reducer map, but since we merge engine + domain reducers dynamically, the generic `T extends Record<string, Reducer>` was needed to preserve type info.

### What warrants a second pair of eyes
- The `createAppStore` type assertions — verify the `RootState` / `AppDispatch` types are correct downstream

### What should be done in the future
- N/A

### Code review instructions
- Review `packages/engine/src/debug/` and `packages/engine/src/app/`
- Verify with: `npx tsc -b packages/engine/tsconfig.json`


## Step 2: Migrate Book Tracker (Task 6)

Migrated book-tracker-debug to use the new engine utilities. Deleted 3 debug files (220 lines), simplified store.ts and stories.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Commit (code):** 42b8a0d — "refactor(book-tracker): migrate to engine scaffolding utilities"

### What I did
- Deleted `debug/debugSlice.ts`, `debug/useRuntimeDebugHooks.ts`, `debug/DebugPane.tsx`
- Rewrote `store.ts` using `createAppStore()` (24→9 lines)
- Rewrote `App.tsx` using `StandardDebugPane` + `useStandardDebugHooks`
- Rewrote stories using `generateCardStories()` (110→44 lines)

### What worked
- Clean typecheck on first try after migration
- All existing story names preserved

### What didn't work
- N/A

### What I learned
- The migration is mechanical — took ~2 minutes per app

### What was tricky to build
- Nothing — the extraction was designed for drop-in replacement

### What warrants a second pair of eyes
- N/A

### What should be done in the future
- N/A


## Step 3: Migrate CRM + Storybook CSF Fix (Tasks 7-8)

Migrated CRM app and discovered that Storybook v10's CSF parser cannot handle dynamically-generated `export default` from a utility function. Fixed by redesigning the API.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Commit (code):** 1c41a80 — "refactor(crm): migrate to engine scaffolding utilities"
**Commit (code):** 7cb792c — "fix(engine): switch to createStoryHelpers pattern for CSF compatibility"

### What I did
- Migrated CRM: deleted 3 debug files (223 lines), simplified store + App + stories
- Hit Storybook CSF error: "CSF: missing default export"
- Redesigned `generateCardStories()` → `createStoryHelpers()`: returns `{ storeDecorator, createStory, FullApp }` so meta stays as a statically-visible `export default` in the story file
- Updated both apps' stories to the new pattern
- Verified all 14 CRM + 7 BookTrackerDebug stories indexed in Storybook

### Why
- Storybook v10 CSF parser statically analyzes files at build time — it needs to see `export default <object>` literally in the source, not `export default dynamicFunction().meta`

### What worked
- The `createStoryHelpers` pattern preserves all convenience (store decorator, per-card story factory) while keeping CSF-compliant static structure
- Both apps pass typecheck and all stories appear in Storybook

### What didn't work
- First attempt used `generateCardStories()` returning `{ meta, stories }` — Storybook's static analyzer couldn't find the default export and refused to index the file
- Error: "CSF: missing default export ./apps/crm/src/stories/CrmApp.stories.tsx (line 1, col 0)"

### What I learned
- Storybook v10's CSF indexer is a static AST analyzer, NOT a runtime evaluator. It looks for `export default` at the module scope with a statically-resolvable object literal. Any indirection (function return, destructured re-export) breaks it.
- This is a fundamental constraint: you cannot fully automate the meta+default-export from a utility function.

### What was tricky to build
- The CSF constraint was non-obvious. The error message says "missing default export" but the file had `export default meta`. The real issue is that `meta` was `= generateCardStories(...).meta` — a dynamic value the static parser couldn't resolve. The fix required splitting the API: the utility provides helpers, but the story file itself defines the meta object literal inline.

### What warrants a second pair of eyes
- Verify that Storybook's CSF parser is happy with the `satisfies Meta<typeof FullApp>` pattern — some Storybook versions are picky about type annotations on the default export

### What should be done in the future
- Monitor Storybook evolution — if v11+ supports dynamic CSF, the API could be simplified back to a single-call pattern

### Code review instructions
- Compare old vs new: `git diff 42b8a0d..7cb792c -- apps/crm/src/stories/`
- Verify Storybook at http://localhost:6006 — check CRM/Full App has all 14 stories
- Verify typecheck: `npx tsc --build`


## Final Metrics

### Lines eliminated per app

| Component | Before | After | Saved |
|-----------|-------:|------:|------:|
| debug/* (3 files) | 223 | 0 | 223 |
| store.ts | 31 | 15 | 16 |
| App.tsx | 28 | 44 | -16 (grew slightly — snapshotSelector inline) |
| stories | 127 | 55 | 72 |
| **Total scaffolding** | **504** | **189** | **315 (63%)** |

### Engine utilities added

| File | Lines | Purpose |
|------|------:|---------|
| debug/debugSlice.ts | 109 | Standard debug event store |
| debug/useStandardDebugHooks.ts | 54 | Standard hook adapter |
| debug/StandardDebugPane.tsx | 75 | Generic debug pane |
| app/createAppStore.ts | 49 | Pre-wired store factory |
| app/generateCardStories.tsx | 139 | Per-card story helpers |
| app/createDSLApp.tsx | 76 | One-call app setup |
| **Total** | **531** | Shared across all apps |
