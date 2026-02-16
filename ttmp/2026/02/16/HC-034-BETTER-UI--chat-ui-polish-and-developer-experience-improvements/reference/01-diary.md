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

## Session 2 — F3 Implementation (2026-02-16 ~15:00–17:10)

### F3: Multiple chat windows — keyed Redux store

Implemented the full keyed-conversation refactor in a single pass:

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

---

### F7: Streaming Event Viewer (~17:00–17:12)

Implemented the complete event viewer as a standalone window component.

#### eventBus.ts
- Simple per-conversation pub/sub: `emitConversationEvent(convId, envelope)` and `subscribeConversationEvents(convId, callback)`
- Uses `Map<string, Set<Listener>>` internally, auto-cleans on last unsubscribe
- Classifies events into families (llm/tool/hypercard/timeline/ws/other)
- Generates one-line summaries per event type
- Re-uses `SemEventEnvelope` type from webchatClient (avoided duplicate type definition causing TS index signature mismatch)

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

## Summary of all features completed

| Feature | Status | Tests | Stories |
|---------|--------|-------|---------|
| F5: Text selection | ✅ | — | Verified in existing |
| F2: Collapsible tool calls + YAML | ✅ | 8 (yamlFormat) | 6 |
| F4: Model info + token counts + TPS | ✅ | — | 5 |
| F1: Per-round timeline widgets | ✅ | 3 new + 11 updated | 4 |
| F6: Debug mode toggle | ✅ | — | 2 |
| F3: Multi-window keyed Redux store | ✅ | 15 updated + 1 new | — |
| F7: Streaming event viewer | ✅ | 4 (eventBus) | 4 |
| **Total** | **7/7 ✅** | **140** | **21** |
