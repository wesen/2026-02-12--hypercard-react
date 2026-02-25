# Changelog

## 2026-02-24

- Initial workspace created


## 2026-02-24

Added detailed implementation plan and granular execution checklist for backend module host hard cutover ticket split.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-06-BACKEND-MODULE-HOST-HARD-CUTOVER--hard-cut-backend-module-host-with-namespaced-app-routes-only/design-doc/01-os-06-implementation-plan.md — Backend module host plan and route policy
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-06-BACKEND-MODULE-HOST-HARD-CUTOVER--hard-cut-backend-module-host-with-namespaced-app-routes-only/tasks.md — Granular implementation tasks


## 2026-02-24

Added OS-06 diary and initialized planning baseline entry.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-06-BACKEND-MODULE-HOST-HARD-CUTOVER--hard-cut-backend-module-host-with-namespaced-app-routes-only/reference/01-diary.md — Ticket diary


## 2026-02-24

Implemented backend module host hard cutover (commit 5bf8f43): introduced backendhost contracts/registry/lifecycle/route guard, added /api/os/apps manifest endpoint, converted inventory server wiring to inventory backend module mounted only under /api/apps/inventory/*, updated integration tests to namespaced routes, and removed legacy root aliases from runtime router wiring.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/inventory_backend_module.go — Inventory backend module implementation
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/main.go — Host now composes modules and mounts namespaced routes only
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/main_integration_test.go — Namespaced route integration tests and legacy-alias assertions
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/backendhost/lifecycle.go — Lifecycle startup/health/stop manager with required-module validation
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/backendhost/manifest_endpoint.go — /api/os/apps endpoint
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/backendhost/module.go — AppBackendManifest and AppBackendModule contracts
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/backendhost/registry.go — Unique app-id module registry
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/backendhost/routes.go — Namespaced mount helper and legacy alias guard


## 2026-02-24

Validation recorded: go test ./... in go-inventory-chat passes; pnpm --filter @hypercard/os-launcher build/test also pass after namespaced inventory proxy updates. During migration, two runtime E2E tests initially failed due stale debug endpoint path references; fixed by switching to /api/apps/inventory/api/debug/conversations/<conv-id>.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/main_integration_test.go — Debug route assertions updated to namespaced endpoint
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/tooling/vite/createHypercardViteConfig.ts — Dev proxy now targets namespaced inventory backend routes


## 2026-02-24

Ticket closed

