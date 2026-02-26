# Tasks

## Execution Checklist

### Ticket setup and bug intake

- [x] `OS15-00` Create ticket `OS-15-CONTEXT-ACTION-EFFECT-LOOP` with bug-focused scope.
- [x] `OS15-01` Record stack-trace-driven bug summary and impacted subsystems.
- [x] `OS15-02` Author detailed root-cause research document with code-line evidence and dependency loop analysis.
- [x] `OS15-03` Upload bug report + research bundle to reMarkable.

### Root-cause validation and reproduction

- [ ] `OS15-10` Build minimal deterministic reproduction scenario (StrictMode + context action registration).
- [ ] `OS15-11` Capture lifecycle logs proving cleanup/register loop before fix.
- [ ] `OS15-12` Identify all entry points that call `useRegisterContextActions` and classify churn risk.

### Fix design and implementation

- [x] `OS15-20` Split runtime context surface so registration hooks do not depend on `openContextMenu` identity.
- [x] `OS15-21` Keep `useOpenDesktopContextMenu` behavior unchanged for callers while decoupling internals.
- [x] `OS15-21A` Move context-menu UI state (`open/close + payload`) from controller-local state into Redux `windowing.desktop`.
- [x] `OS15-21B` Add Redux selectors/actions for context-menu state and route all context-menu close paths through reducers.
- [x] `OS15-21C` Sanitize persisted context-menu action entries to avoid storing runtime-only visibility predicates in Redux.
- [ ] `OS15-22` Add idempotence guardrails in registration effects if needed (target/action stability checks).
- [x] `OS15-23` Validate no behavioral regression in icon/window/message/conversation context menus.

### Testing and closure

- [ ] `OS15-30` Add regression test that fails on repeated cleanup/register loop and passes after fix.
- [x] `OS15-31` Run targeted engine + launcher tests and record outcomes.
- [x] `OS15-32` Run build validation for impacted apps/packages.
- [x] `OS15-33` Update changelog + diary with final fix evidence.
- [x] `OS15-34` Run `docmgr doctor --ticket OS-15-CONTEXT-ACTION-EFFECT-LOOP --stale-after 30`.
- [ ] `OS15-35` Close ticket once loop no longer reproduces and regression coverage exists.

## Definition of Done

- [ ] `Maximum update depth exceeded` no longer appears for context-action registration paths.
- [ ] Runtime context registration hooks do not churn due to unrelated callback identity changes.
- [ ] Context-menu behavior remains correct for window/icon/message/conversation targets.
- [ ] Regression test coverage prevents reintroduction.
