# Tasks

## Completed

- [x] Create HC-43 ticket workspace and initial docs
- [x] Perform frontend architecture and code-quality evidence sweep
- [x] Write comprehensive assessment document with current-state + subsystem proposals
- [x] Maintain investigation diary with command-level notes
- [x] Relate key code files to assessment and diary via `docmgr doc relate`
- [x] Upload assessment bundle to reMarkable and verify remote path
- [x] Record final delivery entry in changelog

## Phase 1 (Low Risk, High Clarity) Execution

- [x] Remove legacy dead-file marker stub and archive it (`apps/inventory/src/stories/decorators.tsx`)
- [x] Remove dead plugin-runtime worker exports/files and archive snapshots (`sandboxClient.ts`, `runtime.worker.ts`)
- [x] Consolidate duplicate SEM helper utilities in inventory chat parsing/projection paths
- [x] Add docs clarifying Storybook ownership and app boot model boundaries

## Phase 1 Hard-Cutover Replay (No Backwards Compatibility)

- [x] Enforce explicit hard-cutover scope in HC-43 ticket docs (no compatibility shims, no migration layers)
- [x] HC-43 Phase 1 hard-cutover replay kickoff: set explicit no-backward-compatibility execution notes and reopen status
- [x] Hard-cutover verify dead-file removals and archive evidence are current (no stubs/re-exports left)
- [x] Hard-cutover verify SEM helper consolidation with single shared helper module and no duplicated local parsers
- [ ] Hard-cutover verify centralized Vite app bootstrapping config helper usage across all app vite configs
- [ ] Hard-cutover verify Storybook/app-boot boundary documentation is present and aligned with current source
