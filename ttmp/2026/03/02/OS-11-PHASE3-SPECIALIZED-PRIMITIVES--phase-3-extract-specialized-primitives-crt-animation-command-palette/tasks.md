# Tasks — OS-11-PHASE3-SPECIALIZED-PRIMITIVES

## Create Primitives

- [x] Create useAnimationLoop hook
- [x] Create LabeledSlider component + CSS + data-part
- [x] Create CommandPalette component + CSS + data-part
- [x] Create ButtonGroup component + CSS + data-part
- [x] Register all new parts in parts.ts, export from index.ts
- [ ] Create CrtDisplay component (deferred — bezel structure differs too much)

## Migrate Widgets

- [x] Migrate Oscilloscope to LabeledSlider + useAnimationLoop
- [x] Migrate LogicAnalyzer to LabeledSlider + useAnimationLoop
- [x] Migrate MacCalc command palette to CommandPalette
- [x] Migrate MacCalendar command palette to CommandPalette
- [ ] Migrate GraphNavigator to useAnimationLoop (skipped — force simulation lifecycle incompatible)
- [ ] Migrate button groups to ButtonGroup (skipped — too much per-widget variation)

## Verification

- [x] TypeScript check passes (no new errors, only pre-existing)
- [ ] Oscilloscope waveforms render identically before/after (visual check pending)
- [ ] LogicAnalyzer signals render identically before/after (visual check pending)
- [ ] CommandPalette keyboard navigation works (visual check pending)
- [ ] Desktop integration story launches all 20 widgets (visual check pending)
- [x] Diary updated
- [x] Changelog updated
- [x] `docmgr doctor` passes
