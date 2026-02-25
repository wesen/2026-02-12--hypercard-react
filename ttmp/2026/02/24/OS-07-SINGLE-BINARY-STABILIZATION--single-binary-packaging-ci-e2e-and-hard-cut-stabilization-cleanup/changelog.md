# Changelog

## 2026-02-24

- Initial workspace created


## 2026-02-24

Added detailed implementation plan and granular execution checklist for single-binary stabilization and CI hardening ticket split.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-07-SINGLE-BINARY-STABILIZATION--single-binary-packaging-ci-e2e-and-hard-cut-stabilization-cleanup/design-doc/01-os-07-implementation-plan.md — Stabilization and release plan
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-07-SINGLE-BINARY-STABILIZATION--single-binary-packaging-ci-e2e-and-hard-cut-stabilization-cleanup/tasks.md — Granular implementation tasks


## 2026-02-24

Added OS-07 diary and initialized planning baseline entry.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-07-SINGLE-BINARY-STABILIZATION--single-binary-packaging-ci-e2e-and-hard-cut-stabilization-cleanup/reference/01-diary.md — Ticket diary


## 2026-02-25

Implemented OS-07 single-binary hard cutover baseline (commit `e7753ba`): renamed backend command to `cmd/go-go-os-launcher`, mounted embedded launcher UI at root, added frontend artifact sync pipeline, and added one-command launcher binary build scripts.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main.go — Launcher command wiring and root UI mount
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/launcherui/handler.go — Embedded SPA/static asset handler
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/scripts/sync-launcher-ui.sh — Frontend dist sync into Go embed directory
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/scripts/build-go-go-os-launcher.sh — Binary build script
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/package.json — Launcher build commands

## 2026-02-25

Added CI and smoke policy gates (commit `f7d3a3e`): introduced launcher CI workflow and smoke script validating shell availability, namespaced backend route policy, legacy alias rejection, required-module startup failure, and startup timing.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/.github/workflows/launcher-ci.yml — Launcher frontend/go/smoke CI jobs
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/scripts/smoke-go-go-os-launcher.sh — End-to-end startup and route-policy checks
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main.go — Legacy alias hard-block handlers before root SPA mount
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go — Integration host wiring with launcher handler + alias policy

## 2026-02-25

Updated launcher-first docs and runbooks, and recorded full OS-07 validation outcomes: root README and backend README now use `go-go-os-launcher` workflows, operator runbook added, and validation recorded (`npm run test`, `npm run build`, `go test ./...`, `npm run launcher:smoke` pass; `npm run lint` fails on pre-existing unrelated repo-wide diagnostics).

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/README.md — Launcher-first quickstart and single-binary section
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/README.md — Updated launcher command runbook and route policy notes
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-07-SINGLE-BINARY-STABILIZATION--single-binary-packaging-ci-e2e-and-hard-cut-stabilization-cleanup/playbooks/01-launcher-operations-runbook.md — Operator build/launch/troubleshoot playbook
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-07-SINGLE-BINARY-STABILIZATION--single-binary-packaging-ci-e2e-and-hard-cut-stabilization-cleanup/tasks.md — Checklist progress and DoD status
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-07-SINGLE-BINARY-STABILIZATION--single-binary-packaging-ci-e2e-and-hard-cut-stabilization-cleanup/reference/01-diary.md — Detailed implementation diary updates

## 2026-02-24

OS-07 completed: single-binary launcher build/embed/ci/smoke stabilization delivered and validated.

