---
Title: Diary
Ticket: HC-034-BETTER-UI
Status: active
Topics:
  - chat
  - frontend
  - ux
  - debugging
  - storybook
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
  - Path: ttmp/2026/02/16/HC-034-BETTER-UI--chat-ui-polish-and-developer-experience-improvements/design-doc/01-feature-analysis-and-implementation-plan.md
    Note: Primary analysis document produced in Step 1
  - Path: ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/03-hc032-hc033-consolidated-technical-postmortem-and-continuation-guide.md
    Note: HC-032/HC-033 postmortem used as source context
  - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
    Note: Primary chat window component analyzed
  - Path: apps/inventory/src/features/chat/chatSlice.ts
    Note: Redux state slice analyzed for refactoring needs
  - Path: packages/engine/src/components/widgets/ChatWindow.tsx
    Note: Reusable ChatWindow analyzed for extension points
  - Path: packages/engine/src/theme/base.css
    Note: Theme CSS analyzed for user-select issues
Summary: >
  Step-by-step diary for HC-034 analysis and implementation. Documents what was
  read, what was discovered, and decisions made during feature analysis.
LastUpdated: 2026-02-16T15:58:00-05:00
WhatFor: Preserve analysis trace and implementation narrative.
WhenToUse: Review when continuing HC-034 implementation or understanding analysis rationale.
---

# Diary

## Goal

Analyze seven UI/DX improvement features for the inventory webchat, produce a
comprehensive implementation plan with ASCII mockups and storybook story lists,
and store it in the HC-034 ticket.

## Step 1: Context Gathering and Analysis

### Prompt Context

**User prompt (verbatim):** Create a new ticket HC-034-BETTER-UI with docmgr for a list of seven chat UI improvements, then create a document analyzing how each will be built with codebase mapping, ASCII mockups, and storybook story lists.

**Assistant interpretation:** Create ticket, deeply analyze existing code to understand impact of each feature, and produce a thorough implementation guide.

**Inferred user intent:** Have a complete, actionable analysis before starting implementation, so each feature can be built efficiently with full context.

### What I did

1. **Read HC-033 and HC-032 history:**
   - Read the full HC-033 consolidated postmortem (design-doc/03) to understand the architecture built across both tickets.
   - Read the complete HC-033 diary (all 23 steps) to understand implementation details, problems encountered, and current code structure.

2. **Examined the current codebase in detail:**
   - `apps/inventory/src/features/chat/` — all 14 files: InventoryChatWindow.tsx, chatSlice.ts, webchatClient.ts, InventoryTimelineWidget.tsx, InventoryArtifactPanelWidgets.tsx, timelineProjection.ts, artifactRuntime.ts, artifactsSlice.ts, selectors.ts, and their tests.
   - `packages/engine/src/components/widgets/ChatWindow.tsx` — the reusable chat component (props, rendering logic, widget host).
   - `packages/engine/src/components/shell/windowing/DesktopShell.tsx` — desktop shell (menu generation, icon layer, command handling, app window rendering).
   - `packages/engine/src/features/windowing/` — windowing types and slice (OpenWindowPayload, dedupeKey, window lifecycle).
   - `packages/engine/src/theme/base.css` — all five `user-select: none` declarations and their contexts.
   - `apps/inventory/src/App.tsx` — current single-chat-window setup.
   - `apps/inventory/src/domain/stack.ts` — card stack definitions.
   - `apps/inventory/src/stories/` — existing storybook stories.

3. **Traced the SEM metadata path end-to-end:**
   - Read `pinocchio/pkg/webchat/sem_translator.go` to understand what metadata is already emitted on `llm.start`, `llm.delta`, and `llm.final` frames.
   - Read `buildLlmInferenceMetadata()` to confirm it populates: `model`, `temperature`, `topP`, `maxTokens`, `stopReason`, `usage` (inputTokens, outputTokens, cachedTokens, cacheCreationInputTokens, cacheReadInputTokens), and `durationMs`.
   - Confirmed the frontend completely ignores `envelope.event.metadata` today — it only reads `envelope.event.type` and `envelope.event.data`.

4. **Created ticket and wrote analysis:**
   - Created HC-034-BETTER-UI with docmgr.
   - Added vocabulary entries for `debugging`, `ux`, `storybook` topics.
   - Wrote a comprehensive 44KB analysis document covering all seven features.

### Key findings per feature

#### F1: Per-round widgets
- Current code uses three global widget message IDs (`timeline-widget-message`, `card-panel-widget-message`, `widget-panel-widget-message`) created once via `ensureTimelineWidgetMessage()` etc.
- The fix is straightforward: parameterize IDs by a `currentRoundId` counter incremented on `queueUserPrompt`.
- Hydration needs a "Previous Session" approach since server-side entities don't carry round markers.

#### F2: Collapsed tool calls with YAML
- Tool details are currently formatted via `compactJSON()` and stored as flat strings in `detail`.
- Need to add a `rawData` field to `TimelineWidgetItem` to preserve structured data for YAML rendering.
- A lightweight YAML formatter utility is needed (no external dependency for display-only rendering).

#### F3: Multiple chat windows
- `App.tsx` opens exactly one window with hardcoded `CHAT_WINDOW_ID` and `CHAT_APP_KEY`.
- `chatSlice.ts` is a global Redux slice — not suitable for multiple independent conversations.
- Best approach: extract reducer logic into a pure function, use `useReducer` in each chat window instance.
- `DesktopShell` already supports multiple app windows via `openWindow` + `renderAppWindow`.
- Conversation ID currently persisted in `localStorage` (`inventory.webchat.conv_id`) — needs to be per-window.

#### F4: Model/token stats
- **Critical finding:** The data is already there! `pinocchio/pkg/webchat/sem_translator.go` attaches a `metadata` field to every `llm.*` SEM envelope with model name, usage stats, and duration.
- The frontend just needs to parse `envelope.event?.metadata` and display it.
- TPS can be computed as `outputTokens / (durationMs / 1000)`.

#### F5: Copy/paste
- Root cause identified: `[data-part="windowing-desktop-shell"]` sets `user-select: none` at line 162 of `base.css`, cascading to all children.
- Fix is a single CSS rule: `[data-part="chat-timeline"] { user-select: text; }`.

#### F6: Debug mode
- `ChatWindow` has no `headerActions` prop — needs adding.
- `InventoryTimelineWidget` and `InventoryArtifactPanelWidgets` don't accept a `debug` prop — needs adding.
- The debug metadata rendering reuses the same YAML formatter from F2.

#### F7: Event viewer
- Largest feature. Needs a new component, new state, and a conversation event bus.
- The event bus approach (simple Map of Set of callbacks) avoids coupling to Redux while allowing the chat window and event viewer to share the raw event stream.
- The event viewer can be opened as an app window (same pattern as chat windows) with dedupeKey per conversation.

### What worked

- The HC-033 postmortem and diary were extremely thorough, which made codebase navigation efficient.
- The pinocchio `sem_translator.go` inspection confirmed metadata is already available — F4 is purely a frontend parsing exercise.
- All existing widget/panel/timeline code is well-structured with clear separation of concerns.

### What was tricky

- Understanding the `user-select: none` cascade required checking all five occurrences in `base.css` to confirm which ones affect chat content vs. UI chrome.
- For F3 (multi-window), deciding between Redux-per-conversation vs. useReducer required understanding that the current chatSlice is tightly global (single `conversationId`, single `messages` array) — making useReducer the cleaner approach.

### What warrants a second pair of eyes

- F3 state architecture choice: `useReducer` per window is cleaner but means chat state is not in the global Redux store. If other parts of the app need to observe chat state (e.g., notifications, badges), a keyed Redux approach may be better.
- F7 event bus: ensure memory cleanup when conversations are closed to avoid leaks.

### What should be done next

- Implement features in recommended order: F5 → F2 → F4 → F1 → F6 → F3 → F7.
- F5 can be done immediately as a 5-minute CSS fix.

### Code review instructions

- Read the analysis document:
  - `ttmp/2026/02/16/HC-034-BETTER-UI--chat-ui-polish-and-developer-experience-improvements/design-doc/01-feature-analysis-and-implementation-plan.md`
- Cross-reference with current code:
  - `apps/inventory/src/features/chat/chatSlice.ts` (for F1 round tracking, F4 metadata state)
  - `packages/engine/src/theme/base.css` (for F5 user-select)
  - `apps/inventory/src/App.tsx` (for F3 multi-window)

### Technical details

- Analysis document: 44KB, covers 7 features with codebase mapping, implementation plans, ASCII mockups, and 30+ storybook story definitions.
- Recommended implementation order based on dependency analysis: F5 → F2 → F4 → F1 → F6 → F3 → F7.

## Step 2: Lock F3 Architecture Decision — Keyed Redux Store

### Prompt Context

**User prompt (verbatim):** "for F3, can we keep the conversations keyed by conversation id in the global redux store?"

**Assistant interpretation:** Use a `Record<string, ConversationState>` in the global Redux store instead of per-window `useReducer`.

**Inferred user intent:** Preserve global observability and centralized state management for multi-conversation support.

### What I did

- Updated F3 section in the analysis document:
  - Replaced `useReducer` approach with keyed Redux store design.
  - Added `ConversationState` type definition and `getConv()` helper pattern.
  - Added `conversationId` to all action payloads and selector signatures.
  - Added `removeConversation` cleanup action for window close.
  - Documented four benefits of the keyed approach (DevTools, cross-window observation, persistence, test consistency).
- Updated task list from 7 tasks to 11 tasks to reflect the more granular Redux refactoring steps.

### Why the keyed Redux approach is better here

1. **Redux DevTools** show all conversation states simultaneously.
2. **Cross-window observation** is trivial — a conversation list sidebar, streaming badges on desktop icons, or an "N active streams" indicator can read any conversation's state via standard selectors.
3. **Centralized persistence** — snapshotting or restoring all conversations works through the existing Redux store serialization path.
4. **Test continuity** — existing reducer tests adapt by adding `conversationId` to payloads rather than rewriting test infrastructure for `useReducer`.

### Decision locked

- F3 architecture: **keyed Redux store** (`conversations: Record<string, ConversationState>`).

---

## Session 2 — Feature Implementation (2026-02-16 ~15:00 onward)

### F5: Text Selection (first thing, ~1 min)

Added `user-select: text` override on `[data-part="chat-timeline"]` in `packages/engine/src/theme/base.css` (around line 688). Kept `user-select: none` on chrome elements (header, composer, suggestions, footer) so only the actual chat content is selectable. Verified in existing storybook stories. Committed.

### F2: Collapsible Tool Calls with YAML (~15:05–15:25)

**yamlFormat.ts** — Wrote a dependency-free JSON-to-YAML formatter. Handles nested objects, arrays of objects, scalar quoting for ambiguous strings (`"true"`, `"null"`, strings with colons), and configurable indent depth. 8 tests covering scalars, nested objects, arrays, empty containers, indent levels.

**rawData field** — Added `rawData?: Record<string, unknown>` to `TimelineWidgetItem`. Updated `onSemEnvelope` to store structured data: `tool.start` stores `{ name, input }`, `tool.result` stores `{ result }`, `tool.delta` stores `{ patch }`.

**Timeline widget UI** — Added expand/collapse toggle (▶/▼) in `InventoryTimelineWidget`. When collapsed shows the one-line `detail` string; when expanded renders `rawData` as YAML in a `<pre>` block. Only tool items with rawData get the toggle arrow.

6 storybook stories: Default (mixed items), Empty, AllCollapsed, MixedItems, LargePayload (deep nested report), DebugMode. Committed.

### F4: Model Info + Token Counts + TPS (~15:25–15:40)

**State additions** — `modelName: string | null`, `currentTurnStats: TurnStats | null`, `streamStartTime: number | null`, `streamOutputTokens: number` added to `ChatState`.

**Metadata parsing** — In `onSemEnvelope`, added `extractMetadata(envelope)` that reads `envelope.event?.metadata`. On `llm.start`: extract model name, mark stream start time. On `llm.delta`: extract `usage.outputTokens` for live TPS. On `llm.final`: extract full usage stats + durationMs, compute TPS.

**StatsFooter component** — Shows model name, input/output/cached tokens, duration, and TPS in a compact single-line footer. During streaming shows live TPS from elapsed time and output tokens. Renders in the ChatWindow `footer` prop.

5 storybook stories: Idle, Streaming, Complete, HighTokens, NoModel. Committed.

### F1: Per-Round Timeline Widgets (~15:40–15:55)

Added `currentRoundId: number` to `ChatState`. Incremented on `queueUserPrompt`. Widget message IDs parameterized by round: `timeline-widget-message-r0`, `timeline-widget-message-r1`, etc. Round 0 is for hydrated items (labeled "Previous Session"), rounds 1+ for live turns.

3 new tests: separate-round widgets, round-0 hydration, no-empty-round-widget. Updated all 11 existing tests for the new `r0`/`r1` ID pattern. 4 storybook stories: SingleRound, TwoRounds, HydrationRound0, EmptyRound. Committed.

### F6: Debug Mode Toggle (~15:55–16:05)

**Engine change** — Added `headerActions?: ReactNode` prop to `ChatWindow` in `packages/engine/src/components/widgets/ChatWindow.tsx`. Renders in the chat header bar after the subtitle.

**Debug toggle** — `useState(false)` in `InventoryChatWindow`. Button in `headerActions` toggles debug on/off. When on:
- Message badges: `[msg-id | status | role]` prepended as text content
- Timeline widget: shows metadata `<pre>` block (id, kind, template, artifactId, updatedAt)
- Artifact panels: same metadata `<pre>` block

2 storybook stories: DebugMode for timeline, DebugMode for artifact panels. Committed.

### F3: Multiple Chat Windows — Keyed Redux Store (~16:05–17:10)

Implemented the full keyed-conversation refactor in a single pass.

#### chatSlice.ts
- Renamed old `ChatState` → `ConversationState` (per-conversation state)
- New top-level `ChatState` is `{ conversations: Record<string, ConversationState> }`
- Added `getConv(state, convId)` helper that auto-creates conversation entries on first access
- Every action payload now uses `WithConv<T>` pattern to include `conversationId`
- Added `removeConversation` action for cleanup
- Exported `ConversationState` type for consumers

#### selectors.ts
- All selectors now take `(state, convId)` instead of `(state)`
- Return sensible defaults (empty arrays, null, false) when conversation doesn't exist
- Added `selectConversationIds` for future conversation list UI

#### InventoryChatWindow.tsx
- Accepts `conversationId: string` prop (no more `useSelector(selectConversationId)`)
- All `useSelector` calls pass `conversationId` via inline selector closures
- All dispatch calls include `conversationId` in payloads
- Removed `setConversationId` and `getOrCreateConversationId` usage
- `onSemEnvelope`, `hydrateEntity`, `hydrateFromTimelineSnapshot`, `fanOutArtifactPanelUpdate` all take `conversationId` parameter
- Subtitle now shows truncated conversation ID (`${convId.slice(0,8)}…`)

#### App.tsx
- Complete rewrite for multi-window support
- `openNewChatWindow()` creates fresh conversation ID via `crypto.randomUUID()`
- Mounts on initial load to open first chat window
- `renderAppWindow` matches `inventory-chat:{convId}` appKey pattern
- Desktop icon "New Chat" (💬) and File > New Chat menu entry
- `onCommand` callback handles `chat.new` and `icon.open.new-chat`

#### DesktopShell.tsx (engine)
- Added `onCommand?: (commandId: string) => void` prop to `DesktopShellProps`
- `handleCommand` falls through to `onCommandProp` for unrecognized commands
- `handleOpenIcon` delegates unknown icon IDs to `onCommandProp` as `icon.open.{id}`

#### Tests
- All 14 existing tests updated with `conversationId: C` in payloads
- New isolation test verifies two conversations don't bleed state
- 136 tests pass, both packages type-check clean

#### What went well
- The `WithConv<T>` pattern made the payload changes mechanical
- `getConv()` auto-creation means no explicit "init conversation" action needed
- Hard cutover: no transitional code, no backward-compat shims

#### What was tricky
- TypeScript project references required rebuilding engine declarations (`tsc -b packages/engine`) before inventory would see the new `onCommand` prop
- 31 dispatch calls in InventoryChatWindow needed `conversationId` injection — systematic search-and-replace was the only way

### F7: Streaming Event Viewer (~17:00–17:12)

Implemented the complete event viewer as a standalone window component.

#### eventBus.ts
- Simple per-conversation pub/sub: `emitConversationEvent(convId, envelope)` and `subscribeConversationEvents(convId, callback)`
- Uses `Map<string, Set<Listener>>` internally, auto-cleans on last unsubscribe
- Classifies events into families (llm/tool/hypercard/timeline/ws/other)
- Generates one-line summaries per event type
- Re-uses `SemEventEnvelope` type from webchatClient (avoided duplicate type definition causing TS index signature mismatch — initially defined our own `SemEventEnvelope` with `[key: string]: unknown` index sig, but TS refused to assign `webchatClient.SemEventEnvelope` to it)

#### EventViewerWindow.tsx
- Filter toggle bar with color-coded family buttons (6 families)
- Each event row: timestamp | type (colored) | ID | summary | expand arrow
- Expand reveals full envelope as YAML (reuses `toYaml` from F2)
- Pause/Resume, Clear, Auto-scroll (📌 Pinned/Free) controls
- Ring buffer capped at 500 entries
- Accepts `initialEntries` prop for storybook testing
- Hover highlight on rows, monospace font throughout

#### Wiring
- InventoryChatWindow: `emitConversationEvent()` called in WS `onEnvelope` handler, before `onSemEnvelope()`
- New "📡 Events" button in header actions alongside debug toggle
- App.tsx: `event-viewer:{convId}` appKey pattern registered in `renderAppWindow`
- Deduped via `dedupeKey: event-viewer:{convId}` so only one viewer per conversation

#### Tests
- 4 eventBus tests: delivery, conversation isolation, unsubscribe cleanup, family classification
- 4 storybook stories: Empty, MixedEvents (10+ events with realistic payloads), HighVolume (200 events), ColorCoded (one of each family)
- 140 total tests pass

---

## Live-testing Bugfixes (2026-02-16 ~17:15–17:30)

### Duplicate user messages

**Bug:** Every user message appeared twice in the chat — once from local `queueUserPrompt` (id `user-3`) and once from backend timeline echo (id `user-376f8b7b-...`). Visible clearly with debug mode badges showing both IDs.

**Root cause:** Backend echoes user messages back via `timeline.upsert` with a server-assigned UUID. `upsertHydratedMessage` couldn't match them to existing local messages because the IDs differ.

**Fix:** In `upsertHydratedMessage`, after checking for exact ID match, added a second check: if a message with the same `role` and `text` already exists (different ID), adopt the server ID on the existing message instead of creating a duplicate. This handles the backend-echo pattern cleanly.

**Test added:** `deduplicates backend-echoed user messages by adopting server ID` — dispatches `queueUserPrompt` then `upsertHydratedMessage` with same text/different ID, verifies only one message exists with the server UUID. 141 tests pass.

### Scroll bump on window focus

**Bug (first report):** Focusing a chat window caused a visible smooth scroll animation bump. Both chat and event viewer windows affected — switching between them made both scroll.

**Root cause:** `ChatWindow` had `useEffect(() => endRef.scrollIntoView({ behavior: 'smooth' }), [messages])`. When focusing a window, Redux `useSelector` re-evaluates, the `messages` array reference can change (even if content is identical), triggering the effect.

**First fix attempt:** Changed `behavior: 'smooth'` → `'instant'` and added a `scrollKey` fingerprint (`useMemo` from message count + last message id/length/status) to avoid firing on reference-only changes. Also fixed EventViewerWindow: changed to `useLayoutEffect` with `behavior: 'instant'` and `entryCount` as dep.

**Status:** User reported scroll bump still present after first fix — continuing to investigate.

---

## UI Polish Pass (2026-02-16 ~17:25–ongoing)

### Nicer artifact/timeline widget templates

**Problem:** Timeline and artifact panel widgets used plain text `ERR`/`OK`/`...` status indicators, wide 40px status columns, and debug metadata was a cramped `<pre>` block with hardcoded text like `id: ...\nkind: ...\ntemplate: —\nartifactId: —`.

**Fix — Status glyphs:** Replaced text with Unicode glyphs: `✗` (error), `✓` (success), `⏳` (running), `ℹ` (info). Narrowed status column from 40px to 24px.

**Fix — Metadata table:** Replaced the `<pre>` debug block with a proper `<table>` using `<th>`/`<td>` pairs for id, kind, status, template, artifactId, updatedAt. Clean alignment, muted colors. When rawData exists, renders it below the table as YAML in a `<pre>` block.

**Fix — Auto-show on errors:** Metadata table + rawData YAML now shown automatically when `item.status === 'error'`, even without debug mode. Debug mode shows it on all items.

**Fix — Consistent styling:** Both `InventoryTimelineWidget` and `InventoryArtifactPanelWidgets` now share identical layout metrics (24px grid, 2px gap, 6px padding, same chip/table styles). Extracted identical `MetadataTable` component in both files.

### rawData for widget/card lifecycle events

**Problem:** `formatHypercardLifecycle` and `formatTimelineUpsert` never passed `rawData` through, so widget/card items had no expandable data to show in debug mode or on errors. The user saw the metadata table but no actual payload.

**Fix:** Added `rawData: data` to all return paths in `formatHypercardLifecycle` (widget.start, widget.update, widget.v1, widget.error, card.start, card.update, card_proposal.v1). Added `rawData` field to `TimelineItemUpdate` interface in `timelineProjection.ts` and populated it in all `formatTimelineUpsert` return paths:
- `tool_call`: `{ name, input, output }`
- `status`: full entity record
- `tool_result` (widget/card): the parsed `resultRecord` or entity fallback
- `tool_result` (generic): the `toolResult` record

**New story:** `ErrorAutoShowsMeta` — shows widget panel with error item (including rawData with error details) without debug mode enabled. The metadata table + YAML appear automatically.

### Scroll bump (continued)

**Second fix attempt:** EventViewerWindow changed from `useEffect` to `useLayoutEffect` to avoid paint-then-scroll flicker. Changed dep from `entries` array to `entryCount` (primitive number) so window focus re-renders can't trigger it. Both ChatWindow and EventViewerWindow now use `behavior: 'instant'` — the smooth animation was the visible "bump".

---

## Feature completion summary

| Feature | Status | Tests | Stories | Commits |
|---------|--------|-------|---------|---------|
| F5: Text selection | ✅ | — | Verified | 1 |
| F2: Collapsible tool calls + YAML | ✅ | 8 | 6 | 1 |
| F4: Model info + token counts + TPS | ✅ | — | 5 | 1 |
| F1: Per-round timeline widgets | ✅ | 3+11 | 4 | 1 |
| F6: Debug mode toggle | ✅ | — | 2 | 1 |
| F3: Multi-window keyed Redux store | ✅ | 15+1 | — | 1 |
| F7: Streaming event viewer | ✅ | 4 | 4 | 1 |
| Bugfix: duplicate user messages | ✅ | 1 | — | 1 |
| Polish: nicer widgets + rawData + scroll | ✅ | — | 1 | 1+ |
| **Total** | | **141+** | **22+** | |
