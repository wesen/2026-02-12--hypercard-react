# Changelog

## 2026-02-15

- Initial workspace created

## 2026-02-16

- Replaced template implementation document with concrete frontend web-chat cutover and UX stabilization plan.
- Replaced placeholder task list with phased implementation and validation checklist.
- Added initial diary entry documenting dependencies and next coding step.
- Switched frontend protocol to Pinocchio app-owned contract (`/chat`, `/ws`, `/api/timeline`).
- Replaced message queue/stream-url client flow with timeline entity hydration and `timeline.upsert` projection.
- Added structured fallback parsing (`hypercard:widget`, `hypercard:card`, `hypercard:actions`) so deterministic backend mode still renders full widgets/actions.
- Verified end-to-end create-card workflow after contract cutover.

## 2026-02-15

Frontend cutover to Pinocchio timeline + ws contract completed and smoke-tested.

