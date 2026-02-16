# Changelog

## 2026-02-15

- Initial workspace created

## 2026-02-16

- Replaced template implementation document with a concrete Pinocchio-first runtime foundation plan.
- Replaced placeholder tasks with phased execution checklist covering cleanup, composer wiring, middleware, and validation.
- Added initial diary entry documenting documentation re-baseline and next coding step.
- Implemented runtime foundation refactor:
  - removed duplicated runtime framework files from `go-inventory-chat/internal/app`,
  - rebuilt server transport and middleware chain in `internal/app/server.go`,
  - enforced SEM-only stream contract in the unified backend path.
- Commit `2780008`.
- Replaced legacy queued contract with Pinocchio app-owned chat transport (`/chat`, `/ws`, `/api/timeline`).
- Added Geppetto runtime composition flags (`provider`, `model`, `api-key`, `base-url`) with deterministic fallback engine.
- Registered inventory tool (`inventory_query`) and removed duplicated local timeline store implementation.
- Added Pinocchio durable timeline/turn store wiring in `cmd/inventory-chat/main.go`.
- Validation rerun:
  - `GOWORK=off go test ./...`
  - frontend typecheck/build
  - Playwright end-to-end chat + create-card flow.

## 2026-02-15

Runtime foundation completed: Pinocchio app-owned contract and middleware chain delivered.

