---
Title: Debug logging playbook for React chat lifecycle
Ticket: OS-12-CHAT-DEBUG-LOGGING
Status: active
Topics:
    - chat
    - debugging
    - frontend
    - go-go-os
DocType: playbook
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/chat/runtime/useConversation.ts
      Note: Emits debug logs for effect lifecycle and send path.
    - Path: packages/engine/src/chat/debug/debugChannels.ts
      Note: Defines debug channel bootstrap and browser global controller.
    - Path: packages/engine/src/chat/runtime/conversationManager.ts
      Note: Useful companion trace point when lifecycle cleanup triggers disconnect scheduling.
ExternalSources: []
Summary: How to enable and use npm debug channel logging for chat lifecycle, effects, and websocket reconnect behavior.
LastUpdated: 2026-02-25T12:52:40.927430132-05:00
WhatFor: Provide a repeatable runbook for diagnosing chat effect cleanup and reconnect triggers.
WhenToUse: Use this when chat appears to reconnect unexpectedly or pending-state logic seems stuck.
---

# Debug logging playbook for React chat lifecycle

## Purpose

Enable and use namespace-based debug logs to identify what causes `useConversation` effect cleanup and reconnect behavior.

## Environment Assumptions

- You are running a browser build of go-go-os where `@hypercard/engine` chat code is loaded.
- Browser devtools console is available.
- No debug channels are enabled by default.

## Commands

Enable channels from browser console:

```js
// Narrow trace for the hook lifecycle and sends
localStorage.debug = 'chat:useConversation:*';
location.reload();
```

Alternative (global helper):

```js
window.__HC_DEBUG__.enable('chat:useConversation:*');
```

Inspect currently enabled pattern:

```js
window.__HC_DEBUG__.current();
```

Disable logging:

```js
window.__HC_DEBUG__.disable();
localStorage.removeItem('debug');
```

## Exit Criteria

- Console shows `chat:useConversation:lifecycle` lines for:
  - effect start
  - connect success/failure
  - effect cleanup
- Effect start logs include `changes` showing which dependency keys changed between runs.
- You can correlate unexpected cleanup events with dependency diffs.

## Notes

- Suggested channels:
  - `chat:useConversation:*` for hook-only tracing
  - `chat:*` for broader chat namespace traces
- If logs are too noisy, scope to lifecycle only:
  - `localStorage.debug = 'chat:useConversation:lifecycle'`
