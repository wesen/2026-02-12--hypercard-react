---
Title: Storybook Cleanup and Navigation Reorganization
Ticket: HC-46-STORYBOOK-CLEANUP
Status: complete
Topics:
    - frontend
    - storybook
    - cleanup
    - ux
    - architecture
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Ticket workspace for Storybook cleanup, navigation reorganization, and package-aligned story taxonomy planning.
LastUpdated: 2026-02-17T15:23:30.183782312-05:00
WhatFor: Track Storybook cleanup and navigation reorganization so Storybook information architecture mirrors package and directory ownership.
WhenToUse: Use when planning or implementing Storybook structure cleanup, story taxonomy normalization, and story file reorganization.
---


# Storybook Cleanup and Navigation Reorganization

## Overview

This ticket executed Storybook cleanup and navigation reorganization so the Storybook tree now reflects monorepo ownership boundaries (`Apps/*` vs `Packages/*`) and feature-oriented file placement.

Scope implemented in this ticket:

- root-owned Storybook config and ordering policy
- hard-cut title taxonomy normalization
- app story file reorganization out of flat `src/stories`
- split of oversized story monoliths
- taxonomy/placement drift checks wired into test workflows
- maintainer documentation for ongoing Storybook hygiene

## Key Links

- Assessment and cleanup plan:
- `design-doc/01-storybook-cleanup-assessment-and-reorganization-plan.md`
- Diary:
- `reference/01-diary.md`
- Task tracker:
- `tasks.md`
- Changelog:
- `changelog.md`

## Status

Current status: **complete**

## Topics

- frontend
- storybook
- cleanup
- ux
- architecture

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
