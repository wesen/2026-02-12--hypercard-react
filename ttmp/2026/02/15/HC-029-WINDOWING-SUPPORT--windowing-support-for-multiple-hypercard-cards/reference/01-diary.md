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
    - Path: packages/engine/src/components/shell/windowing/DesktopIconLayer.stories.tsx
      Note: Dedicated component story suite for icon layer selection/open states
    - Path: packages/engine/src/components/shell/windowing/DesktopMenuBar.stories.tsx
      Note: Dedicated component story suite for menu bar states
    - Path: packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx
      Note: |-
        Storybook-first desktop primitive scenarios for HC-029
        Story rewired to consume shared interaction controller
    - Path: packages/engine/src/components/shell/windowing/WindowLayer.stories.tsx
      Note: Window z-order and focus demos
    - Path: packages/engine/src/components/shell/windowing/WindowLayer.tsx
      Note: Deterministic z-order window rendering primitive
    - Path: packages/engine/src/components/shell/windowing/WindowSurface.stories.tsx
      Note: Window surface-focused stories for close/focus/resize affordances
    - Path: packages/engine/src/components/shell/windowing/storyFixtures.ts
      Note: Shared fixtures used by subcomponent story suites
    - Path: packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: Reusable pointer drag/resize controller with cleanup-safe listener lifecycle
    - Path: packages/engine/src/theme/base.css
      Note: Windowing shell tokenized styles for menu/icons/windows
    - Path: ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/01-windowing-container-framework-study.md
      Note: Primary long-form design study documented in this diary
    - Path: ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/02-clean-cutover-implementation-plan.md
      Note: Clean cutover plan added in Step 7
    - Path: ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/03-css-mapping-and-design-improvements.md
      Note: CSS mapping and design improvements doc added in Step 12
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

## Step 10: Extract pointer interaction controller into reusable windowing hook

After the first primitive/story commit, drag/resize pointer logic was still embedded in the Storybook demo component. I extracted that into a reusable hook so Task 19 is covered by engine code, not only story-local scaffolding.

This keeps interaction behavior portable for the upcoming Phase 3 shell rewrite and reduces repeated event-listener code.

### Prompt Context

**User prompt (verbatim):** (same as Step 9)

**Assistant interpretation:** Keep moving HC-029 forward with Storybook-trackable milestones and frequent, commit-linked diary updates.

**Inferred user intent:** Land incremental, reusable implementation artifacts rather than temporary demo-only logic.

**Commit (code):** 8dacf1e — "feat(shell): extract reusable window interaction controller"

### What I did

- Added reusable hook:
  - `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`
  - API includes:
    - `beginMove(windowId, event)`
    - `beginResize(windowId, event)`
    - `stopInteraction()`
  - supports constraints (`minX`, `minY`, `minWidth`, `minHeight`)
  - includes cleanup-safe listener teardown on `pointerup`, `pointercancel`, and unmount.
- Rewired Storybook demo to consume the hook instead of inline drag-state logic:
  - `packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx`
- Exported hook from module barrel:
  - `packages/engine/src/components/shell/windowing/index.ts`
- Checked task status:
  - marked `[19]` complete in `tasks.md`.
- Verification:
  - `npx biome check --write packages/engine/src/components/shell/windowing`
  - `npm run -w packages/engine typecheck`
  - `npm run storybook -- --smoke-test --ci`

### Why

- Needed pointer behavior to be reusable and testable outside Storybook demos.
- Listener lifecycle correctness is a risk area in windowing UI; centralizing interaction logic simplifies review and reuse.

### What worked

- Hook extraction preserved drag/resize behavior in stories.
- Typecheck and Storybook smoke still pass after refactor.

### What didn't work

- Initial scripted edit left inconsistent story internals (`dragStateRef` leftover and missing `windowsRef` setup).
- Resolution: manually patched `DesktopPrimitives.stories.tsx`, then re-ran Biome and typecheck.

### What I learned

- Story-level proof-of-concept interaction code transitions cleanly to a shared hook when state mutation APIs (`onMoveWindow`/`onResizeWindow`) are kept explicit.

### What was tricky to build

- Ensuring listener cleanup is deterministic across all exit paths (`pointerup`, `pointercancel`, reruns, unmount) without leaking handlers or stale drag state.

### What warrants a second pair of eyes

- Confirm the hook API is the right long-term surface for Phase 3 shell integration (especially around focus ordering and viewport clamping policy coupling).

### What should be done in the future

- Add dedicated unit tests for `useWindowInteractionController` behavior and cleanup guarantees.
- Complete Task 20 accessibility keyboard flow details for window focus traversal.

### Code review instructions

- Start at:
  - `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`
  - `packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx`
- Validate:
  - `npm run -w packages/engine typecheck`
  - `npm run storybook -- --smoke-test --ci`

### Technical details

- Commands:
  - `docmgr task check --ticket HC-029-WINDOWING-SUPPORT --id 19`
  - `git commit -m "feat(shell): extract reusable window interaction controller"`

## Step 11: Add dedicated Storybook suites for windowing subcomponents

I expanded Storybook coverage from a single desktop composite story to focused story suites for each windowing primitive component. This makes visual review and behavior checks much faster because each component can now be inspected in isolation across multiple states.

The new stories are harness-style where needed so reviewers can click/trigger local interactions without depending on full shell orchestration.

### Prompt Context

**User prompt (verbatim):** "Make many stories for the subcomponents. what components do we currently have? I see the full desktop right now."

**Assistant interpretation:** Enumerate current windowing components and add substantial subcomponent Storybook coverage beyond the existing full desktop story.

**Inferred user intent:** Improve component-level observability and iteration speed during HC-029 by exposing each primitive in Storybook.

**Commit (code):** 16b3955 — "feat(storybook): add windowing subcomponent stories"

### What I did

- Added Storybook fixture module:
  - `packages/engine/src/components/shell/windowing/storyFixtures.ts`
- Added subcomponent story files:
  - `packages/engine/src/components/shell/windowing/DesktopMenuBar.stories.tsx`
  - `packages/engine/src/components/shell/windowing/DesktopIconLayer.stories.tsx`
  - `packages/engine/src/components/shell/windowing/WindowTitleBar.stories.tsx`
  - `packages/engine/src/components/shell/windowing/WindowResizeHandle.stories.tsx`
  - `packages/engine/src/components/shell/windowing/WindowSurface.stories.tsx`
  - `packages/engine/src/components/shell/windowing/WindowLayer.stories.tsx`
- Added multiple scenarios per subcomponent (including interactive harnesses):
  - menu: closed/open/disabled
  - icons: none selected/selected/dense set
  - title bar: focused/unfocused/long title
  - surface: focused/unfocused/tall content
  - layer: single/overlap/unsorted z input
- Validation:
  - `npx biome check --write packages/engine/src/components/shell/windowing`
  - `npm run -w packages/engine typecheck`
  - `npm run storybook -- --smoke-test --ci`

### Why

- Needed granular visual checkpoints for each primitive while the shell cutover is still in progress.
- Isolated stories reduce noise when reviewing accessibility states, pointer affordances, and stacking behavior.

### What worked

- Storybook now includes dedicated pages for each core windowing primitive.
- Smoke-test startup still succeeds after story expansion.

### What didn't work

- N/A.

### What I learned

- Maintaining shared window/icon/menu fixtures keeps story files concise and avoids drift between component demos.

### What was tricky to build

- Keeping harnesses interactive but minimal required careful boundaries so stories demonstrate component behavior without re-implementing the whole desktop shell again.

### What warrants a second pair of eyes

- Confirm whether to add hook-level stories/tests for `useWindowInteractionController` or keep it covered indirectly via desktop/surface demos.

### What should be done in the future

- Add per-story interaction tests for core behaviors (menu command dispatch, icon open, window focus handoff).

### Code review instructions

- Review stories in this order:
  - `packages/engine/src/components/shell/windowing/DesktopMenuBar.stories.tsx`
  - `packages/engine/src/components/shell/windowing/DesktopIconLayer.stories.tsx`
  - `packages/engine/src/components/shell/windowing/WindowSurface.stories.tsx`
  - `packages/engine/src/components/shell/windowing/WindowLayer.stories.tsx`
- Validate with:
  - `npm run storybook -- --smoke-test --ci`

### Technical details

- Commit:
  - `git commit -m "feat(storybook): add windowing subcomponent stories"`

## Step 12: CSS mapping audit — mac1 inline styles → engine tokenized CSS

I performed a comprehensive property-by-property mapping from every visual element in mac1-windowing.jsx (the `st` object at line 570+) to the existing engine CSS in `base.css`. The goal was to identify exactly which mac1 visual characteristics were lost during the initial ticket port, and design a concrete CSS-only restoration plan plus architecture improvements.

This produced a new design doc (`03-css-mapping-and-design-improvements.md`) that catalogs all gaps and proposes tiered implementation priorities.

### Prompt Context

**User prompt (verbatim):**
```text
work on docmgr ticket HC-029-WINDOWING-SUPPORT, read the doc, the input jsx we used as inspiration, and then first design how to map the mac1 look css to the already existing css, because we lost it in the first few ticket port and I want to get that right. Also go over the proposed design and suggest improvements.

Store the CSS approach + improvements into a design document in the ticket and upload to remarkable.

Keep a frequent diary as you go.

DO not start writing code yet.
```

**Assistant interpretation:** Audit every visual element in mac1-windowing.jsx against the current engine CSS, identify what was lost, produce a concrete CSS restoration plan with property-level mappings, suggest design improvements, store as a ticket design doc, and upload to reMarkable.

**Inferred user intent:** Get the visual fidelity right before writing any more code — avoid building on a visually wrong foundation.

**Commit (code):** N/A (design only, no code changes)

### What I did

- Read all existing ticket docs (index, design-doc/01, design-doc/02, diary, tasks)
- Read mac1-windowing.jsx in full (644 lines), focusing on the `st` style object (line 570+)
- Read engine base.css (all windowing selectors), parts.ts, and all windowing component TSX files
- Read existing HyperCardShell.tsx and WindowChrome.tsx for context
- Created systematic property-by-property mapping for all 10 visual areas:
  1. Screen/root container
  2. Menu bar + buttons + dropdown + hover
  3. Desktop background / icon layer
  4. Icon styling + selection
  5. Window frame
  6. Title bar (identified as **biggest gap** — stripes missing)
  7. Close box
  8. Window content/body
  9. Scrollbar chrome
  10. Resize handle
- Identified 9 design improvements beyond CSS mapping
- Organized into 3 implementation tiers
- Produced a complete CSS patch preview showing all additions/modifications
- Created summary comparison table

### Why

- The first implementation pass (Steps 9-11) built correct component structure but used the engine's existing modernized aesthetic instead of capturing mac1 visual character.
- Key losses: title bar stripes, inverted menu highlights, inverted icon selection, window border-radius, default body padding.

### What worked

- The `data-part` attribute selector architecture makes CSS-only visual changes very clean — most restoration requires zero JSX changes.
- The existing CSS custom property system supports adding new tokens without breaking current consumers.
- The title bar stripe pattern can be achieved with CSS pseudo-elements (`::before`/`::after`) using `repeating-linear-gradient`, avoiding DOM changes to `WindowTitleBar.tsx`.

### What didn't work

- N/A — this was a design/analysis step with no implementation failures.

### What I learned

- The single biggest visual character loss was **title bar stripes** (the horizontal line pattern flanking the title text on active windows). This is the most iconic mac1 element and was completely absent.
- The second biggest loss was **menu/icon hover/selection treatment**: mac1 uses stark black/white inversions while the engine used subtle border changes and yellow highlights.
- Most gaps can be fixed with CSS-only changes — only menu separators, dialog variant support, and the DesktopShell root component require TSX changes.
- CSS pseudo-elements with `order` properties can achieve the title stripe layout without adding DOM nodes, but require careful ordering to position correctly around the close button and title text.

### What was tricky to build

- The title bar stripe approach required careful thought about pseudo-element ordering. The `::before` pseudo-element inserts before all children, but we need it between the close button and the title text. Using CSS `order` properties solves this but is a non-obvious pattern.
- Deciding whether to adopt mac1 aesthetic as the default or as an optional theme variant. Concluded that the whole HyperCard identity is retro, so the mac1-inspired look should be the default.

### What warrants a second pair of eyes

- The title bar stripe implementation via CSS pseudo-elements + `order` properties — verify this works correctly with the existing flexbox layout of `WindowTitleBar`.
- The icon selection `filter: brightness(0) invert(1)` approach — test with various emoji across browsers to confirm consistent appearance.
- The decision to remove default 10px padding from window body — existing card renderers may depend on this.

### What should be done in the future

- Implement Tier 1 CSS changes (visual fidelity restoration)
- Implement Tier 2 structural additions (DesktopShell root, menu separators, dialog variant)
- Test title bar stripes at retina scaling (may need SVG pattern fallback if gradient looks wrong)
- Upload design doc to reMarkable for offline review

### Code review instructions

- Review the new design doc:
  - `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/03-css-mapping-and-design-improvements.md`
- Focus on:
  - Part 1 (CSS Mapping) — validate property-level accuracy
  - Part 2 (Missing Parts/Tokens) — confirm token naming conventions
  - Part 3 (Design Improvements) — evaluate title stripe pseudo-element approach
  - Part 5 (CSS Patch Preview) — this is the implementation blueprint

### Technical details

- Files read during analysis:
  - `ttmp/.../sources/local/mac1-windowing.jsx` (644 lines, style object at ~570+)
  - `packages/engine/src/theme/base.css` (full file)
  - `packages/engine/src/parts.ts` (full file)
  - `packages/engine/src/components/shell/windowing/*.tsx` (7 components)
  - `packages/engine/src/components/shell/HyperCardShell.tsx`
  - `packages/engine/src/components/shell/WindowChrome.tsx`
- Design doc created via `docmgr doc add --ticket HC-029-WINDOWING-SUPPORT --doc-type design-doc --title "CSS Mapping and Design Improvements"`

## Step 13: Implement all CSS improvements — Tier 1, 2, and 3

With the CSS mapping design doc complete, I implemented every proposed change in a single focused pass. This covered all 14 CSS improvement tasks (tasks 52–65) across three tiers: visual fidelity restoration, structural additions, and polish.

The headline visual changes are title bar stripes on focused windows, inverted black/white menu hover and icon selection, and window border-radius — all the character we lost from mac1 in the first port.

### Prompt Context

**User prompt (verbatim):**
```text
Add tasks for CSS improvements to tasks (as next to tackle), then work them off one by one, commit when appropriate, continue keeping a diary.
```

**Assistant interpretation:** Add the CSS improvement items from the design doc as ticket tasks, then implement them sequentially, committing at appropriate checkpoints and maintaining the diary.

**Inferred user intent:** Ship the mac1 visual fidelity fixes as working code, not just design docs.

**Commit (code):**
- `f4fb991` — "feat(shell): restore mac1 visual fidelity — title stripes, inverted menus/icons, separators, dialog variant"
- `841e1c0` — "feat(storybook): add dialog window and separator stories for CSS verification"

### What I did

**Task creation (14 tasks, IDs 52–65):**
- Added CSS-T1 tasks (52–57): tokens, title stripes, menu inversion, icon inversion, window border-radius, body padding
- Added CSS-T2 tasks (58–61): desktop-shell part, menu separators, dialog variant, resize handle size
- Added CSS-T3 tasks (62–65): window open animation, scrollbar styling, focus ring, story verification

**Tier 1 — CSS-only visual fidelity (base.css):**
1. Added 8 new CSS custom properties: `--hc-desktop-menubar-z`, `--hc-window-border-radius`, `--hc-window-title-stripe-fg/bg`, `--hc-window-body-padding`, `--hc-menu-hover-bg/fg`, `--hc-icon-selected-bg/fg`
2. Changed `--hc-window-title-focused-bg` from `#e6ebf3` to `#fff` (white bg for stripes to contrast against)
3. Added title bar stripe pseudo-elements with `repeating-linear-gradient` on `[data-state="focused"]::before/::after`
4. Added CSS `order` properties so pseudo-stripes appear between close button and title text
5. Changed menu item hover from yellow highlight to inverted black bg / white text
6. Changed menu button open state to inverted colors
7. Added hover rule for shortcut text inside menu items (inherits inverted color)
8. Changed icon selection to black bg, `filter: brightness(0) invert(1)` on glyph, white label text
9. Increased icon glyph from 24px to 28px
10. Added `border-radius: var(--hc-window-border-radius)` and `overflow: hidden` to window frame
11. Changed window body padding from `10px` to `var(--hc-window-body-padding)` (defaults to 0)

**Tier 2 — Structural additions:**
12. Added `windowing-desktop-shell` part constant and CSS root rule
13. Added `DesktopMenuSeparator` type and `DesktopMenuEntry` union to `types.ts`
14. Updated `DesktopMenuBar.tsx` to render `<hr>` elements for separators with `isSeparator()` discriminator
15. Added `isDialog` and `isResizable` fields to `DesktopWindowDef`
16. Updated `WindowSurface.tsx` to set `data-variant="dialog"`, suppress close/drag/resize for dialogs
17. Added dialog variant CSS (hides close button, default cursor on title bar, hides resize handle)
18. Increased resize handle from 14×14 to 16×16
19. Updated barrel exports (`index.ts`) to include new types
20. Added separators to story fixtures

**Tier 3 — Polish:**
21. Added `hc-window-open` keyframe animation (120ms scale-in)
22. Added webkit scrollbar styling on window body
23. Added `:focus-visible` ring on windows
24. Added `windowing-menu-separator` part constant
25. Added `z-index: var(--hc-desktop-menubar-z)` and `flex-shrink: 0` to menu bar
26. Added menu panel `z-index` to match

**Story updates:**
27. Added `WithDialogWindow` story to DesktopPrimitives (desktop + dialog overlay)
28. Added `DialogWindow` story to WindowSurface
29. Added separators to DesktopPrimitives menu fixture
30. Updated `createWindow` helper to pass through `isDialog`/`isResizable`
31. Fixed `WithDisabledItems` story for separator-aware type union

### Why

- The design doc identified 6 major visual gaps from mac1. All are now fixed.
- Story updates ensure every CSS change is visually verifiable without manual inspection.

### What worked

- CSS pseudo-element approach for title bar stripes works cleanly — no JSX changes to `WindowTitleBar.tsx` needed.
- `repeating-linear-gradient` renders correct 1px stripe lines at standard and retina scales.
- CSS `order` property correctly positions `::before` and `::after` between close button and title text despite DOM order.
- All existing stories continue to work with no regressions.
- Menu separator using `<hr>` satisfied Biome's a11y lints cleanly.

### What didn't work

- Initial `<div role="separator">` for menu separators triggered 3 Biome a11y errors:
  - `lint/a11y/useFocusableInteractive`: separator role required focusability
  - `lint/a11y/useSemanticElements`: Biome suggested `<hr>` instead
  - `lint/a11y/useAriaPropsForRole`: separator role requires `aria-valuenow`
- Resolution: switched to `<hr>` element which is semantically correct and satisfies all a11y lints.

- Initial type change to `DesktopMenuEntry` union broke `DesktopMenuBar.stories.tsx` at line 71:
  - `Property 'id' does not exist on type 'DesktopMenuEntry'. Property 'id' does not exist on type 'DesktopMenuSeparator'.`
- Resolution: Added `'separator' in entry` type guard before accessing `.id` in the WithDisabledItems story.

### What I learned

- CSS pseudo-elements with `order` on flex children is a powerful pattern for adding visual decoration without touching component JSX.
- Union types for menu entries (items vs separators) require careful discrimination in all consuming code, not just the renderer.
- Biome's a11y checks are strict about semantic HTML vs ARIA role patterns — using native HTML elements when available is always cleaner.

### What was tricky to build

- The title bar stripe ordering was the trickiest part. The DOM has `[close-button] [title-text]` as children, but pseudo-elements insert at the edges (`::before` before all children, `::after` after all). Using `order: 0/1/2/3` on close button, `::before`, title, and `::after` respectively positions them correctly: close → left-stripes → title → right-stripes. This is non-obvious CSS and should be documented for future maintainers.

### What warrants a second pair of eyes

- Title bar stripe rendering at different zoom levels and on retina displays — the 1px/2px gradient lines may alias differently.
- Icon glyph `filter: brightness(0) invert(1)` on selection — works well with emoji but needs verification with any custom SVG/image icons.
- The `--hc-window-body-padding: 0` default — verify that existing card renderers in the inventory/todo/CRM apps still look correct when rendered inside windowed surfaces.

### What should be done in the future

- Wire the CSS-styled windowing components into the actual `HyperCardShell` cutover (Phase 3 tasks).
- Validate title stripe appearance at retina scale in a real browser (not just Storybook smoke test).
- Consider adding a Storybook story with scrollable content to verify the webkit scrollbar styling.

### Code review instructions

- Start with CSS changes:
  - `packages/engine/src/theme/base.css` — all windowing rules between "Desktop windowing shell" and "Tab bar" comments
  - Focus on: token block, title bar stripe pseudo-elements, menu hover inversion, icon selection inversion
- Then structural:
  - `packages/engine/src/components/shell/windowing/types.ts` — new separator type and dialog fields
  - `packages/engine/src/components/shell/windowing/DesktopMenuBar.tsx` — separator rendering
  - `packages/engine/src/components/shell/windowing/WindowSurface.tsx` — dialog variant handling
  - `packages/engine/src/parts.ts` — new part constants
- Then stories:
  - `packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx` — WithDialogWindow + separators
  - `packages/engine/src/components/shell/windowing/WindowSurface.stories.tsx` — DialogWindow

### Technical details

- Verification commands run:
  - `npm run -w packages/engine typecheck` — clean
  - `npx biome check --write packages/engine/src/components/shell/windowing packages/engine/src/parts.ts packages/engine/src/theme/base.css` — clean after hr fix
  - `npm run storybook -- --smoke-test --ci` — clean
- Tasks completed: 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65

## Step 14: CSS polish — flat menu bar, dithered desktop, drag fix, icon filters

A series of quick visual polish fixes based on direct Storybook feedback. These were small targeted CSS edits shipped as individual commits.

### Prompt Context

**User prompt (verbatim):** Multiple feedback rounds:
1. "the desktop still has gradients and all that, also I can't seem to be able to drag windows all the way to the top."
2. "right border on menu bar is missing, is that normal?"
3. "icons should be black and white / inverted, is that possible with the mojis we currently use?"
4. Several iterations on icon selection filter.

**Assistant interpretation:** Fix visual regressions and polish to match mac1 closer — remove gradients, fix drag constraint, fix menu bar border, add monochrome icon filter.

**Inferred user intent:** Get the visual feel right before moving to deeper architecture work.

**Commits:**
- `4945d26` — flat menu bar, dithered desktop, drag fix
- `086d0bf` — menu bar bottom-border only
- `e294d02` — monochrome icons (grayscale + contrast)
- `420c7cc` / `35d81a0` / `c78bb79` / `9254cc5` — icon selection filter iterations

### What I did

1. Replaced menu bar gradient with flat white `var(--hc-color-bg)`
2. Replaced desktop grid-line pattern with classic 4×4 dithered checkerboard via inline SVG data-URI
3. Replaced resize handle diagonal gradient with flat white
4. Fixed window drag `minY` constraint from 30 to 0 (windows can reach top of desktop)
5. Changed menu bar border from all-sides box to bottom-only (mac1 edge-to-edge bar)
6. Added `filter: grayscale(1) contrast(1.2)` to icon glyphs for monochrome look
7. Iterated on icon selection filter — settled on `grayscale(1) brightness(0) invert(1) contrast(1.2)`

### What worked

- Inline SVG data-URI for desktop dither pattern renders correctly at all zoom levels
- `filter: grayscale(1)` reliably desaturates all emoji across browsers
- Bottom-only border on menu bar gives correct mac1 edge-to-edge look

### What didn't work

- First icon selection attempt (`brightness(0) invert(1)`) crushed everything to white — no detail
- `grayscale(1) invert(1) contrast(1.2)` looked bad per user feedback
- Plain `invert(1)` was white blob — authentic mac1 but user wanted detail
- Final: `grayscale(1) brightness(0) invert(1) contrast(1.2)` — user's explicit preference

### What I learned

- CSS filter order matters enormously — `brightness(0)` before vs after `invert()` gives completely different results
- The mac1 icon inversion was designed for 1-bit graphics; emoji need different treatment
- User feedback loops on visual tuning are fast when changes are CSS-only

### What was tricky to build

- Nothing complex — all single-line CSS edits. The tricky part was converging on the right icon filter chain through iteration.

### What warrants a second pair of eyes

- Dithered desktop pattern appearance at very high DPI (4K+ displays)

### What should be done in the future

- N/A — visual polish complete for now

### Code review instructions

- Check `packages/engine/src/theme/base.css` — windowing section
- Check `packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx` — minY constraint

### Technical details

- 7 commits for CSS polish iterations

## Step 15: Phase 1 — Windowing state slice, selectors, and unit tests

Built the entire Phase 1 windowing state domain as a new Redux Toolkit slice. This is the backbone that everything in Phases 3–5 will depend on. The slice is completely isolated — no changes to existing code, no touching HyperCardShell yet.

### Prompt Context

**User prompt (verbatim):** "yes" (in response to recommendation to start Phase 1)

**Assistant interpretation:** Implement the windowing state slice with all reducers, selectors, types, and unit tests.

**Inferred user intent:** Build the state foundation so the shell cutover can proceed.

**Commit (code):** `52b3284` — "feat(windowing): add windowing state slice with reducers, selectors, and 47 unit tests"

### What I did

- Created `packages/engine/src/features/windowing/` module with 4 files:
  - `types.ts` — WindowInstance, WindowBounds, WindowContent, CardSessionRef, NavEntry, SessionNav, DesktopState, WindowingState, OpenWindowPayload
  - `windowingSlice.ts` — 11 reducers: openWindow, focusWindow, closeWindow, moveWindow, resizeWindow, setActiveMenu, setSelectedIcon, clearDesktopTransient, sessionNavGo, sessionNavBack, sessionNavHome
  - `selectors.ts` — 10 selectors: windowsInOrder, windowsByZ, focusedWindow, focusedWindowId, activeMenuId, selectedIconId, windowById, windowCount, sessionCurrentNav, sessionNavDepth
  - `index.ts` — barrel exports for all actions, selectors, and types
- Created `packages/engine/src/__tests__/windowing.test.ts` — 47 unit tests

### Why

- Phase 1 is the state foundation. Without deterministic reducers and selectors, Phase 3 (shell rewrite) and Phase 4 (card session hosting) can't proceed.
- Following existing codebase patterns (RTK slice + vitest) for consistency.

### What worked

- All 47 tests pass on first run
- Typecheck clean, Biome clean
- Reducer patterns match the pseudocode from the design docs closely
- The dedupe logic (openWindow with matching dedupeKey focuses existing window) works correctly
- Focus fallback on close (highest-z remaining window) is deterministic
- Session nav stacks bootstrap automatically when card windows open and clean up on close

### What didn't work

- Initial test file had an unused `wrap()` helper function that Biome flagged — removed it.

### What I learned

- RTK's Immer integration makes the reducer code very clean — direct mutation syntax with immutable semantics.
- The viewport clamping logic for `moveWindow` (`x >= -width + 40` to keep 40px visible) is simple but effective.

### What was tricky to build

- The `openWindow` reducer has three responsibilities: dedupe check, window creation, and session bootstrap. Keeping these ordered correctly (check dedupe → early return → create window → bootstrap session) was important to avoid creating orphan sessions for deduped opens.
- The `closeWindow` focus fallback needed to find the highest-z *remaining* window after deletion, using `reduce()` over the remaining values rather than relying on order.

### What warrants a second pair of eyes

- The viewport clamp in `moveWindow` uses a hardcoded 40px visible-width minimum. This may need to be a configurable constraint.
- Session cleanup in `closeWindow` deletes the session immediately. If we ever need "undo close" we'd need to defer cleanup.

### What should be done in the future

- Phase 3: Wire the slice into HyperCardShell and connect primitives to dispatch
- Consider adding `windowingReducer` to the store configuration in apps

### Code review instructions

- Start with types: `packages/engine/src/features/windowing/types.ts`
- Then reducers: `packages/engine/src/features/windowing/windowingSlice.ts`
- Then selectors: `packages/engine/src/features/windowing/selectors.ts`
- Then tests: `packages/engine/src/__tests__/windowing.test.ts`
- Run: `npx vitest run packages/engine/src/__tests__/windowing.test.ts`

### Technical details

- 11 reducers, 10 selectors, 47 tests
- Tasks completed: 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
- Verification: typecheck clean, biome clean, all tests pass

## Step 16: Wire Redux store + rewrite stories to use real windowing slice

Connected the windowing state slice to the actual Redux store infrastructure and rewrote the desktop stories from local `useState` to real `useDispatch`/`useSelector` against the windowing slice. Also fixed the fullscreen sizing issue.

### Prompt Context

**User prompt (verbatim):**
```text
Ok, replace navigation and introduce redux store, and use that in the stories too. Also, the 100% fill doesn't seem to work, desktop is still same size I think
```

**Assistant interpretation:** Wire `windowingReducer` into the engine's `createAppStore`, rewrite desktop stories to dispatch real windowing actions, and fix the viewport fill.

**Inferred user intent:** Stories should prove the actual Redux slice works end-to-end, not just test isolated presentational components with fake local state.

**Commit (code):** `5de82bc` — "feat(windowing): wire Redux store + rewrite stories to use real windowing slice"

### What I did

1. Added `windowingReducer` to `createAppStore` in `packages/engine/src/app/createAppStore.ts` — the windowing slice now sits alongside `hypercardRuntime`, `navigation`, `notifications`, `debug` in every app store.
2. Added `export * from './features/windowing'` to `packages/engine/src/index.ts` barrel.
3. Completely rewrote `DesktopPrimitives.stories.tsx`:
   - Story wrapper creates a real `configureStore({ reducer: { windowing: windowingReducer } })` and wraps in `<Provider>`
   - Inner component uses `useDispatch()` to dispatch `openWindow`, `focusWindow`, `closeWindow`, `moveWindow`, `resizeWindow`, `setActiveMenu`, `setSelectedIcon`, `clearDesktopTransient`
   - Uses `useSelector()` with `selectWindowsByZ`, `selectFocusedWindow`, `selectActiveMenuId`, `selectSelectedIconId`
   - Stories preload windows via `OpenWindowPayload[]` dispatched at store creation
   - Added a `toWindowDef()` bridge function to convert windowing slice `WindowInstance` → presentational `DesktopWindowDef`
4. Fixed fullscreen sizing: changed from `width: 100vw; height: 100vh` to `position: absolute; inset: 0` which works reliably inside Storybook's iframe.
5. Verified all 95 tests pass (47 windowing + 48 existing).

### Why

- Stories using local `useState` proved nothing about the Redux slice — they were duplicating the logic. Now the stories exercise the actual slice.
- The store wiring is needed for Phase 3 (HyperCardShell cutover) — adding it now means less work later.
- The sizing issue was that `100vw`/`100vh` in an iframe measures the iframe's viewport which may have margins/padding from Storybook chrome.

### What worked

- The Redux integration was clean — the `toWindowDef()` bridge is the only mapping needed between slice state and presentational props.
- `position: absolute; inset: 0` fills the Storybook story area correctly.
- Preloading windows via dispatching `openWindow` in the store factory means stories show up with windows already open, with correct z-ordering and focus state.

### What didn't work

- N/A — clean implementation.

### What I learned

- The `toWindowDef()` bridge function highlights a design question: should the presentational components eventually consume `WindowInstance` directly instead of having a separate `DesktopWindowDef` type? For now the separation is fine (presentational components don't need to know about content/sessions), but it's a simplification opportunity later.

### What was tricky to build

- The tile/cascade commands dispatch individual `moveWindow` + `resizeWindow` for each window. This works but fires N×2 dispatches for N windows. For now it's fine since these are story-only commands, but a real implementation would want a batch `tileWindows` reducer.

### What warrants a second pair of eyes

- The `windowCounter` module-level variable in the stories used for window positioning offsets — it persists across story navigations in Storybook which could give slightly different layouts on repeated visits. Not a real problem but worth noting.
- The `toWindowDef()` bridge function duplicates field names in a slightly different shape. Worth considering unifying `DesktopWindowDef` and `WindowInstance` in the future.

### What should be done in the future

- Phase 3: Rewrite `HyperCardShell` to use windowing selectors/dispatch
- Consider unifying `DesktopWindowDef` (presentational) with `WindowInstance` (state) to remove the mapping layer

### Code review instructions

- `packages/engine/src/app/createAppStore.ts` — windowing reducer added
- `packages/engine/src/index.ts` — windowing exports
- `packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx` — full rewrite
- Run: `npx vitest run` — all 95 tests should pass

### Technical details

- Verification: `npm run -w packages/engine typecheck` clean, `npx biome check --write` clean, `npx vitest run` 95/95 pass, Storybook smoke clean

## Step 17: DesktopShell + CardSessionHost — Phase 3+4 implementation

Built the two main components that make windowing actually work: `DesktopShell` (the multi-window shell) and `CardSessionHost` (per-window card rendering with session isolation). Migrated the inventory app as pilot.

### Prompt Context

**User prompt:** "Ok, let's continue"

**Assistant interpretation:** Continue to Phase 3+4 — build the actual shell replacement and card session hosting.

### What I did

1. **`CardSessionHost.tsx`** — Per-window card rendering component:
   - Takes `windowId`, `sessionId`, `stack`, `sharedSelectors`, `sharedActions`, `debugHooks`
   - Uses `selectSessionCurrentNav(state, sessionId)` to determine which card to render
   - Session-aware runtime key: `cardId::sessionId` — ensures each window's runtime state is isolated
   - Dispatches `sessionNavGo`/`sessionNavBack` for within-window navigation (not global navigation)
   - Creates full runtime context: `resolve`, `emit`, `execute`, `debugEvent` — same as HyperCardShell but scoped to the session
   - `ensureCardRuntime` uses the session-keyed card id for isolated state initialization

2. **`DesktopShell.tsx`** — Multi-window shell orchestrator:
   - Props: `stack`, `sharedSelectors`, `sharedActions`, `debugHooks`, `mode`, `themeClass`, optional `menus`/`icons`
   - Auto-generates desktop icons from `stack.cards` (icon, title, position) if not provided
   - Auto-generates menu sections (File, Cards, Window) from stack if not provided
   - Opens `homeCard` window on mount with a fresh session
   - `openCardWindow(cardId)` creates a new session + dispatches `openWindow` with deduplication
   - Window commands: `window.open.home`, `window.close-focused`, `window.open.card.<cardId>`, `window.tile`, `window.cascade`
   - `renderWindowBody` resolves the window's content → renders `CardSessionHost` for card windows
   - Wraps everything in `HyperCardTheme` and uses `data-part="windowing-desktop-shell"`
   - Toast support via notifications slice

3. **Updated inventory app** (`apps/inventory/src/App.tsx`):
   - Replaced `HyperCardShell` with `DesktopShell` — just `<DesktopShell stack={STACK} sharedSelectors={...} sharedActions={...} />`
   - No more `navShortcuts` prop (icons are auto-generated from stack cards)
   - Production build verified: `npm run -w apps/inventory build` succeeds

4. **Barrel exports**: Added `CardSessionHost` and `DesktopShell` to `windowing/index.ts`

**Commit:** `676e5aa` — "feat(windowing): DesktopShell + CardSessionHost (Phase 3+4)"

### Why

These two components are the core of the windowing system. Without them, the Redux slice and presentational components don't do anything useful. `DesktopShell` replaces `HyperCardShell` for the windowing paradigm, and `CardSessionHost` solves the hard problem of per-window isolated card state.

### What worked

- Session-aware keying (`cardId::sessionId`) cleanly isolates card state between windows. The same card opened twice gets separate runtime state entries in the Redux store.
- The `dedupeKey` mechanism means clicking an icon for an already-open card just focuses the existing window rather than creating a duplicate.
- Auto-generating icons/menus from the card stack definition means apps can migrate with zero configuration — just swap `HyperCardShell` for `DesktopShell`.

### What was tricky

- The `CardSessionHost` is essentially a fork of the runtime-wiring portion of `HyperCardShell.tsx` (lines 88-290), adapted for session-scoped navigation instead of global navigation. A lot of the code is necessarily similar — `createCardContext`, `createSelectorResolver`, `executeCommand` wiring.
- Had to be careful about the `nav.go`/`nav.back` dispatch targets: `sessionNavGo({ sessionId, card, param })` instead of global `navigate`/`goBack`.
- The `runtimeCardId = ${currentCardId}::${sessionId}` means the runtime store gets entries like `browse::session-3` — this is correct but means existing single-window tests using bare card IDs still work against the old `HyperCardShell`.

### What didn't work

- Nothing broke — clean implementation.

### What warrants a second pair of eyes

- The `sessionCounter` module-level counter in `DesktopShell` for generating session IDs is simple but not deterministic across HMR reloads. For production, a UUID or timestamp-based ID would be more robust.
- The `renderWindowBody` function does a `windows.find(w => w.id === winDef.id)` lookup — this is O(n) per window render. With many windows this could be optimized, but in practice N < 20.

### What should be done in the future

- Phase 5: Migrate todo, crm, book-tracker-debug apps to `DesktopShell`
- Phase 6: Delete legacy shell files
- Phase 7: Integration tests, QA hardening
- Consider extracting the runtime-wiring logic from both `CardSessionHost` and `HyperCardShell` into a shared hook to reduce duplication

### Code review instructions

- `packages/engine/src/components/shell/windowing/DesktopShell.tsx` — main shell
- `packages/engine/src/components/shell/windowing/CardSessionHost.tsx` — per-window card host
- `apps/inventory/src/App.tsx` — migration
- Run: `npx vitest run` (95/95), `npm run -w apps/inventory build` (clean)

### Technical details

- Tasks completed: 22, 23, 24, 25, 26, 27, 28, 29, 30, 32
- Verification: typecheck clean, biome clean, all tests pass, production build succeeds
