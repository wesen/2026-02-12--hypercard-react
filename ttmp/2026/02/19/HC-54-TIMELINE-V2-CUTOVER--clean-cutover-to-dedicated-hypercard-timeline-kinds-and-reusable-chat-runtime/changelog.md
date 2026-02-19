# Changelog

## 2026-02-19

- Initial workspace created


## 2026-02-19

Initialized execution-ready task plan for the clean TimelineEntityV2 cutover (steps 1-9) with explicit legacy-removal requirements at each phase.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/tasks.md — Added concrete step-by-step implementation tasks and hard legacy removal gates
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/index.md — Added ticket summary, execution context, and canonical implementation links

## 2026-02-19

Added comprehensive HC-54 implementation plan document consolidating cutover sequencing, protobuf extraction strategy, end-state file layout, legacy-removal gates, and validation/reviewer checklists.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/design/01-clean-cutover-implementation-plan-timelineentityv2.md — New detailed implementation plan for HC-54 execution
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/index.md — Added direct link to the detailed implementation plan

## 2026-02-19

Began HC-54 implementation execution and completed Step 1 (contract freeze + no-legacy baseline), including diary initialization for task-by-task tracking.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/tasks.md — Marked Step 1 complete and updated done checklist
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/reference/01-diary.md — Added execution diary with Step 1 entry and review guidance

## 2026-02-19

Completed HC-54 Step 2 by introducing app-owned protobuf extraction for Hypercard widget/card lifecycle payloads and cutting backend projection output to dedicated TimelineEntityV2 kinds (`hypercard_widget`, `hypercard_card`).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/proto/sem/hypercard/widget.proto — New widget lifecycle protobuf contract
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/proto/sem/hypercard/card.proto — New card lifecycle protobuf contract
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/pb/sem/hypercard/widget.pb.go — Generated Go binding for widget lifecycle payload extraction
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/pb/sem/hypercard/card.pb.go — Generated Go binding for card lifecycle payload extraction
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_payload_proto.go — Protojson decode + TimelineEntityV2 props mapping helpers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go — Backend timeline handler cutover to dedicated kinds and deterministic IDs
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_payload_proto_test.go — Decode/props unit coverage
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events_timeline_test.go — Projection tests asserting dedicated kind snapshots
