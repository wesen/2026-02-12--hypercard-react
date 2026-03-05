# Tasks — OS-14-PHASE6-STATE-RESTRUCTURING

## Widget State Restructuring

- [x] Restructure KanbanBoard: 8 useState → useReducer with 12 actions (3 state groups)
- [x] Restructure RetroMusicPlayer: 13 useState → useReducer with 14 actions (3 state groups)
- [x] Restructure MacCalc: 12 useState → useReducer with 19 actions (4 state groups)
- [x] Evaluate Oscilloscope: skipped — 14 independent slider/toggle states, no grouping benefit
- [x] Evaluate MacCalendar: skipped — 5 main states, below complexity threshold

## Verification

- [x] All interactive features preserved (state reads via destructuring are backward-compatible)
- [x] TypeScript check passes (no new errors)
- [x] Diary updated, changelog updated, docmgr doctor passes
