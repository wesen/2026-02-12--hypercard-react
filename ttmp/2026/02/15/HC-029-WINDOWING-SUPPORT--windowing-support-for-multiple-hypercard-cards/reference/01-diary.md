---
Title: Diary
Ticket: HC-029-WINDOWING-SUPPORT
Status: active
Topics:
    - frontend
    - ux
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/.storybook/main.ts
      Note: Validated preset/addon configuration during Storybook failure triage
    - Path: package.json
      Note: Root Storybook script now routes through workspace-local binary
    - Path: packages/engine/src/cards/runtime.ts
      Note: Runtime action plumbing reviewed during feasibility analysis
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Current shell architecture inspected during mapping
    - Path: packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx
      Note: Storybook-first desktop primitive scenarios for HC-029
    - Path: packages/engine/src/components/shell/windowing/WindowLayer.tsx
      Note: Deterministic z-order window rendering primitive
    - Path: packages/engine/src/theme/base.css
      Note: Windowing shell tokenized styles for menu/icons/windows
    - Path: ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/01-windowing-container-framework-study.md
      Note: Primary long-form design study documented in this diary
    - Path: ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/02-clean-cutover-implementation-plan.md
      Note: Clean cutover plan added in Step 7
    - Path: ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/sources/local/mac1-windowing.jsx
      Note: Imported source analyzed during research steps
ExternalSources: []
Summary: Step-by-step research diary for extracting a reusable window manager system from the imported Mac example and mapping it into HyperCard engine architecture.
LastUpdated: 2026-02-15T14:30:00-05:00
WhatFor: Preserve full implementation/research trace and design rationale for HC-029.
WhenToUse: Use when reviewing why design decisions were made and how to validate them.
---





# Diary

## Goal

Capture the full research and design process for HC-029, including ticket setup, source analysis, architectural mapping, UX exploration, and final design-doc production.

## Step 1: Ticket creation and source import

I started by executing the exact operational request before analysis so all research artifacts would live under the new ticket workspace. This created a clean document trail and guaranteed the imported inspiration source was versioned inside the ticket.

This step established the workspace skeleton used for all later writing and references.

### Prompt Context

**User prompt (verbatim):**
```text
Create a new docmgr ticket HC-029-WINDOWING-SUPPORT and use docmgr import file --file /tmp/mac1-windowing.jsx --ticket HC-029-WINDOWING-SUPPORT to import the example sourcecode, and then study in depth how to extract out the window manager aspect of the example, the menu bar, the icons, so that we can make a windowed container for multiple hypercard card.

Study in depth and with a framework designer set in mind, sketch out screenshots and potential widget components system, and think hard about UX. The example source code is for inspiration, but of course we could reuse parts of it as well or turn them into something more generic. Refere to filenames and psymbols and write pseudocode and use diagrams when useful. Store the document in the ticket, 8+ pages.

Keep a frequent diary as you research.
```

**Assistant interpretation:** Create the ticket, import the source file with the exact command, then produce a deep architecture+UX study document and a frequent process diary in the ticket.

**Inferred user intent:** Build a serious framework-level plan for multi-window HyperCard support, not a shallow code summary.

**Commit (code):** N/A (no git commit created)

### What I did

- Ran `docmgr ticket create-ticket --ticket HC-029-WINDOWING-SUPPORT --title "Windowing support for multiple HyperCard cards" --topics frontend,ux,architecture`.
- Ran the exact requested import: `docmgr import file --file /tmp/mac1-windowing.jsx --ticket HC-029-WINDOWING-SUPPORT`.
- Created two docs:
  - `docmgr doc add --ticket HC-029-WINDOWING-SUPPORT --doc-type reference --title "Diary"`
  - `docmgr doc add --ticket HC-029-WINDOWING-SUPPORT --doc-type design-doc --title "Windowing Container Framework Study"`

### Why

- Needed a canonical ticket workspace before analysis.
- Needed the imported file stored under `sources/local/` so references in the final study were stable and local.

### What worked

- Ticket workspace created successfully under `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards`.
- Source file imported successfully to `sources/local/mac1-windowing.jsx`.
- Design-doc and diary files were scaffolded with frontmatter.

### What didn't work

- N/A in this step.

### What I learned

- `docmgr import file` updates ticket source metadata and index automatically, which reduces manual bookkeeping.

### What was tricky to build

- No implementation complexity here; this was mostly execution sequencing.

### What warrants a second pair of eyes

- Confirm ticket topic taxonomy (`frontend, ux, architecture`) matches team conventions.

### What should be done in the future

- Add a ticket task checklist once implementation starts.

### Code review instructions

- Verify created paths:
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/index.md`
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/sources/local/mac1-windowing.jsx`
- Re-run `docmgr doc list --ticket HC-029-WINDOWING-SUPPORT`.

### Technical details

- Core commands:
  - `docmgr ticket create-ticket ...`
  - `docmgr import file ...`
  - `docmgr doc add ...`

## Step 2: Deep source archeology of mac1-windowing.jsx

I then inspected the imported source in detail with line-numbered reads and symbol scans. The objective was to separate reusable interaction patterns from demo-specific shortcuts.

This pass created the extraction inventory used by the final design document.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Identify reusable window manager, menu bar, and icon system primitives from the sample code.

**Inferred user intent:** Reuse inspiration without inheriting prototype-level coupling.

**Commit (code):** N/A

### What I did

- Measured file size: `wc -l .../mac1-windowing.jsx` (644 lines).
- Indexed symbols and states via `rg -n` for `MacWindow`, `MenuBar`, `openWin`, `focus`, `drag`, `resize`, `handleMenu`, `DESKTOP_ICONS`, and style blocks.
- Read source in line ranges with `sed -n` and `nl -ba` to capture precise references.
- Identified key extraction seams:
  - window mechanics (`MacWindow`, drag/resize handlers)
  - menu mechanics (`MENU_ITEMS`, `MenuBar`, `handleMenu`)
  - icon launch model (`DESKTOP_ICONS`, `handleIconDbl`)
  - app registry model (`openApp`, `handleItemOpen`)

### Why

- Needed concrete line/symbol citations for the design doc.
- Needed behavioral decomposition before architecture mapping.

### What worked

- Symbol scan quickly identified all core behaviors.
- Line-numbered inspection made references reliable for the final writeup.

### What didn't work

- Initial broad search command included non-existent `src` at repo root:
  - Command: `rg -n "HyperCard|card|stack|window|desktop|menu|menubar|icon|draggable|zIndex|canvas|workspace" src . --glob '!ttmp/**'`
  - Error: `rg: src: No such file or directory (os error 2)`
- Resolution: re-scoped subsequent searches to existing paths under `packages/` and `apps/`.

### What I learned

- The sample is strong on interaction feel but intentionally loose on state architecture.
- `openWin` uses title-based dedupe and nested state updates that need formalization in reducer architecture.

### What was tricky to build

- The main challenge was not parsing the code itself, but separating timeless interaction patterns from one-off demo logic (for example string-label command handling in menus).

### What warrants a second pair of eyes

- Validate whether title-based dedupe behavior should be retained as default in framework V1.

### What should be done in the future

- Build a minimal behavior matrix test suite directly from extracted interactions.

### Code review instructions

- Start at:
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/sources/local/mac1-windowing.jsx:328`
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/sources/local/mac1-windowing.jsx:400`
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/sources/local/mac1-windowing.jsx:446`
- Re-run line extraction with `nl -ba ... | sed -n '320,620p'`.

### Technical details

- Commands used:
  - `wc -l ...`
  - `rg -n ...`
  - `sed -n '1,260p' ...`
  - `sed -n '261,520p' ...`
  - `sed -n '521,760p' ...`
  - `nl -ba ... | sed -n '320,620p'`

## Step 3: Mapping to current HyperCard engine architecture

After source archeology, I mapped the extracted patterns to current engine constraints. This made clear where windowing can be layered in and where foundational state changes are unavoidable.

This step shaped the architecture section and migration plan.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Design with a framework mindset and reference concrete repo files/symbols.

**Inferred user intent:** Produce an actionable design that fits the existing engine, not a greenfield proposal.

**Commit (code):** N/A

### What I did

- Inspected shell/runtime/navigation files with line numbers:
  - `packages/engine/src/components/shell/HyperCardShell.tsx`
  - `packages/engine/src/components/shell/WindowChrome.tsx`
  - `packages/engine/src/features/navigation/navigationSlice.ts`
  - `packages/engine/src/cards/runtime.ts`
  - `packages/engine/src/cards/runtimeStateSlice.ts`
  - `packages/engine/src/theme/base.css`
  - `packages/engine/src/parts.ts`
- Inspected app-level usage in inventory app:
  - `apps/inventory/src/domain/stack.ts`
  - `apps/inventory/src/App.tsx`
- Identified primary gap: single navigation stack + runtime card keying by cardId prevents isolated duplicate card windows.

### Why

- Needed a compatibility-aware design and realistic rollout plan.

### What worked

- Found clean extension boundary: add a new desktop shell path while preserving current `HyperCardShell`.
- Existing parts/token theming model provides a strong styling foundation for new windowing components.

### What didn't work

- N/A (other than the prior `rg src` issue already captured in Step 2).

### What I learned

- The biggest technical risk is runtime/session identity, not window frame rendering.
- Windowing can be introduced incrementally if command routing and state ownership are separated cleanly.

### What was tricky to build

- Hard part was proving where state collisions happen before coding; this required correlating navigation slice behavior, runtime slice schema, and shell rendering path in one model.

### What warrants a second pair of eyes

- Validate session key strategy options (`cardId::sessionId` synthetic key vs explicit runtime `sessionId` model).

### What should be done in the future

- Add a short architecture RFC specifically for runtime session identity before coding Phase 4.

### Code review instructions

- Primary constraint files:
  - `packages/engine/src/components/shell/HyperCardShell.tsx:99`
  - `packages/engine/src/features/navigation/navigationSlice.ts:10`
  - `packages/engine/src/cards/runtime.ts:345`
  - `packages/engine/src/cards/runtimeStateSlice.ts:118`

### Technical details

- Commands used:
  - `nl -ba packages/engine/src/components/shell/HyperCardShell.tsx | sed -n '1,420p'`
  - `nl -ba packages/engine/src/features/navigation/navigationSlice.ts | sed -n '1,160p'`
  - `nl -ba packages/engine/src/cards/runtime.ts | sed -n '320,700p'`
  - `nl -ba packages/engine/src/cards/runtimeStateSlice.ts | sed -n '1,260p'`

## Step 4: Writing the first full design-doc draft

With the architecture constraints clear, I produced the long-form design doc including extraction analysis, proposed component system, state model, pseudocode, and diagrams.

This draft was written to exceed a normal handoff note and function as a design baseline for implementation work.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Produce an in-depth framework study with diagrams, pseudocode, and explicit file/symbol references.

**Inferred user intent:** Enable concrete build execution from the design doc.

**Commit (code):** N/A

### What I did

- Replaced scaffold template in:
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/01-windowing-container-framework-study.md`
- Added:
  - extraction inventory (window/menu/icon/app registry)
  - engine constraint mapping
  - proposed architecture + module layout
  - window/menu/icon contracts
  - mermaid diagrams
  - pseudocode for open/focus, drag/resize, command routing, card session hosting
  - implementation phases and test strategy

### Why

- Needed a coherent, reviewable artifact before adding further UX depth.

### What worked

- The document naturally aligned around a staged rollout model.
- Existing file/symbol citations provided concrete anchors.

### What didn't work

- N/A in tooling; drafting was straightforward.

### What I learned

- Diagramming command routing early reduces ambiguity in menu/icon design decisions.

### What was tricky to build

- Balancing framework generality with immediate implementation guidance required deliberately separating conceptual entities from near-term file/module proposals.

### What warrants a second pair of eyes

- Review the phase boundaries to ensure they match team delivery cadence and risk appetite.

### What should be done in the future

- Add one small proof-of-concept branch implementing only Phase 1 reducers + window frame.

### Code review instructions

- Read in order:
  1. Executive Summary + Problem Statement
  2. Source Archeology
  3. Proposed Architecture + Data Model
  4. Implementation Plan

### Technical details

- Commands used:
  - `cat > .../design-doc/01-windowing-container-framework-study.md <<'EOF' ... EOF`

## Step 5: Expanding the doc for 8+ page depth and UX rigor

After drafting, I expanded the document to hit the requested depth target and add practical UX rigor beyond architecture mechanics.

This included failure modes, acceptance criteria, detailed component APIs, and migration guidance for existing apps.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Ensure the final document is long, detailed, and strongly UX-aware.

**Inferred user intent:** Produce something implementation teams can use directly, not only architects.

**Commit (code):** N/A

### What I did

- Appended major sections via patch:
  - `UX Deep Dive`
  - `Detailed Widget API Sketches`
  - `Command Router Design`
  - `Runtime Isolation Strategy`
  - `Migration Guide for Existing Apps`
  - `Failure Mode Analysis`
  - `Performance Considerations`
  - `Acceptance Criteria`
- Verified document length with:
  - `wc -w .../design-doc/01-windowing-container-framework-study.md`
  - Result: `4504` words.

### Why

- Needed to satisfy "8+ pages" requirement with substantive content.
- Needed explicit UX and risk controls for framework-grade planning.

### What worked

- Word count crossed target comfortably.
- Added sections improved implementability and review clarity.

### What didn't work

- N/A.

### What I learned

- Adding failure modes and acceptance criteria materially improves architecture handoff quality.

### What was tricky to build

- Avoiding repetition while expanding document length required introducing new decision layers (API contracts, migration path, and quality gates) rather than only adding prose.

### What warrants a second pair of eyes

- Review whether all acceptance criteria are realistic for the first implementation increment.

### What should be done in the future

- Convert acceptance criteria into ticket tasks before implementation starts.

### Code review instructions

- Focus on expanded sections near the lower half of the design doc.
- Re-check word count with `wc -w` if doc is edited further.

### Technical details

- Commands used:
  - `apply_patch` on `design-doc/01-windowing-container-framework-study.md`
  - `wc -w ...`

## Step 6: Ticket bookkeeping, relationships, and traceability

With content complete, I finalized ticket hygiene so future contributors can trace sources and design rationale quickly.

This step ties source files and docs together in docmgr metadata and changelog history.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Store all research outputs in the ticket, with ongoing diary trace.

**Inferred user intent:** Leave a durable, review-friendly ticket artifact set.

**Commit (code):** N/A

### What I did

- Related key files to the design doc with `docmgr doc relate --doc .../design-doc/01-windowing-container-framework-study.md` and 8 `--file-note` entries.
- Related key files to the diary with `docmgr doc relate --doc .../reference/01-diary.md` and 4 `--file-note` entries.
- Updated changelog with `docmgr changelog update --ticket HC-029-WINDOWING-SUPPORT --entry \"...\" --file-note ...`.
- Validated frontmatter for both docs using `docmgr validate frontmatter --doc <absolute-path> --suggest-fixes`.

### Why

- Metadata relationships are necessary for durable discoverability.

### What worked

- Diary now includes frequent sequential steps from setup through finalization.

### What didn't work

- N/A.

### What I learned

- Frequent step logging during research makes later design-review questions much easier to answer.

### What was tricky to build

- Keeping entries concise while still meeting strict diary section requirements and preserving exact command/error details.

### What warrants a second pair of eyes

- Confirm diary verbosity is aligned with team expectations for long design tickets.

### What should be done in the future

- During implementation phase, append new diary steps with test results and commit hashes.

### Code review instructions

- Validate this diary structure against project diary conventions.
- Confirm all steps include `Prompt Context`, `What worked`, and `What didn't work` sections.

### Technical details

- Executed bookkeeping commands:
  - `docmgr doc relate --doc /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/01-windowing-container-framework-study.md --file-note ...`
  - `docmgr doc relate --doc /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/reference/01-diary.md --file-note ...`
  - `docmgr changelog update --ticket HC-029-WINDOWING-SUPPORT --entry \"Created ticket HC-029, imported mac1-windowing.jsx, authored a 4504-word windowing framework design study (with diagrams/pseudocode/UX wire sketches), and recorded a frequent multi-step research diary.\" --file-note ...`
  - `docmgr validate frontmatter --doc /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/01-windowing-container-framework-study.md --suggest-fixes`
  - `docmgr validate frontmatter --doc /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/reference/01-diary.md --suggest-fixes`

## Step 7: Clean cutover implementation plan + task expansion

I created a separate implementation-focused design doc that converts the earlier architecture study into a hard execution plan. This explicitly enforces a non-backwards-compatible cutover with no deprecated wrappers or compatibility adapters.

I also replaced the placeholder task list with a full phase-ordered execution checklist so implementation can start immediately from ticket tasks.

### Prompt Context

**User prompt (verbatim):** "ok, create a detailed implementation plan, we have no need for backwards compatibility and can do clean cutover (and leave no deprecated/wrappers behind). Add tasks to ticket."

**Assistant interpretation:** Produce a concrete cutover plan document and convert ticket tasks into detailed implementation steps reflecting a strict no-compatibility policy.

**Inferred user intent:** Start implementation with a decisive architecture transition and avoid long-lived migration complexity.

**Commit (code):** N/A

### What I did

- Added new design doc:
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/02-clean-cutover-implementation-plan.md`
- Wrote detailed sections:
  - clean-cutover policy
  - explicit file scope (new/rewritten/deleted)
  - phase-by-phase implementation plan
  - testing matrix, acceptance criteria, and merge strategy
- Removed placeholder task and added 51 detailed tasks across Phases 0-7 plus final gates.
- Related key files to the new doc with `docmgr doc relate`.
- Updated ticket changelog with plan+task expansion entry.

### Why

- The architecture study (`01-windowing-container-framework-study.md`) is broad; implementation needed a stricter delivery plan with deletion gates and sequencing.
- A clean-cutover requirement needed explicit guardrails to prevent accidental compatibility shims.

### What worked

- New implementation plan doc created and validated.
- Task list expanded successfully and now reflects concrete execution order.
- Changelog and relationships were updated for traceability.

### What didn't work

- N/A.

### What I learned

- Explicitly documenting deletion scope up front reduces risk of accidental legacy retention during large refactors.

### What was tricky to build

- The main challenge was balancing detail with execution clarity: enough specificity to implement directly, while avoiding over-constraining component internals too early.

### What warrants a second pair of eyes

- Confirm the deletion list in Phase 6 matches all real usage paths before implementation starts.
- Confirm whether `WindowChrome.tsx` should be deleted or repurposed under the new primitive layer.

### What should be done in the future

- Start implementation from Phase 1 tasks and check off tasks as each phase lands.
- Add commit hashes and test outputs to future diary steps as code is implemented.

### Code review instructions

- Review:
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/02-clean-cutover-implementation-plan.md`
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/tasks.md`
- Validate frontmatter:
  - `docmgr validate frontmatter --doc /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/02-clean-cutover-implementation-plan.md --suggest-fixes`

### Technical details

- Commands used:
  - `docmgr doc add --ticket HC-029-WINDOWING-SUPPORT --doc-type design-doc --title "Clean Cutover Implementation Plan"`
  - `docmgr task remove --ticket HC-029-WINDOWING-SUPPORT --id 1`
  - multiple `docmgr task add --ticket HC-029-WINDOWING-SUPPORT --text "..."`
  - `docmgr doc relate --doc /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/02-clean-cutover-implementation-plan.md --file-note ...`
  - `docmgr changelog update --ticket HC-029-WINDOWING-SUPPORT --entry "Added a detailed clean-cutover implementation plan (no backwards compatibility, no wrappers) and expanded ticket tasks into a 51-item phase-by-phase execution checklist." --file-note ...`

## Step 8: Unblock Storybook preset loading in workspace command path

I pivoted to a build-blocking Storybook startup failure before continuing HC-029 implementation work. The failure prevented visual tracking in Storybook, so I treated it as a prerequisite fix for the ticket workflow.

The root cause was dependency resolution from an `npx`-spawned Storybook runtime while workspace dependencies were not installed, combined with a root script that preferred transient invocation over the app workspace binary.

### Prompt Context

**User prompt (verbatim):**
```text
First fix this: ■  SB_CORE-SERVER_0002 (CriticalPresetLoadError): Storybook failed to load the
│  following preset: @storybook/react-vite/preset.

│  Please check whether your setup is correct, the Storybook dependencies (and
│  their peer dependencies) are installed correctly and there are no package
│  version clashes.

│  If you believe this is a bug, please open an issue on Github.

│  Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@storybook/react-vite'
│  imported from
│  /home/manuel/.npm/_npx/6fe9a9991b157df1/node_modules/storybook/dist/_node-chunks/chunk-C6KVY6VB.js
│  at Object.getPackageJSONURL (node:internal/modules/package_json_reader:314:9)
│  at packageResolve (node:internal/modules/esm/resolve:767:81)
│  at moduleResolve (node:internal/modules/esm/resolve:853:18)
│  at defaultResolve (node:internal/modules/esm/resolve:983:11)
│  at nextResolve (node:internal/modules/esm/hooks:748:28)
│  at Hooks.resolve (node:internal/modules/esm/hooks:240:30)
│  at MessagePort.handleMessage (node:internal/modules/esm/worker:199:24)
│  at [nodejs.internal.kHybridDispatch] (node:internal/event_target:827:20)
│  at MessagePort.<anonymous> (node:internal/per_context/messageport:23:28)

│  More info:
│  
│  at loadPreset
│  (file:///home/manuel/.npm/_npx/6fe9a9991b157df1/node_modules/storybook/dist/_node-chunks/chunk-WF46L34H.js:10081:13)
│  at async Promise.all (index 0)
│  at async loadPresets
│  (file:///home/manuel/.npm/_npx/6fe9a9991b157df1/node_modules/storybook/dist/_node-chunks/chunk-WF46L34H.js:10090:73)
│  at async getPresets
│  (file:///home/manuel/.npm/_npx/6fe9a9991b157df1/node_modules/storybook/dist/_node-chunks/chunk-WF46L34H.js:10121:23)
│  at async buildDevStandalone
│  (file:///home/manuel/.npm/_npx/6fe9a9991b157df1/node_modules/storybook/dist/core-server/index.js:7532:17)
│  at async withTelemetry
│  (file:///home/manuel/.npm/_npx/6fe9a9991b157df1/node_modules/storybook/dist/_node-chunks/chunk-KIOKJLL5.js:218:12)
│  at async dev
│  (file:///home/manuel/.npm/_npx/6fe9a9991b157df1/node_modules/storybook/dist/bin/core.js:2734:3)
│  at async _Command.<anonymous>
│  (file:///home/manuel/.npm/_npx/6fe9a9991b157df1/node_modules/storybook/dist/bin/core.js:2803:92)
│
▲  Broken build, fix the error above.
│  You may need to refresh the browser.
│
▲  Could not resolve addon "@storybook/addon-docs", skipping. Is it installed?
│
▲  Could not resolve addon "@storybook/addon-docs", skipping. Is it installed?
│
◆  Would you like to send anonymous crash reports to improve Storybook an (run storybook in a tmux if you want). It used to work I think.
```

**Assistant interpretation:** Restore local Storybook startup reliability by fixing preset resolution and command wiring, then verify with smoke tests.

**Inferred user intent:** Unblock Storybook immediately so implementation progress can be tracked visually while HC-029 work continues.

**Commit (code):** ae7237f — "build: run storybook from inventory workspace"

### What I did

- Inspected Storybook config at `apps/inventory/.storybook/main.ts` and confirmed `framework: '@storybook/react-vite'` plus `@storybook/addon-docs` were correctly configured.
- Verified install state:
  - `npm ls @storybook/react-vite @storybook/addon-docs storybook --all --depth=2`
  - Result before install: empty tree.
- Ran `npm install` at repo root to install workspace dependencies.
- Updated root script in `package.json`:
  - from `npx storybook dev -p 6006 --config-dir apps/inventory/.storybook`
  - to `npm run -w apps/inventory storybook -- --config-dir .storybook`
- Verified startup path with:
  - `npm run storybook -- --smoke-test --ci`
  - `npm run -w apps/inventory storybook -- --smoke-test --ci --config-dir .storybook`

### Why

- `npx` was invoking a transient Storybook runtime path (`~/.npm/_npx/...`) and obscuring local workspace dependency state.
- Using the workspace script ensures the locally installed Storybook toolchain and app config are used consistently.

### What worked

- Storybook preset/addon resolution errors no longer reproduced after install and script update.
- Smoke runs exited successfully with Storybook 10.2.8.

### What didn't work

- Before dependency installation, `npm run -w apps/inventory storybook -- --smoke-test --ci` failed with:
  - `sh: 1: storybook: not found`
- Before this fix, root Storybook command path produced:
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@storybook/react-vite'`
  - `Could not resolve addon "@storybook/addon-docs", skipping. Is it installed?`

### What I learned

- In this workspace, Storybook reliability depends on local workspace installs plus running through the app workspace binary path rather than transient `npx` execution.

### What was tricky to build

- The misleading part was that app `package.json` already declared all required Storybook deps, so the issue looked like version clash at first glance. The true blocker was install state plus command invocation path.

### What warrants a second pair of eyes

- Validate whether root `storybook` should remain inventory-scoped or expand to a multi-app Storybook strategy in a future ticket.

### What should be done in the future

- Continue HC-029 Phase 2 by implementing new windowing primitives and adding dedicated desktop/window stories.

### Code review instructions

- Review script change:
  - `package.json`
- Reproduce verification:
  - `npm run storybook -- --smoke-test --ci`

### Technical details

- Core commands:
  - `npm ls @storybook/react-vite @storybook/addon-docs storybook --all --depth=2`
  - `npm install`
  - `npm run storybook -- --smoke-test --ci`

## Step 9: Implement desktop windowing primitives + Storybook scenarios

With Storybook unblocked, I moved directly into a Storybook-first Phase 2 slice so progress is visible and testable while deeper runtime cutover work is still pending. I implemented desktop shell primitives (menu bar, icon layer, window layer/surface/title/resize) and shipped a dedicated story suite for idle/overlap/dense desktop states.

I kept this step scoped to reusable visual/interaction primitives and Storybook behavior, without touching `HyperCardShell` runtime orchestration yet.

### Prompt Context

**User prompt (verbatim):**
```text
Start working on docmgr HC-029-WINDOWING-SUPPORT and keep a frequent diary. Commit at appropriate intervals, focus on storybook so I can track your progress
```

**Assistant interpretation:** Begin implementation immediately on HC-029, prioritize Storybook-visible progress, and keep frequent ticket diary updates tied to commits.

**Inferred user intent:** Track concrete implementation momentum in short, reviewable checkpoints rather than waiting for a large end-state merge.

**Commit (code):** d41894c — "feat(shell): add desktop windowing primitives and stories"

### What I did

- Added new windowing primitive module:
  - `packages/engine/src/components/shell/windowing/types.ts`
  - `packages/engine/src/components/shell/windowing/DesktopMenuBar.tsx`
  - `packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx`
  - `packages/engine/src/components/shell/windowing/WindowLayer.tsx`
  - `packages/engine/src/components/shell/windowing/WindowSurface.tsx`
  - `packages/engine/src/components/shell/windowing/WindowTitleBar.tsx`
  - `packages/engine/src/components/shell/windowing/WindowResizeHandle.tsx`
  - `packages/engine/src/components/shell/windowing/index.ts`
- Added Storybook primitive scenarios:
  - `packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx`
  - Stories: `Idle`, `TwoWindowOverlap`, `DenseWindowSet`
- Added new part tokens:
  - `packages/engine/src/parts.ts`
- Added windowing base styles:
  - `packages/engine/src/theme/base.css`
- Exported windowing primitives from shell barrel:
  - `packages/engine/src/components/shell/index.ts`
- Updated ticket tasks as complete:
  - `[15]`, `[16]`, `[17]`, `[18]`, `[21]`
- Verification runs:
  - `npm run -w packages/engine typecheck`
  - `npx biome check --write packages/engine/src/components/shell/windowing packages/engine/src/components/shell/index.ts packages/engine/src/theme/base.css packages/engine/src/parts.ts`
  - `npm run storybook -- --smoke-test --ci`

### Why

- Needed visible Storybook progress first so desktop/windowing design can be iterated before wiring full runtime state/session logic.
- Establishing typed component contracts now reduces risk when Phase 3 rewires `HyperCardShell`.

### What worked

- Windowing primitives compile and export cleanly.
- Storybook smoke test passes with the new stories in place.
- Task checklist now reflects concrete Phase 2 progress.

### What didn't work

- Initial Biome checks failed with semantic/a11y issues:
  - `lint/a11y/useSemanticElements` for `role=\"list\"` on `<div>` and `role=\"region\"` on `<div>`
  - `lint/a11y/noNoninteractiveTabindex` for `tabIndex={0}` on the window surface
  - plus import/format ordering errors.
- Resolution:
  - switched icon layer container to semantic `<ul>/<li>`
  - switched window layer container to `<section>`
  - removed non-interactive `tabIndex`
  - ran `biome --write` and re-checked.

### What I learned

- Storybook-first progress works well here: we can validate component boundaries and basic desktop interactions early while keeping runtime/refactor risk isolated for later phases.

### What was tricky to build

- The sharp edge was balancing minimal primitives with enough interaction realism (drag/resize/open/focus) to make Storybook scenarios meaningful, while not prematurely coupling to the final Redux windowing slice.

### What warrants a second pair of eyes

- Review whether current menu/icon/window accessibility semantics are sufficient for Task 20 closure or whether additional keyboard roving/focus management is required.

### What should be done in the future

- Implement Task 19 (pointer interaction controller) as a reusable hook/module instead of story-local logic.
- Start Phase 1 state slice (`features/windowing`) and then connect primitives in Phase 3 shell orchestration.

### Code review instructions

- Start with:
  - `packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx`
  - `packages/engine/src/components/shell/windowing/WindowLayer.tsx`
  - `packages/engine/src/components/shell/windowing/DesktopMenuBar.tsx`
  - `packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx`
- Then inspect styling/parts:
  - `packages/engine/src/theme/base.css`
  - `packages/engine/src/parts.ts`
- Validation:
  - `npm run -w packages/engine typecheck`
  - `npm run storybook -- --smoke-test --ci`

### Technical details

- Checkpoint commands:
  - `docmgr task check --ticket HC-029-WINDOWING-SUPPORT --id 15,16,17,18,21`
  - `git commit -m \"feat(shell): add desktop windowing primitives and stories\"`
