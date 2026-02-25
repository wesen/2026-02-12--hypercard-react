# Tasks

## Execution Checklist

### Scope and baseline

- [x] `OS08-01` Confirm scope boundary: this ticket is real app rendering in launcher modules (not OS-01 menu/context-menu architecture).
- [x] `OS08-02` Capture current placeholder baseline for all modules (`Inventory Module`, `Todo Module`, `CRM Module`, `Book Tracker Module`).
- [x] `OS08-03` Add explicit regression guard test that fails if placeholder module text remains rendered in launcher windows.

### Inventory real integration (priority)

- [x] `OS08-10` Reintroduce real inventory launcher window root component (replace placeholder section in `apps/inventory/src/launcher/module.tsx`).
- [x] `OS08-11` Render real inventory UI path inside launcher window (cards/stack runtime and chat surfaces), not static diagnostic text.
- [x] `OS08-12` Preserve launcher window identity (`appId`, `instanceId`, `windowId`) and use it to scope runtime/session IDs.
- [x] `OS08-13` Wire chat backend calls to namespaced APIs (`/api/apps/inventory/*`) via launcher host context.
- [x] `OS08-14` Restore event viewer / timeline debug window actions from prior inventory behavior under launcher composition.
- [x] `OS08-15` Restore profile selector behavior in inventory chat window under launcher composition.
- [ ] `OS08-16` Confirm confirm-runtime windows/queue still open and function from launcher-hosted inventory context.

### Non-inventory modules real integration

- [x] `OS08-20` Replace todo placeholder launcher window with real todo app surface.
- [x] `OS08-21` Replace crm placeholder launcher window with real crm app surface.
- [x] `OS08-22` Replace book-tracker-debug placeholder launcher window with real book tracker app surface.
- [x] `OS08-23` Ensure all modules still provide stable launch metadata (`id`, `dedupeKey`, bounds, icon, title).

### Shared launcher host behavior

- [x] `OS08-30` Validate `apps/os-launcher` module registry and render adapter paths still resolve each module correctly.
- [x] `OS08-31` Ensure unknown app fallback is preserved for invalid app keys while real modules render for known keys.
- [x] `OS08-32` Ensure launcher startup windows/icons open real app UIs, not placeholder wrappers.

### Tests and validation

- [x] `OS08-40` Add launcher host tests asserting each module renders real content signatures (stack cards/components) instead of placeholder labels.
- [ ] `OS08-41` Add inventory-focused integration test for chat window open + namespaced backend request path.
- [ ] `OS08-42` Add regression test for event viewer/timeline debug actions from launcher-hosted inventory chat.
- [x] `OS08-43` Run `pnpm --filter @hypercard/os-launcher test`.
- [x] `OS08-44` Run `pnpm --filter @hypercard/os-launcher build`.
- [x] `OS08-45` Run `cd go-inventory-chat && go test ./...`.
- [x] `OS08-46` Run `npm run launcher:smoke` and record result.

### Documentation and operations

- [ ] `OS08-50` Update root README with expected real launcher window behavior and limitations.
- [ ] `OS08-51` Update backend README/runbook with manual verification steps for real inventory/chat/cards in launcher.
- [ ] `OS08-52` Add operator playbook for "verify real app windows" (icons -> windows -> chat/cards/actions).

### Ticket hygiene and closure

- [x] `OS08-60` Keep OS-08 diary with per-step commits, failures, and validation evidence.
- [x] `OS08-61` Update OS-08 changelog with each major implementation slice.
- [ ] `OS08-62` Run `docmgr doctor --ticket OS-08-REAL-APP-LAUNCH-CUTOVER --stale-after 30`.
- [ ] `OS08-63` Close ticket when all DoD gates are complete.

## Definition of Done

- [x] Launcher icon opens real inventory app window with working cards/chat integration (not placeholder content).
- [x] Inventory chat functionality works from launcher context against namespaced backend routes.
- [x] Todo/CRM/Book Tracker launcher windows render real app surfaces (not placeholder content).
- [x] Launcher tests/regressions prevent accidental placeholder reintroduction.
- [x] Build/test/smoke validation passes and is recorded in ticket artifacts.
- [ ] OS-08 docs (tasks/changelog/diary/playbook) are complete and `docmgr doctor` is clean.
