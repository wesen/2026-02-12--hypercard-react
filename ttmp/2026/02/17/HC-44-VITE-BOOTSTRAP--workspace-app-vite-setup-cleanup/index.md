---
Title: Workspace/App Vite Setup Cleanup
Ticket: HC-44-VITE-BOOTSTRAP
Status: complete
Topics:
    - frontend
    - architecture
    - vite
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Proposal A implementation ticket to consolidate duplicated app-level Vite setup into a shared helper while preserving inventory-specific proxy behavior.
LastUpdated: 2026-02-17T14:27:00-05:00
WhatFor: Track implementation and closure of Vite/workspace bootstrapping cleanup.
WhenToUse: Use when continuing or reviewing Proposal A implementation work.
---


# Workspace/App Vite Setup Cleanup

## Overview

This ticket implements Proposal A from HC-43: consolidate repeated Vite config logic across apps into a shared helper and keep per-app overrides minimal and explicit.

## Scope

- Centralize repeated Vite app defaults (React plugin + engine alias)
- Keep inventory chat backend proxy behavior intact
- Refactor all app `vite.config.ts` files to use the shared helper
- Validate the refactor and document usage

## Key Links

- Design doc: `design-doc/01-proposal-a-implementation-workspace-app-bootstrapping-and-vite-cleanup.md`
- Diary: `reference/01-diary.md`
- Tasks: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **complete**
