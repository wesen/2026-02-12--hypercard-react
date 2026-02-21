---
Title: Kind Cutover Validation Playbook
Ticket: HC-52-CUSTOMKIND-KIND-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - cleanup
    - frontend
    - backend
DocType: playbook
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Backend validation target
    - Path: packages/engine/src/chat/sem/timelineMapper.ts
      Note: Frontend mapping validation target
    - Path: packages/engine/src/hypercard/artifacts/artifactProjectionMiddleware.ts
      Note: Ingestion projection validation target
    - Path: packages/engine/src/hypercard/artifacts/artifactRuntime.ts
      Note: Artifact extraction validation target
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-21T00:00:00Z
WhatFor: Validate the first-class hypercard timeline-kind cutover end-to-end.
WhenToUse: Run after backend/frontend changes that affect timeline projection, artifact extraction, or renderer routing.
---


# Kind Cutover Validation Playbook

## Goal

Confirm that hypercard timeline projection now works from first-class timeline kinds (`hypercard.widget.v1`, `hypercard.card.v2`) without relying on legacy `tool_result + customKind` remap behavior.

## Preconditions

- Backend binary builds from current `go-inventory-chat` sources.
- Frontend engine builds from current `packages/engine` sources.
- Test DBs available for timeline/turns replay checks.

## Validation Steps

1. Backend compile/smoke
```bash
cd go-inventory-chat
go test ./internal/pinoweb ./cmd/hypercard-inventory-server -run TestDoesNotExist
```

2. Frontend mapper/runtime tests
```bash
pnpm exec vitest run \
  packages/engine/src/chat/sem/timelineMapper.test.ts \
  packages/engine/src/hypercard/artifacts/artifactRuntime.test.ts \
  packages/engine/src/hypercard/artifacts/artifactProjectionMiddleware.test.ts \
  packages/engine/src/hypercard/timeline/hypercardWidget.test.ts \
  packages/engine/src/hypercard/timeline/hypercardCard.test.ts
```

3. Frontend typecheck
```bash
pnpm exec tsc -p packages/engine/tsconfig.json --noEmit
```

4. Runtime smoke (manual)
- Start inventory server and trigger:
  - widget generation (`hypercard.widget.v1`)
  - card generation (`hypercard.card.v2`)
- Verify event stream includes timeline upserts with first-class kinds.
- Verify UI shows widget/card rows as expected.
- Click `Open` and `Edit`:
  - window `nav.param` uses normalized artifact id,
  - viewer resolves artifact successfully (no `Artifact not found`).

5. Replay/hydration smoke (manual)
- Reload the page/session after generated artifacts exist.
- Confirm artifacts still open from replayed timeline entities.
- Confirm suggestions behavior remains unchanged.

6. Legacy guardrail spot check (manual)
- Replay old session containing legacy `tool_result + customKind` entities.
- Confirm behavior is safe:
  - no crash,
  - rows render as generic `tool_result`,
  - no false hypercard remap.

## Expected Outcomes

- First-class kinds power hypercard projection end-to-end.
- Artifact ingestion/open works for live and replay flows.
- Legacy rows degrade gracefully without custom remap behavior.

## Failure Triage

- If widget/card rows are missing: inspect `packages/engine/src/chat/sem/timelineMapper.ts`.
- If artifacts fail to open: inspect `packages/engine/src/hypercard/artifacts/artifactRuntime.ts` and middleware wiring.
- If runtime card registration is missing: inspect `packages/engine/src/hypercard/artifacts/artifactProjectionMiddleware.ts` and `packages/engine/src/plugin-runtime/runtimeCardRegistry.ts`.
