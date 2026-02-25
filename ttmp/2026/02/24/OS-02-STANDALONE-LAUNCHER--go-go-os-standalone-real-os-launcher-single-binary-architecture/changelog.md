# Changelog

## 2026-02-24

- Initial workspace created.
- Created primary design document and investigation diary for OS-02.
- Completed evidence gathering across `apps/*`, `packages/engine/*`, and `go-inventory-chat/*` to support launcher architecture decisions.
- Updated doc relationships for the design doc and diary using `docmgr doc relate`.
- Added missing topic vocabulary slugs (`binary`, `desktop`, `go-go-os`, `launcher`) and reran doctor successfully.
- Uploaded final bundle to reMarkable path `/ai/2026/02/24/OS-02-STANDALONE-LAUNCHER`.
- Refined implementation plan to introduce `packages/desktop-os` as the OS-level orchestration package, with explicit dependency direction `desktop-os -> engine` and no reverse dependency.

## 2026-02-24 - Completed standalone launcher architecture investigation

Finished an evidence-backed frontend/backend architecture analysis for a single-binary go-go-os launcher, including module contracts for launchable apps and optional backend components, phased rollout strategy, and validation plan.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/main.go — Core evidence for backend composition limitations and route model
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Core evidence for frontend launcher composition seams
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-02-STANDALONE-LAUNCHER--go-go-os-standalone-real-os-launcher-single-binary-architecture/design-doc/01-standalone-go-go-os-launcher-architecture-and-composable-app-runtime.md — Primary design output with current-state map
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-02-STANDALONE-LAUNCHER--go-go-os-standalone-real-os-launcher-single-binary-architecture/reference/01-investigation-diary.md — Chronological command/finding log and rationale trail

## 2026-02-24 - Locked architecture decisions and expanded implementation task plan

Locked OS-02 to single global store + hard cutover (no compatibility wrappers/aliases), finalized concrete LaunchableAppModule and AppBackendModule contracts, and replaced tasks.md with a granular phase-by-phase implementation backlog.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-02-STANDALONE-LAUNCHER--go-go-os-standalone-real-os-launcher-single-binary-architecture/design-doc/01-standalone-go-go-os-launcher-architecture-and-composable-app-runtime.md — Updated contract definitions and hard-cutover decisions
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-02-STANDALONE-LAUNCHER--go-go-os-standalone-real-os-launcher-single-binary-architecture/tasks.md — Replaced with detailed granular implementation checklist

