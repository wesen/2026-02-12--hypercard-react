---
Title: Chat lifecycle debugging with npm debug channels
Ticket: OS-12-CHAT-DEBUG-LOGGING
Status: active
Topics:
    - chat
    - debugging
    - frontend
    - go-go-os
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/chat/runtime/useConversation.ts
      Note: Primary hook instrumentation for lifecycle start and cleanup logs.
    - Path: packages/engine/src/chat/debug/debugChannels.ts
      Note: Shared debug logger factory and browser global helpers.
    - Path: packages/engine/package.json
      Note: Adds npm debug runtime dependency used by chat instrumentation.
ExternalSources: []
Summary: Add npm debug channel instrumentation for chat effect lifecycle tracing and document a reusable debugging playbook.
LastUpdated: 2026-02-25T12:52:28.729713479-05:00
WhatFor: Track and debug chat effect cleanup/reconnect causes with low-noise namespace logging.
WhenToUse: Use when diagnosing unintended disconnects, reconnect churn, or profile/dependency-driven chat remount behavior.
---

# Chat lifecycle debugging with npm debug channels

## Overview

This ticket adds namespace-based debug logging using the `debug` npm package for chat lifecycle troubleshooting and captures a project playbook for enabling and interpreting those logs.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- chat
- debugging
- frontend
- go-go-os

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
