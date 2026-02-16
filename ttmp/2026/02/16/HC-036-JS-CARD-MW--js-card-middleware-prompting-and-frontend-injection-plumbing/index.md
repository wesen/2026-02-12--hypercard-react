---
Title: JS Card Middleware Prompting and Frontend Injection Plumbing
Ticket: HC-036-JS-CARD-MW
Status: active
Topics:
    - backend
    - frontend
    - dsl
    - chat
    - storybook
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Hard-cutover implementation guide for runtime JS card generation/injection, including explicit deprecation removal and consolidated DSL spec."
LastUpdated: 2026-02-16T17:53:08.093537151-05:00
WhatFor: "Provide an intern-ready map of files, symbols, and phased changes for runtime card generation and injection."
WhenToUse: "Use when implementing JS card proposals from chat output and connecting them to live QuickJS runtime sessions."
---

# JS Card Middleware Prompting and Frontend Injection Plumbing

## Overview

This ticket captures hard-cutover implementation instructions for replacing template card proposals with runtime JS cards and live session injection, including deprecated-path removal.

## Key Links

- `design-doc/01-js-card-middleware-and-frontend-injection-implementation-guide-with-dsl-spec.md`:
  - preserved middleware instructions
  - frontend injection plumbing instructions
  - consolidated DSL/runtime spec with examples

## Status

Current status: **active**

## Topics

- backend
- frontend
- dsl
- chat
- storybook

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
