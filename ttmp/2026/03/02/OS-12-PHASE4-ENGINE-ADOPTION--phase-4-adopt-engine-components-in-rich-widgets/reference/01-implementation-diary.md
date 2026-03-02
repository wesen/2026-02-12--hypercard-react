---
Title: Implementation diary
Ticket: OS-12-PHASE4-ENGINE-ADOPTION
Status: active
Topics:
    - frontend
    - widgets
    - refactoring
    - engine
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/game-finder/GameFinder.tsx:Migrated to engine RadioButton
    - packages/rich-widgets/src/deep-research/DeepResearch.tsx:Migrated to engine RadioButton
    - packages/rich-widgets/src/stream-launcher/StreamLauncher.tsx:Migrated to engine RadioButton
    - packages/rich-widgets/src/chart-view/ChartView.tsx:Fixed checked→selected bug
    - packages/rich-widgets/src/parts.ts:Removed orphaned radio data-part constants
    - packages/rich-widgets/src/theme/game-finder.css:Removed orphaned gf-radio CSS
    - packages/rich-widgets/src/theme/deep-research.css:Removed orphaned dr-radio CSS
    - packages/rich-widgets/src/theme/stream-launcher.css:Removed orphaned sl-radio CSS
ExternalSources: []
Summary: "Implementation diary for Phase 4: adopting engine components in rich widgets"
LastUpdated: 2026-03-02T21:00:00-05:00
WhatFor: "Track what changed, what worked, and what was tricky during Phase 4"
WhenToUse: "When reviewing Phase 4 changes or debugging engine component integration"
---

# Implementation Diary — OS-12-PHASE4-ENGINE-ADOPTION

## Step 1: Replace hand-rolled radio buttons with engine RadioButton

### What changed

Three widgets had hand-rolled radio button implementations using `data-part` styled `<span>` elements with inner dot spans. Replaced all with engine `RadioButton` component:

| Widget | Old Pattern | Lines Removed |
|--------|-------------|---------------|
| GameFinder | `gfRadio`/`gfRadioDot` spans | ~20 |
| DeepResearch | `drRadio`/`drRadioDot` spans | ~25 |
| StreamLauncher | `slRadio`/`slRadioDot` spans | ~20 |

Also fixed a pre-existing bug in **ChartView.tsx:242** — the RadioButton was using `checked` prop instead of the correct `selected` prop. This was a TypeScript error that existed since the initial widget port.

### Design decisions

1. **RadioButton uses `selected` not `checked`** — The engine's RadioButton API differs from standard HTML. All 3 new migrations and the ChartView fix use `selected={value === opt}`.
2. **DeepResearch time string folded into label** — The original had a separate `<span>` for the time estimate (e.g., "~2 min"). Since RadioButton only accepts a string label, the time was appended: `"Quick (~30s)"`, `"Standard (~2 min)"`, `"Deep (~5 min)"`.
3. **MacRepl Btn adoption skipped** — MacRepl already uses engine `Btn` for its actions. No additional migration needed.
4. **ControlRoom engine adoption skipped** — ControlRoom is a complex orchestrator widget; its button/input patterns don't align with simple component swaps.

### Commit

`4314910 refactor(rich-widgets): adopt engine RadioButton in GameFinder/DeepResearch/StreamLauncher, fix ChartView checked→selected`

---

## Step 2: Remove orphaned radio CSS and data-part constants

### What changed

- **game-finder.css** — Removed `[data-part="gf-radio"]` and `[data-part="gf-radio-dot"]` rules (17 lines)
- **deep-research.css** — Removed `[data-part="dr-radio"]` and `[data-part="dr-radio-dot"]` rules (17 lines)
- **stream-launcher.css** — Removed `[data-part='sl-radio']` and `[data-part='sl-radio-dot']` rules (19 lines)
- **parts.ts** — Removed 6 data-part constants: `drRadio`, `drRadioDot`, `gfRadio`, `gfRadioDot`, `slRadio`, `slRadioDot`

### Verification

- `grep -r "gf-radio\|dr-radio\|sl-radio" packages/rich-widgets/src/` → zero matches
- TypeScript check: no new errors (all remaining are pre-existing cross-package rootDir issues)

### Commit

`556f5bd refactor(rich-widgets): remove orphaned radio CSS and data-part constants`

---

## Code review instructions

1. **RadioButton `selected` prop** — Verify all 4 usages (GameFinder, DeepResearch, StreamLauncher, ChartView) use `selected` not `checked`.
2. **DeepResearch label format** — The time estimates are now part of the label string. Verify they render readably.
3. **No orphaned CSS** — Confirm the 6 removed CSS rules have no remaining references in JSX.
