# Changelog

## 2026-02-17

- Created HC-43 workspace and initialized ticket document set.
- Completed deep frontend assessment document (`design-doc/01-frontend-current-state-and-subsystem-cleanup-assessment.md`).
- Updated investigation diary with detailed workflow and findings (`reference/01-diary.md`).

## 2026-02-17

Completed deep frontend assessment + diary and uploaded bundled PDF to reMarkable at /ai/2026/02/17/HC-43-FRONTEND-ASSESSMENT/HC-43 Frontend Assessment + Diary

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/design-doc/01-frontend-current-state-and-subsystem-cleanup-assessment.md — Primary assessment deliverable
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/reference/01-diary.md — Investigation diary for provenance and continuation


## 2026-02-17 (Phase 1 low-risk cleanup execution)

- Reverted abandoned HC-46 namespace-cutover work and returned to HC-43 scoped cleanup.
- Completed HC-43 Phase 1 item: removed legacy dead-file marker and archived dead files.
- Archived and removed:
  - `apps/inventory/src/stories/decorators.tsx`
  - `packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
  - `packages/engine/src/plugin-runtime/worker/runtime.worker.ts`
- Removed dead barrel export from:
  - `packages/engine/src/plugin-runtime/index.ts`
- Added archive snapshots and rationale:
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/01-dead-file-archive-log.md`
  - archived source snapshots in same folder.
- Validation:
  - `npm run typecheck`
  - `npm run -w packages/engine test`
- Commit:
  - `d92e426` cleanup(hc-43): archive and remove dead legacy marker files
