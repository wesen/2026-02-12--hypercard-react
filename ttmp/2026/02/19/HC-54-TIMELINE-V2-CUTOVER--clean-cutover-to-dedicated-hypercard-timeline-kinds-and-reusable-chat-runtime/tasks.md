# Tasks

## TODO

- [x] 1) Freeze dedicated TimelineEntityV2 contract for Hypercard kinds (`hypercard_widget`, `hypercard_card`) and deterministic IDs (`<itemId>:widget`, `<itemId>:card`):
  - define canonical required props fields and lifecycle phases in docs + code comments
  - remove/ban legacy contract references for widget/card routing (`tool_result.customKind`, oneof-era assumptions) from active HC-54 docs
- [x] 2) Add protobuf extraction layer for Hypercard SEM event payloads in backend:
  - add app-owned protobuf messages and generated Go bindings for widget/card lifecycle payload extraction
  - switch translator/projector decode helpers to protobuf extraction (`protojson`) instead of ad-hoc map decoding
  - remove legacy map-decoding helpers once protobuf extraction is wired and tested
- [x] 3) Introduce generic frontend registration seams (kind normalizers + kind renderer registry) in shared/runtime layer:
  - add explicit bootstrap registration API used by apps (no `init` side effects)
  - remove legacy manual per-app widget/card routing helpers that become obsolete once registry dispatch exists
- [x] 4) Cut over backend projection to dedicated timeline kinds:
  - update `go-inventory-chat/internal/pinoweb/hypercard_events.go` to upsert `hypercard_widget|hypercard_card`
  - stop emitting widget/card final payloads through `tool_result` + `customKind`
  - delete legacy backend code paths/constants/tests that assert `customKind` widget/card projection
- [ ] 5) Cut over frontend timeline mapping to dedicated kinds:
  - update Hypercard engine SEM/timeline mapping to ingest dedicated kinds from canonical `timeline.upsert`
  - remove `tool_result.customKind` widget/card mapping branches and related fallback logic
  - update/remove legacy tests tied to tool_result-based widget/card rendering
- [ ] 6) Extract Hypercard renderer pack out of Inventory using `git mv` first:
  - move renderer files preserving history/styles
  - make pack self-contained and registered via explicit bootstrap
  - remove duplicated inventory-local renderer implementations after pack cutover
- [ ] 7) Generalize ChatWindow runtime and move chat orchestration out of Inventory:
  - make ChatWindow integration reusable across apps through registry-driven dispatch and host callbacks
  - remove inventory-specific chat orchestration glue that is superseded by reusable runtime
- [ ] 8) Rewire Inventory to consume reusable chat runtime + Hypercard pack only:
  - keep only inventory-specific host actions/business callbacks in app layer
  - remove remaining inventory chat projection/renderer wiring that duplicates shared behavior
- [ ] 9) Final hard-cut cleanup + validation gate:
  - run full test/typecheck and end-to-end widget/card lifecycle validation
  - prove hydration/replay parity after refresh with dedicated kinds
  - remove any remaining dead symbols, compatibility aliases, feature flags, or legacy code paths related to old widget/card routing
  - fail the ticket if any `tool_result/customKind` widget/card path remains in active code

## Done

- [x] Create ticket workspace for clean TimelineEntityV2 cutover and populate 1-9 execution task plan
- [x] Start implementation diary and complete Step 1 contract freeze + no-legacy baseline
- [x] Step 2 backend protobuf extraction landed with generated bindings and decode/props tests
- [x] Step 3 frontend registry seams landed (timeline kind normalizers + inline widget renderer registry + explicit inventory bootstrap)
- [x] Step 4 backend projection hard-cut verified complete (dedicated kinds only, no widget/card tool_result/customKind paths)
