# Tasks

## TODO

- [x] C1: Inventory all `tool_result + customKind` producers/consumers (backend projector, frontend mapper, renderers, artifact runtime, tests) and freeze current behavior snapshot
- [x] C2: Define canonical timeline `kind` contract for hypercard artifacts (`hypercard.widget.v1`, `hypercard.card.v2`) and document required `props` shape
- [x] C3: Backend cutover: emit first-class hypercard timeline kinds in timeline upsert (`kind`), keep payload fields stable
- [x] C4: Frontend cutover: register renderers directly for first-class hypercard kinds and remove `customKind` remap dependency
- [x] C5: Artifact ingestion cutover: parse artifact upserts from first-class hypercard timeline entities (not only `tool_result` wrappers)
- [x] C6: Compatibility decision: perform hard cutover (no legacy remap path) while keeping generic `tool_result` rendering behavior as non-hypercard fallback
- [x] C7: Remove compatibility path in frontend projection/runtime (delete `customKind` remap logic + legacy tests + dead conditionals)
- [x] C8: Add migration validation playbook (snapshot/replay, websocket stream, open/edit artifact flows, suggestions unaffected)
