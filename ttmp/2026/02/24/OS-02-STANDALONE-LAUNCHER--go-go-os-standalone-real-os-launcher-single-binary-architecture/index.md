---
Title: go-go-os standalone real OS launcher single-binary architecture
Ticket: OS-02-STANDALONE-LAUNCHER
Status: active
Topics:
    - go-go-os
    - frontend
    - backend
    - architecture
    - launcher
    - desktop
    - binary
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Evidence-backed investigation and target design for a single-binary go-go-os launcher that exposes all current apps as launchable desktop icons with optional per-app backend modules.
LastUpdated: 2026-02-24T10:44:13.82903593-05:00
WhatFor: Use this ticket as the canonical design package for moving go-go-os from app-by-app boot to a composable OS launcher runtime with a single Go binary.
WhenToUse: Use when implementing launcher runtime contracts, app manifests, backend module composition, single-binary embedding, or rollout/testing plans for OS-02.
---

# go-go-os standalone real OS launcher single-binary architecture

## Overview

This ticket documents the design investigation for introducing a standalone "OS launcher" runtime in go-go-os where:

1. one binary launches the desktop shell,
2. each existing app is represented as launchable desktop icon(s),
3. opening an icon instantiates an app window via a composable app module contract,
4. apps can optionally provide backend components that are composed into the same server binary.

## Key Links

- Design doc: `design-doc/01-standalone-go-go-os-launcher-architecture-and-composable-app-runtime.md`
- Investigation diary: `reference/01-investigation-diary.md`
- Tasks: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **active**

## Topics

- go-go-os
- frontend
- backend
- architecture
- launcher
- desktop
- binary

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
