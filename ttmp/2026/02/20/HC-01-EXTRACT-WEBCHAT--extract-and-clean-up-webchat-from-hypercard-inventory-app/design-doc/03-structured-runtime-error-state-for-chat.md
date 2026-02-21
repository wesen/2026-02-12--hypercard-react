---
Title: Structured runtime error state for chat
Ticket: HC-01-EXTRACT-WEBCHAT
Status: active
Topics: []
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/chat/runtime/conversationManager.ts
      Note: Conversation lifecycle error mapping and dispatch path
    - Path: packages/engine/src/chat/runtime/http.ts
      Note: HTTP error mapping source for structured state
    - Path: packages/engine/src/chat/state/chatSessionSlice.ts
      Note: Current string-only error channeling state and target for structured error model
    - Path: packages/engine/src/chat/state/selectors.ts
      Note: Compatibility and new structured error selectors
    - Path: packages/engine/src/chat/ws/wsManager.ts
      Note: Primary runtime producer of typed connection/hydration/SEM decode errors
ExternalSources: []
Summary: Design proposal to replace string-only stream error channeling with typed, conversation-scoped structured error state and clearer reducer/selector semantics.
LastUpdated: 2026-02-20T14:25:48.480860785-05:00
WhatFor: Specify a robust error model for chat runtime so failures are diagnosable and UI/telemetry behavior is consistent across websocket, hydration, HTTP, and SEM decode paths.
WhenToUse: Use when implementing Phase 9 error-state work or reviewing runtime failure handling in wsManager, conversationManager, and selectors.
---


# Structured runtime error state for chat

## Executive Summary

Current chat runtime error handling channels most failures into a single string field (`chatSession.lastError`) via `setStreamError`. This is simple but loses error category, stage, status code, retryability, and ordering context.

This design proposes a conversation-scoped structured error model with typed entries, source metadata, and optional error history. The goal is to preserve current UX while enabling precise handling for:

1. websocket connection errors
2. timeline hydration errors
3. SEM frame parsing/decode errors
4. prompt submit HTTP failures

The design is additive-first (new fields + selectors) and can be migrated incrementally without breaking existing callers.

## Problem Statement

### Current state

`packages/engine/src/chat/state/chatSessionSlice.ts` currently stores:

```ts
lastError: string | null
```

Producers like `wsManager` and `useConversation` call `setStreamError({ convId, error: string })`.

### Limitations

1. No error taxonomy: all failures are just strings.
2. No stage context: cannot distinguish `connect` vs `hydrate` vs `stream` failure.
3. No transport metadata: missing HTTP status, WebSocket close codes, parse categories.
4. No sequence/order semantics under replay or repeated failures.
5. Difficult UI behavior: retry/diagnostic UX must parse message text heuristically.

### Why now

In Step 5 discussion, we flagged "error channeling strategy vs dedicated structured error state" as a review concern. This doc resolves that into an implementation-ready design.

## Proposed Solution

### 1) Introduce structured error record type

Add typed error shape in `chatSessionSlice`:

```ts
export type ChatErrorKind =
  | 'ws_error'
  | 'ws_close'
  | 'hydrate_error'
  | 'http_error'
  | 'sem_decode_error'
  | 'runtime_error'
  | 'unknown_error';

export type ChatErrorStage =
  | 'connect'
  | 'hydrate'
  | 'stream'
  | 'send'
  | 'disconnect'
  | 'unknown';

export interface ChatErrorRecord {
  id: string;               // deterministic or uuid-style
  kind: ChatErrorKind;
  stage: ChatErrorStage;
  message: string;          // user-facing summary
  source?: string;          // function/module label
  code?: string;            // symbolic code
  status?: number;          // HTTP status
  recoverable?: boolean;
  at: number;               // timestamp ms
  details?: Record<string, unknown>;
}
```

### 2) Extend session state

```ts
lastError: string | null;                // compatibility field (temporary)
currentError: ChatErrorRecord | null;    // canonical active error
errorHistory: ChatErrorRecord[];         // bounded ring (e.g. max 20)
```

### 3) Add reducer actions

1. `setError({ convId, error: ChatErrorRecord | null })`
2. `pushError({ convId, error: ChatErrorRecord })`
3. `clearError({ convId })`
4. optional compatibility action:
   - `setStreamError` delegates to `setError` with `kind='runtime_error'`

### 4) Map runtime producers to typed errors

Key mapping targets:

1. `packages/engine/src/chat/ws/wsManager.ts`
   - `onerror` -> `{ kind: 'ws_error', stage: 'stream' }`
   - hydrate fetch non-OK -> `{ kind: 'http_error', stage: 'hydrate', status }`
   - malformed frame/parse -> `{ kind: 'sem_decode_error', stage: 'stream' }`
2. `packages/engine/src/chat/runtime/conversationManager.ts`
   - connect/send failures -> `{ kind: 'runtime_error', stage: 'connect'|'send' }`
3. `packages/engine/src/chat/runtime/http.ts`
   - submit failures -> `{ kind: 'http_error', stage: 'send', status }`

### 5) Selector/API compatibility

Keep existing selector behavior:

1. `selectLastError(state, convId)` returns `currentError?.message ?? null`

Add new selectors:

1. `selectCurrentError(state, convId)`
2. `selectErrorHistory(state, convId)`
3. `selectHasRecoverableError(state, convId)`

## Design Decisions

### Decision 1: additive migration with compatibility shim

Keep `lastError` temporarily so current UI does not break while internals migrate.

### Decision 2: bounded history per conversation

Store recent errors in bounded list (e.g. 20) to support diagnostics without unbounded memory growth.

### Decision 3: explicit kind/stage enums

Use strict enums over arbitrary strings to keep telemetry/tests stable.

### Decision 4: reducer owns normalization

Normalize defaults (`recoverable`, `at`, fallback message) in reducer/prepare logic, not scattered across callsites.

## Alternatives Considered

### A) Keep single `lastError: string`

Rejected:

1. cannot support reliable stage-aware UX
2. poor diagnostics and test assertions
3. requires fragile string parsing for behavior

### B) Keep error strings + attach debug logs elsewhere

Rejected:

1. splits source of truth across unrelated systems
2. UI still lacks structured fields for user actions (retry/help)

### C) Add global error slice outside chat sessions

Rejected:

1. chat errors are conversation-scoped in this architecture
2. global slice reintroduces cross-conversation coupling

## Implementation Plan

### Phase E1: state + selector scaffolding

1. Extend `chatSessionSlice` with `ChatErrorRecord`, `currentError`, `errorHistory`
2. Add reducers (`setError`, `pushError`, `clearError`)
3. Add selectors for current/history/recoverable
4. Keep `selectLastError` compatibility

### Phase E2: runtime producer migration

1. Update `wsManager` callsites to dispatch typed errors
2. Update `conversationManager` and `useConversation` callsites
3. Update `http` failure handling to provide status/source

### Phase E3: UI + telemetry integration

1. Keep existing UI consuming string selector
2. (Optional) add structured error debug panel usage in `EventViewerWindow`
3. Add tests for mapping and stale clear behavior

### Phase E4: cleanup

1. Deprecate `setStreamError` and direct string error writes
2. Optionally remove `lastError` once all consumers use structured selectors

## Open Questions

1. Should `errorHistory` include duplicate suppression window (same `kind+code+message` within N seconds)?
2. Should recoverability be inferred by kind/stage defaults or always explicit at source?
3. Should we expose machine-stable `code` constants centrally?
4. Should structured errors also be mirrored into timeline entities for chat transcript audit?

## References

1. Runtime manager: `packages/engine/src/chat/runtime/conversationManager.ts`
2. Websocket runtime: `packages/engine/src/chat/ws/wsManager.ts`
3. Session state: `packages/engine/src/chat/state/chatSessionSlice.ts`
4. Selectors: `packages/engine/src/chat/state/selectors.ts`
5. Step 5 diary context: `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/01-diary.md`
