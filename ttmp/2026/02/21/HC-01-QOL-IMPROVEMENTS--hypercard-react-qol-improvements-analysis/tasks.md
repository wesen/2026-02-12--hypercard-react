# Tasks

## Completed Setup

- [x] Create ticket `HC-01-QOL-IMPROVEMENTS`
- [x] Create design doc and diary docs
- [x] Gather evidence for all seven requested improvements
- [x] Write intern-ready implementation analysis with file-level references
- [x] Record chronological investigation diary entries
- [x] Relate key code files to ticket/docs with `docmgr doc relate`
- [x] Update ticket changelog with analysis details
- [x] Upload bundled docs to reMarkable and verify remote listing
- [x] Run `docmgr doctor` and resolve any blocking hygiene issues

## Global Implementation Workflow

- [ ] Implement issues one by one in the sequence below
- [ ] For each issue, add/adjust tests before finalizing
- [ ] For each issue, run targeted test command(s) and record results
- [ ] For each issue, check off issue tasks and append diary step
- [ ] For each issue, create focused commit with clear message
- [ ] After all issues, run broader regression test pass and final doctor check

## Issue 1: Event Viewer Scroll Should Not Snap Back While Reviewing History

### Implementation

- [x] Add user-scroll detection in `EventViewerWindow`
- [x] Introduce near-bottom threshold logic for follow mode
- [x] Auto-disable follow mode when user scrolls away from bottom
- [x] Preserve manual toggle to re-enable follow mode
- [x] Keep existing pause/filter behavior unchanged

### Tests

- [x] Add unit tests for follow-mode threshold helper logic
- [x] Verify no regression in existing debug/event tests

### Validation

- [x] Confirm new events do not force snap-to-bottom while user is scrolled up
- [x] Confirm re-enabling follow mode resumes auto-follow

### Docs and Commit

- [x] Update design/doc notes if behavior deviates from plan
- [x] Append detailed diary step for Issue 1
- [x] Commit Issue 1 implementation

## Issue 2: Copy Event Payload from Event Viewer

### Implementation

- [x] Add copy control(s) in expanded event payload area
- [x] Support copy of YAML payload (primary)
- [ ] Optional: support copy of JSON payload (secondary)
- [x] Add success/error feedback state in UI
- [x] Add clipboard fallback path if browser API unavailable

### Tests

- [x] Add tests for clipboard helper behavior
- [ ] Add tests for copied payload formatting (YAML/JSON)

### Validation

- [ ] Validate copy action in runtime UI
- [ ] Validate copy works for large payloads

### Docs and Commit

- [x] Append detailed diary step for Issue 2
- [ ] Check off Issue 2 tasks and commit

## Issue 3: Token Display Semantics (Header Totals + Footer Last Message)

### Implementation

- [ ] Add selector for conversation cached tokens
- [ ] Update header total semantics to include cached totals
- [ ] Keep footer focused on last-message/turn stats
- [ ] Ensure footer displays cache fields (`Cache`, `CacheWrite`, `CacheRead`) when present
- [ ] Confirm label semantics are still clear (`tok` / `total tok` decision)

### Tests

- [ ] Update selector tests for new total semantics
- [ ] Add/update footer rendering tests for cache fields

### Validation

- [ ] Confirm header total updates as cached deltas arrive
- [ ] Confirm footer reflects last-message cache usage

### Docs and Commit

- [ ] Append detailed diary step for Issue 3
- [ ] Check off Issue 3 tasks and commit

## Issue 4: Allow Multiple Windows for Same Top-Level Icon/Card

### Implementation

- [ ] Introduce open policy for card launch path (`dedupe` vs `open new`)
- [ ] Switch top-level icon/card opens to `open new`
- [ ] Preserve startup-home behavior (avoid duplicate startup windows)
- [ ] Ensure command routing remains backward-compatible

### Tests

- [ ] Add/update tests for repeated icon/card open behavior
- [ ] Keep reducer primitive dedupe tests passing

### Validation

- [ ] Confirm repeated opens create distinct window IDs/session IDs
- [ ] Confirm focus/close behavior remains correct with duplicates

### Docs and Commit

- [ ] Append detailed diary step for Issue 4
- [ ] Check off Issue 4 tasks and commit

## Issue 5: Remove Double Emojis in Window Titles

### Implementation

- [ ] Normalize app payload titles to text-only where icon is provided
- [ ] Add defensive titlebar rendering guard to avoid icon duplication
- [ ] Review other payload builders for same anti-pattern

### Tests

- [ ] Add titlebar test for icon/title dedupe behavior
- [ ] Verify no regressions in window surface rendering tests/stories

### Validation

- [ ] Confirm chat/event viewer/redux window titles show single icon prefix

### Docs and Commit

- [ ] Append detailed diary step for Issue 5
- [ ] Check off Issue 5 tasks and commit

## Issue 6: Show Buffered/Recent Events for Late-Opened Event Viewer

### Implementation

- [ ] Add retained per-conversation event history in event bus with bounded cap
- [ ] Ensure event history is recorded even with zero active listeners
- [ ] Add replay API (`getConversationEvents` and/or replay subscription option)
- [ ] Initialize viewer from retained history when opening late
- [ ] Decide and implement clear semantics (local-only vs shared history clear)

### Tests

- [ ] Add tests for replay-on-subscribe behavior
- [ ] Add tests for bounded-history pruning
- [ ] Add tests for clear-history behavior

### Validation

- [ ] Confirm late-open viewer shows prior events from active conversation
- [ ] Confirm memory remains bounded by cap

### Docs and Commit

- [ ] Append detailed diary step for Issue 6
- [ ] Check off Issue 6 tasks and commit

## Issue 7: Copy Conversation ID from Chat Header

### Implementation

- [ ] Add `Copy Conv ID` action in chat header actions
- [ ] Wire clipboard copy for full conversation ID
- [ ] Add short-lived success feedback state
- [ ] Provide tooltip/title for clarity

### Tests

- [ ] Add test for copy action payload (`convId`)

### Validation

- [ ] Confirm copy works from active chat window
- [ ] Confirm no header layout regressions

### Docs and Commit

- [ ] Append detailed diary step for Issue 7
- [ ] Check off Issue 7 tasks and commit

## Final Wrap-Up

- [ ] Re-run `docmgr doctor --ticket HC-01-QOL-IMPROVEMENTS --stale-after 30`
- [ ] Update changelog with implementation completion summary
- [ ] Upload updated implementation docs/diary bundle to reMarkable
- [ ] Mark ticket status according to project workflow
