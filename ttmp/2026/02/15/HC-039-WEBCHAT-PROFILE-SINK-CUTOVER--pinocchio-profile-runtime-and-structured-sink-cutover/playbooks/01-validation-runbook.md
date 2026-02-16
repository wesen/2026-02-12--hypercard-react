---
Title: Validation Runbook - Profile and Structured Sink Cutover
Ticket: HC-039-WEBCHAT-PROFILE-SINK-CUTOVER
Status: active
Topics:
    - backend
    - frontend
    - architecture
    - chat
DocType: playbook
Intent: short-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/cmd/inventory-chat/main.go
      Note: Backend serve command and runtime flags.
    - Path: apps/inventory/package.json
      Note: Frontend dev/build scripts.
ExternalSources: []
Summary: Step-by-step command runbook for validating profile runtime, filtering sink extraction, SEM projection, and create-card flow.
LastUpdated: 2026-02-16T03:44:00-05:00
WhatFor: Repeatable manual and CI-oriented validation sequence.
WhenToUse: Execute after each implementation phase and before ticket closure.
---

# Validation Runbook

## 1. Backend

1. `cd go-inventory-chat`
2. `GOWORK=off go test ./...`
3. `go run ./cmd/inventory-chat serve --llm-enabled=true --llm-provider=openai --llm-model=gpt-4.1-mini`

## 2. Frontend

1. `npm exec -w apps/inventory tsc -b`
2. `npm run -w apps/inventory build`
3. `npm run -w apps/inventory dev`

## 3. Contract Checks

1. `GET /api/chat/profiles` returns profile list.
2. `GET /api/chat/profile` returns active profile.
3. `POST /api/chat/profile` updates profile cookie/state.
4. `POST /chat` accepts profile-constrained overrides only.

## 4. Structured Extraction Checks

1. Send a report prompt.
2. Verify extractor emits typed hypercard widget proposal event.
3. Verify assistant visible text does not include raw `<hypercard:...>` payload.
4. Verify malformed block emits `hypercard.artifact.error` entity.

## 5. Timeline and Frontend Checks

1. Verify `/api/timeline` contains typed hypercard entities.
2. Verify frontend renders report/table from typed entities only.
3. Verify frontend no longer depends on regex text tag parsing.

## 6. Create-Card Flow

1. Trigger `Create Saved Card` on widget proposal.
2. Verify second-phase card generation prompt path executes.
3. Verify returned card proposal passes validation gate.
4. Verify injected card opens as window.
5. Verify duplicate `cardId` path is rejected deterministically.

## 7. Regression Checks

1. Tool execution events still stream and persist.
2. Timeline hydration/reconnect remains stable.
3. Multiple clients on same `conv_id` do not duplicate artifacts.
