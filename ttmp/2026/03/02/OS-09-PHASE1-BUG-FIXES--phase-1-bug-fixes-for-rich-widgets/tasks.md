# Tasks — OS-09-PHASE1-BUG-FIXES

## Bug Fixes

- [ ] Task 1: Fix module-level `let nextId` in KanbanBoard.tsx:9 — move to useRef
- [ ] Task 2: Fix module-level `let nextId` in calendar/types.ts:53 — use collision-resistant ID
- [ ] Task 3: Fix module-level `let idCounter` in SystemModeler.tsx:18 — move to useRef
- [ ] Task 4: Fix useMemo with Math.random() in YouTubeRetro.tsx:217 — deterministic shuffle
- [ ] Task 5: Fix startTime useState → useRef in MacRepl.tsx
- [ ] Task 6: Wire dead state (webSearch, academicOnly) in DeepResearch.tsx:70-71
- [ ] Task 7: Add devicePixelRatio to Oscilloscope.tsx and LogicAnalyzer.tsx canvas
- [ ] Task 8: Add velocity threshold to GraphNavigator.tsx force simulation

## Verification

- [ ] TypeScript check passes (`npx tsc --noEmit`)
- [ ] All affected widget stories render without errors
- [ ] No new console warnings/errors
- [ ] Desktop integration story launches all 20 widgets
- [ ] Diary updated with all steps
- [ ] Changelog updated
- [ ] `docmgr doctor` passes
