# Tasks

## TODO

- [x] [T1] Create HC-030 ticket workspace and initial docs.
- [x] [T2] Write detailed implementation design doc with impact and phased migration plan.
- [x] [T3] Add granular task checklist for migration and validation.

- [x] [C1] Extract shared runtime-host logic used by both shell paths.
- [x] [C2] Validate extraction with `npm test` and `npm run typecheck`.
- [x] [C3] Record C1-C2 in HC-030 diary and changelog.

- [x] [C4] Add DesktopShell affordances needed by helper migration (story/app bootstrapping hooks).
- [x] [C5] Migrate `createDSLApp` to DesktopShell configuration (remove HyperCardShell/navShortcuts assumptions).
- [x] [C6] Migrate `createStoryHelpers` to DesktopShell semantics (remove navigation slice dependence).
- [x] [C7] Update app story files that rely on `createStoryHelpers` config shape.
- [x] [C8] Record C4-C7 in HC-030 diary and changelog.

- [x] [C9] Migrate app entrypoints: `todo`, `crm`, `book-tracker-debug` to DesktopShell.
- [x] [C10] Migrate inventory themed story away from HyperCardShell.
- [x] [C11] Update snapshot selectors/usages that rely on `state.navigation`.
- [x] [C12] Record C9-C11 in HC-030 diary and changelog.

- [x] [C13] Delete legacy shell component files (`HyperCardShell`, `Layout*`, `TabBar`, `WindowChrome`, `NavBar`).
- [x] [C14] Remove legacy shell exports from `components/shell/index.ts` and root engine barrels.
- [x] [C15] Delete navigation feature files and tests (`features/navigation`, `navigation.test.ts`) if no longer used.
- [x] [C16] Remove navigation reducer wiring from `createAppStore` and dependent test fixtures.
- [x] [C17] Record C13-C16 in HC-030 diary and changelog.

- [x] [V1] Run `npm test`.
- [x] [V2] Run `npm run typecheck`.
- [x] [V3] Run `npm run build`.
- [x] [V4] Run `npm run lint` and document any non-HC-030 pre-existing failures.
- [x] [V5] Final docmgr hygiene pass (`docmgr doctor --ticket HC-030-DESKTOP-CUTOVER --stale-after 30`).
- [x] [V6] Publish final migration summary in HC-030 changelog + diary.
