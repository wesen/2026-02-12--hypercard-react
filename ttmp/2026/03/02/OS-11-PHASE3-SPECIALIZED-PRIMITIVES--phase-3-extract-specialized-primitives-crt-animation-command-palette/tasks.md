# Tasks — OS-11-PHASE3-SPECIALIZED-PRIMITIVES

## Create Primitives

- [ ] Create useAnimationLoop hook + test story
- [ ] Create LabeledSlider component + CSS + data-part + story
- [ ] Create CrtDisplay component (uses useAnimationLoop) + CSS + data-part + story
- [ ] Create CommandPalette component + CSS + data-part + story
- [ ] Create ButtonGroup component + CSS + data-part + story
- [ ] Register all new parts in parts.ts, export from index.ts

## Migrate Widgets

- [ ] Migrate Oscilloscope to CrtDisplay + LabeledSlider + useAnimationLoop
- [ ] Migrate LogicAnalyzer to CrtDisplay + LabeledSlider + useAnimationLoop
- [ ] Migrate GraphNavigator to useAnimationLoop
- [ ] Migrate MacCalc command palette to CommandPalette
- [ ] Migrate MacCalendar command palette to CommandPalette
- [ ] Migrate button groups in GraphNavigator, LogicAnalyzer, Oscilloscope to ButtonGroup
- [ ] Remove orphaned component code and CSS

## Verification

- [ ] TypeScript check passes
- [ ] Oscilloscope waveforms render identically before/after
- [ ] LogicAnalyzer signals render identically before/after
- [ ] CommandPalette keyboard navigation works
- [ ] Desktop integration story launches all 20 widgets
- [ ] Diary updated, changelog updated, docmgr doctor passes
