# Changelog

## 2026-02-24

- Initial workspace created


## 2026-02-25

Expanded OS-08 into an implementation-ready execution checklist for replacing placeholder launcher module screens with real app renderers (inventory first), including tests, smoke validation, docs/runbook updates, and closure gates.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-08-REAL-APP-LAUNCH-CUTOVER--launcher-modules-render-real-apps-and-chat-stacks/tasks.md — Detailed implementation tasks and DoD.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-08-REAL-APP-LAUNCH-CUTOVER--launcher-modules-render-real-apps-and-chat-stacks/index.md — Ticket scope and integration overview.

Implemented real launcher app rendering with per-module store isolation and removed nested inventory desktop composition to restore host-level window behavior.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/module.tsx — inventory launcher module render path.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx — inventory real launcher windows and folder icons.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx — host rendering regression tests.

Rolled out folder-based opening flows for todo/crm/book-tracker and inventory so app desktop icons open folder windows first, then launch real workspace windows from folder icons.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/todo/src/launcher/module.tsx — todo folder window and workspace launcher icon.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/crm/src/launcher/module.tsx — crm folder window and workspace launcher icon.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/book-tracker-debug/src/launcher/module.tsx — book tracker folder window and workspace launcher icon.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx — inventory folder icon surface and routed launcher actions.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-08-REAL-APP-LAUNCH-CUTOVER--launcher-modules-render-real-apps-and-chat-stacks/reference/01-diary.md — per-step implementation diary.

Fixed remaining nested-desktop regression for todo/crm/book-tracker: workspace launches now open card-session windows rendered via app-specific window adapters rather than nested `DesktopShell` roots.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/todo/src/launcher/module.tsx — todo workspace window changed to card session + adapter.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/crm/src/launcher/module.tsx — crm workspace window changed to card session + adapter.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/book-tracker-debug/src/launcher/module.tsx — book tracker workspace window changed to card session + adapter.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-08-REAL-APP-LAUNCH-CUTOVER--launcher-modules-render-real-apps-and-chat-stacks/reference/01-diary.md — diary update for regression diagnosis/fix.

Removed folder windows for todo/crm/book-tracker because each had only one folder action. Top desktop icons now launch each app directly into Home card sessions.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/todo/src/launcher/module.tsx — top icon now launches directly to todo home card window.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/crm/src/launcher/module.tsx — top icon now launches directly to crm home card window.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/book-tracker-debug/src/launcher/module.tsx — top icon now launches directly to book tracker home card window.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx — launch payload assertions updated for direct card launches.
