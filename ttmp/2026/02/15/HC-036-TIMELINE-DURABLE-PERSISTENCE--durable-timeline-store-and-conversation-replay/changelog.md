# Changelog

## 2026-02-15

- Initial workspace created

## 2026-02-16

- Replaced template implementation document with a concrete durable timeline persistence and replay plan.
- Replaced placeholder tasks with detailed schema, runtime integration, hydration, reconnect, and validation tasks.
- Added initial diary entry documenting current plan and next implementation step.
- Implemented SQLite durable timeline schema and APIs.
- Wired stream/message lifecycle persistence into backend runtime path.
- Hydration endpoint now reads durable snapshot state and supports incremental reads.
- Commit `2780008`.
- Removed duplicated local timeline persistence implementation in favor of Pinocchio `chatstore` timeline/turn stores.
- Deleted `go-inventory-chat/internal/store/timeline.go` and removed timeline tables from inventory DB schema.
- Revalidated hydration and replay behavior against Pinocchio timeline snapshots.

## 2026-02-15

Durable timeline/turn persistence and replay/hydration completed.

