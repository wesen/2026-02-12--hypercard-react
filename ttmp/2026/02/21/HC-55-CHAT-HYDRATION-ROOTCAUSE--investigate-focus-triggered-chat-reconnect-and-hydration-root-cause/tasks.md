# Tasks

## TODO

- [ ] Instrument and verify focus path (`mount -> connect -> disconnect -> reconnect -> hydrate`) after semantic changes

## DONE

- [x] Added deep Go and frontend timeline path analysis to HC-55 bug report
- [x] Documented ring buffer behavior and clarified that hydration reads timeline store, not sem buffer
- [x] Chose canonical ordering contract: chronological first-seen
- [x] Chose source-of-truth contract: backend projected timeline (`timeline.upsert`) for persisted entities
- [x] Chose suggestion visibility contract: show only latest suggestion block in UI
- [x] Implemented canonical timeline order as chronological first-seen on backend snapshots (SQLite + in-memory)
- [x] Added backend projection handlers for `hypercard.suggestions.*` so persisted timeline includes assistant suggestions
- [x] Enforced backend `timeline.upsert` as source-of-truth for persisted timeline entities on frontend
- [x] Ensured latest suggestions block semantics through backend projection + frontend merge behavior
- [x] Added/adjusted regression tests for ordering and suggestion projection semantics
