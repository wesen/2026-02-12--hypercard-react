# Changelog

## 2026-02-15

- Initial workspace created

## 2026-02-16

- Imported source design from `/tmp/webchat-hyper-integration.md` into ticket `sources/local`.
- Completed first-pass architecture validation against current HyperCard/Pinocchio/Geppetto code.
- Added `design-doc/01-validated-architecture-and-implementation-plan.md` with corrected assumptions and phased implementation plan.
- Added `reference/01-diary.md` and `reference/02-execution-notes-and-experiments.md`.
- Expanded `tasks.md` into detailed implementation checklist.
- Added new Go backend module `go-inventory-chat` with:
  - `serve` and `seed` commands,
  - SQLite schema + seed data,
  - inventory query tool layer,
  - `POST /api/chat/completions` and `GET /ws` streaming contract.
- Added backend planner emitting streamed token frames plus widget/card artifacts for chat UI.
- Integrated inventory frontend app-window chat assistant (`InventoryChatAssistantWindow`) with:
  - backend request + WS stream handling,
  - inline widget rendering (`data-table`, `report-view`),
  - action handling (`open-card`, `prefill`, `create-card`),
  - runtime card injection utility.
- Added backend convenience scripts and smoke test script in ticket `scripts/`.
- Captured deferred Phase-2 tasks for SEM projection + timeline hydration in both design doc and tasks list.
- Ran real tmux-based E2E smoke:
  - backend served on `:18081`,
  - inventory Vite app served on `:15173`,
  - browser validated streaming low-stock response, inline widgets, and successful `Create Saved Card` injection/open flow.
- Implemented SEM/timeline phase:
  - backend emits `sem: true` envelopes with typed event names and per-conversation monotonic `seq`,
  - backend projects per-conversation timeline state (messages + bounded event buffer),
  - backend exposes `GET /api/timeline` hydration endpoint.
- Updated frontend chat protocol/client to:
  - parse SEM envelopes (SEM-only transport),
  - hydrate chat messages/actions/artifacts from `/api/timeline` on startup,
  - repopulate card proposal cache from hydrated artifacts.
- Fixed a React StrictMode hydration race that initially dropped hydrated messages in dev.
- Added `scripts/smoke-sem-timeline.sh` to validate completions, SEM stream, and timeline hydration via CLI.
- Re-ran tmux + browser verification after SEM/timeline updates and confirmed hydrated transcript + continued chat streaming works.
- Removed backend legacy-frame compatibility path:
  - no conditional fallback stream writer,
  - no legacy stream parser path in frontend protocol,
  - WS contract is SEM-only for this project.
- Fixed inventory production build failure by setting `worker.format = 'es'` in `apps/inventory/vite.config.ts`.
- Reworked `tasks.md` into an exhaustive Phase 2-6 execution plan with Phase-6 validation interleaved during implementation.
- Refreshed and force-uploaded updated ticket bundle to reMarkable path `/ai/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION`.
