import { formatAppKey, parseAppKey, type LaunchReason, type LauncherHostContext } from '@hypercard/desktop-os';
import {
  ChatConversationWindow,
  CodeEditorWindow,
  ensureChatModulesRegistered,
  EventViewerWindow,
  getEditorInitialCode,
  registerChatRuntimeModule,
  registerHypercardTimelineModule,
  RuntimeCardDebugWindow,
  showToast,
  TimelineDebugWindow,
  chatProfilesSlice,
} from '@hypercard/engine';
import { openWindow, type OpenWindowPayload, type WindowInstance } from '@hypercard/engine/desktop-core';
import { PluginCardSessionHost } from '@hypercard/engine/desktop-hypercard-adapter';
import {
  DesktopIconLayer,
  type DesktopActionEntry,
  type DesktopActionSection,
  type DesktopCommandInvocation,
  type DesktopCommandHandler,
  type DesktopContribution,
  type DesktopIconDef,
  type WindowContentAdapter,
  useRegisterWindowContextActions,
  useRegisterWindowMenuSections,
} from '@hypercard/engine/desktop-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { STACK } from '../domain/stack';
import { ReduxPerfWindow } from '../features/debug/ReduxPerfWindow';

const INVENTORY_APP_ID = 'inventory';
export const INVENTORY_API_BASE_PREFIX_FALLBACK = '/api/apps/inventory';
const CHAT_INSTANCE_PREFIX = 'chat-';
const EVENT_VIEW_INSTANCE_PREFIX = 'event-viewer-';
const TIMELINE_DEBUG_INSTANCE_PREFIX = 'timeline-debug-';
const CODE_EDITOR_INSTANCE_PREFIX = 'code-editor-';
const RUNTIME_DEBUG_INSTANCE = 'runtime-debug';
const REDUX_PERF_INSTANCE = 'redux-perf';
const FOLDER_INSTANCE = 'folder';
const CHAT_COMMAND_PREFIX = 'inventory.chat.';
const PROFILE_SELECT_TOKEN = '.profile.select.';

interface InventoryChatCommand {
  kind:
    | 'debug-event-viewer'
    | 'debug-timeline'
    | 'profile-select'
    | 'conversation-change-profile'
    | 'conversation-replay-last-turn'
    | 'conversation-open-timeline'
    | 'conversation-export-transcript';
  convId: string;
  profile?: string | null;
}

interface MessageContextPayload {
  conversationId: string;
  messageId: string;
  content?: string;
}

interface InventoryRootState {
  chatProfiles?: {
    availableProfiles?: Array<{ slug: string; display_name?: string; is_default?: boolean }>;
    selectedProfile?: string | null;
    selectedRegistry?: string | null;
    selectedByScope?: Record<string, { profile: string | null; registry: string | null }>;
  };
}

registerChatRuntimeModule({
  id: 'chat.hypercard-timeline',
  register: registerHypercardTimelineModule,
});
ensureChatModulesRegistered();

function nextInstanceId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}${Date.now()}`;
}

function buildInventoryAppWindowPayload(
  instanceId: string,
  title: string,
  icon: string,
  bounds: OpenWindowPayload['bounds'],
  dedupeKey?: string,
): OpenWindowPayload {
  return {
    id: `window:inventory:${instanceId}`,
    title,
    icon,
    bounds,
    content: {
      kind: 'app',
      appKey: formatAppKey(INVENTORY_APP_ID, instanceId),
    },
    dedupeKey,
  };
}

function buildInventoryCardWindowPayload(cardId: string, options?: { dedupe?: boolean }): OpenWindowPayload {
  const card = STACK.cards[cardId];
  const sessionId = nextInstanceId(`inv-card-${cardId}-`);
  return {
    id: `window:inventory:card:${cardId}:${sessionId}`,
    title: card?.title ?? cardId,
    icon: card?.icon ?? '📄',
    bounds: {
      x: 180 + Math.round(Math.random() * 60),
      y: 40 + Math.round(Math.random() * 40),
      w: 820,
      h: 620,
    },
    content: {
      kind: 'card',
      card: {
        stackId: STACK.id,
        cardId,
        cardSessionId: sessionId,
      },
    },
    dedupeKey: options?.dedupe ? `inventory-card:${cardId}` : undefined,
  };
}

function buildChatWindowPayload(options?: { dedupeKey?: string }): OpenWindowPayload {
  const instanceId = nextInstanceId(CHAT_INSTANCE_PREFIX);
  return buildInventoryAppWindowPayload(instanceId, 'Inventory Chat', '💬', { x: 340, y: 20, w: 560, h: 460 }, options?.dedupeKey);
}

function buildEventViewerWindowPayload(convId: string): OpenWindowPayload {
  const shortId = convId.slice(0, 8);
  return buildInventoryAppWindowPayload(
    `${EVENT_VIEW_INSTANCE_PREFIX}${convId}`,
    `Event Viewer (${shortId})`,
    '🧭',
    { x: 780, y: 40, w: 560, h: 420 },
    `inventory-event-viewer:${convId}`,
  );
}

function buildTimelineDebugWindowPayload(convId: string): OpenWindowPayload {
  const shortId = convId.slice(0, 8);
  return buildInventoryAppWindowPayload(
    `${TIMELINE_DEBUG_INSTANCE_PREFIX}${convId}`,
    `Timeline Debug (${shortId})`,
    '🧱',
    { x: 820, y: 60, w: 640, h: 460 },
    `inventory-timeline-debug:${convId}`,
  );
}

function buildRuntimeDebugWindowPayload(): OpenWindowPayload {
  return buildInventoryAppWindowPayload(
    RUNTIME_DEBUG_INSTANCE,
    'Stacks & Cards',
    '🔧',
    { x: 80, y: 30, w: 560, h: 480 },
    RUNTIME_DEBUG_INSTANCE,
  );
}

function buildReduxPerfWindowPayload(): OpenWindowPayload {
  return buildInventoryAppWindowPayload(
    REDUX_PERF_INSTANCE,
    'Redux Perf',
    '📈',
    { x: 900, y: 40, w: 420, h: 320 },
    REDUX_PERF_INSTANCE,
  );
}

export function buildInventoryLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  return buildInventoryAppWindowPayload(
    FOLDER_INSTANCE,
    'Inventory Folder',
    '📦',
    { x: 170, y: 44, w: 880, h: 560 },
    'inventory:folder',
  );
}

function resolveConversationIdFromWindow(win: WindowInstance | null | undefined): string | null {
  if (!win || win.content.kind !== 'app' || !win.content.appKey) {
    return null;
  }
  try {
    const parsed = parseAppKey(win.content.appKey);
    if (parsed.appId !== INVENTORY_APP_ID || !parsed.instanceId.startsWith(CHAT_INSTANCE_PREFIX)) {
      return null;
    }
    return parsed.instanceId.slice(CHAT_INSTANCE_PREFIX.length) || null;
  } catch {
    return null;
  }
}

function resolveFocusedConversationId(state: unknown, focusedWindowId: string | null): string | null {
  if (typeof state !== 'object' || state === null || Array.isArray(state)) {
    return null;
  }
  const root = state as Record<string, unknown>;
  const windowing = root.windowing as Record<string, unknown> | undefined;
  const windows = (windowing?.windows ?? {}) as Record<string, WindowInstance>;

  if (focusedWindowId && windows[focusedWindowId]) {
    const fromFocused = resolveConversationIdFromWindow(windows[focusedWindowId]);
    if (fromFocused) {
      return fromFocused;
    }
  }

  for (const win of Object.values(windows)) {
    const convId = resolveConversationIdFromWindow(win);
    if (convId) {
      return convId;
    }
  }

  return null;
}

function asCardId(commandId: string): string | null {
  if (commandId.startsWith('inventory.card.open.')) {
    return commandId.replace('inventory.card.open.', '').trim() || null;
  }
  if (commandId.startsWith('icon.open.inventory.card.')) {
    return commandId.replace('icon.open.inventory.card.', '').trim() || null;
  }
  return null;
}

function buildChatDebugEventViewerCommand(convId: string): string {
  return `${CHAT_COMMAND_PREFIX}${convId}.debug.event-viewer`;
}

function buildChatDebugTimelineCommand(convId: string): string {
  return `${CHAT_COMMAND_PREFIX}${convId}.debug.timeline-debug`;
}

function buildChatProfileSelectCommand(convId: string, profile: string | null): string {
  const token = profile ? encodeURIComponent(profile) : '__none__';
  return `${CHAT_COMMAND_PREFIX}${convId}${PROFILE_SELECT_TOKEN}${token}`;
}

function buildChatConversationChangeProfileCommand(convId: string): string {
  return `${CHAT_COMMAND_PREFIX}${convId}.conversation.change-profile`;
}

function buildChatConversationReplayLastTurnCommand(convId: string): string {
  return `${CHAT_COMMAND_PREFIX}${convId}.conversation.replay-last-turn`;
}

function buildChatConversationOpenTimelineCommand(convId: string): string {
  return `${CHAT_COMMAND_PREFIX}${convId}.conversation.open-timeline`;
}

function buildChatConversationExportTranscriptCommand(convId: string): string {
  return `${CHAT_COMMAND_PREFIX}${convId}.conversation.export-transcript`;
}

function parseInventoryChatCommand(commandId: string): InventoryChatCommand | null {
  if (!commandId.startsWith(CHAT_COMMAND_PREFIX)) {
    return null;
  }
  const rest = commandId.slice(CHAT_COMMAND_PREFIX.length);
  if (rest.endsWith('.debug.event-viewer')) {
    const convId = rest.slice(0, -'.debug.event-viewer'.length);
    return convId ? { kind: 'debug-event-viewer', convId } : null;
  }
  if (rest.endsWith('.debug.timeline-debug')) {
    const convId = rest.slice(0, -'.debug.timeline-debug'.length);
    return convId ? { kind: 'debug-timeline', convId } : null;
  }
  if (rest.endsWith('.conversation.change-profile')) {
    const convId = rest.slice(0, -'.conversation.change-profile'.length);
    return convId ? { kind: 'conversation-change-profile', convId } : null;
  }
  if (rest.endsWith('.conversation.replay-last-turn')) {
    const convId = rest.slice(0, -'.conversation.replay-last-turn'.length);
    return convId ? { kind: 'conversation-replay-last-turn', convId } : null;
  }
  if (rest.endsWith('.conversation.open-timeline')) {
    const convId = rest.slice(0, -'.conversation.open-timeline'.length);
    return convId ? { kind: 'conversation-open-timeline', convId } : null;
  }
  if (rest.endsWith('.conversation.export-transcript')) {
    const convId = rest.slice(0, -'.conversation.export-transcript'.length);
    return convId ? { kind: 'conversation-export-transcript', convId } : null;
  }

  const profileIdx = rest.indexOf(PROFILE_SELECT_TOKEN);
  if (profileIdx > 0) {
    const convId = rest.slice(0, profileIdx);
    if (!convId) {
      return null;
    }
    const rawProfile = rest.slice(profileIdx + PROFILE_SELECT_TOKEN.length);
    if (!rawProfile) {
      return null;
    }
    if (rawProfile === '__none__') {
      return { kind: 'profile-select', convId, profile: null };
    }
    try {
      return { kind: 'profile-select', convId, profile: decodeURIComponent(rawProfile) };
    } catch {
      return null;
    }
  }
  return null;
}

function resolveMessageContextPayload(invocation: DesktopCommandInvocation): MessageContextPayload | null {
  const conversationId =
    String(invocation.payload?.conversationId ?? invocation.contextTarget?.conversationId ?? '').trim();
  const messageId = String(invocation.payload?.messageId ?? invocation.contextTarget?.messageId ?? '').trim();
  if (!conversationId || !messageId) {
    return null;
  }
  const content = String(invocation.payload?.content ?? '').trim();
  return {
    conversationId,
    messageId,
    content: content || undefined,
  };
}

function buildFocusedChatMenuSections(args: {
  convId: string;
  availableProfiles: Array<{ slug: string; display_name?: string; is_default?: boolean }>;
  selectedProfile: string | null;
}): DesktopActionSection[] {
  const { convId, availableProfiles, selectedProfile } = args;
  const chatSection: DesktopActionSection = {
    id: 'chat',
    label: 'Chat',
    merge: 'replace',
    items: [
      { id: `chat-new-${convId}`, label: '💬 New Chat', commandId: 'inventory.chat.new', shortcut: 'Ctrl+N' },
      { separator: true },
      {
        id: `chat-events-${convId}`,
        label: '🧭 Event Viewer',
        commandId: buildChatDebugEventViewerCommand(convId),
      },
      {
        id: `chat-timeline-${convId}`,
        label: '🧱 Timeline Debug',
        commandId: buildChatDebugTimelineCommand(convId),
      },
    ],
  };

  const profileItems: DesktopActionEntry[] = availableProfiles.length
    ? availableProfiles.map((profile) => ({
        id: `chat-profile-${convId}-${profile.slug}`,
        label: `${profile.display_name?.trim() || profile.slug}${profile.is_default ? ' (default)' : ''}`,
        commandId: buildChatProfileSelectCommand(convId, profile.slug),
        checked: selectedProfile === profile.slug,
      }))
    : [
        {
          id: `chat-profile-none-${convId}`,
          label: 'No profiles',
          commandId: buildChatProfileSelectCommand(convId, null),
          disabled: true,
        },
      ];

  return [
    chatSection,
    {
      id: 'profile',
      label: 'Profile',
      merge: 'replace',
      items: profileItems,
    },
  ];
}

function buildFocusedChatContextActions(convId: string): DesktopActionEntry[] {
  return [
    {
      id: `chat-context-event-viewer-${convId}`,
      label: '🧭 Open Event Viewer',
      commandId: buildChatDebugEventViewerCommand(convId),
    },
    {
      id: `chat-context-timeline-${convId}`,
      label: '🧱 Open Timeline Debug',
      commandId: buildChatDebugTimelineCommand(convId),
    },
  ];
}

function buildConversationContextActions(convId: string): DesktopActionEntry[] {
  return [
    {
      id: `chat-conversation-profile-${convId}`,
      label: 'Change Profile',
      commandId: buildChatConversationChangeProfileCommand(convId),
      visibility: {
        allowedProfiles: ['default', 'agent', 'analyst'],
        unauthorized: 'disable',
      },
      payload: { conversationId: convId },
    },
    {
      id: `chat-conversation-replay-${convId}`,
      label: 'Replay Last Turn',
      commandId: buildChatConversationReplayLastTurnCommand(convId),
      visibility: {
        allowedProfiles: ['agent', 'analyst'],
        unauthorized: 'disable',
      },
      payload: { conversationId: convId },
    },
    {
      id: `chat-conversation-timeline-${convId}`,
      label: 'Open Timeline',
      commandId: buildChatConversationOpenTimelineCommand(convId),
      payload: { conversationId: convId },
    },
    {
      id: `chat-conversation-export-${convId}`,
      label: 'Export Transcript',
      commandId: buildChatConversationExportTranscriptCommand(convId),
      visibility: {
        allowedRoles: ['admin'],
        unauthorized: 'hide',
      },
      payload: { conversationId: convId },
    },
  ];
}

function createInventoryCardAdapter(): WindowContentAdapter {
  return {
    id: 'inventory.card-adapter',
    canRender: (window) => window.content.kind === 'card' && window.content.card?.stackId === STACK.id,
    render: (window, ctx) => {
      if (window.content.kind !== 'card' || !window.content.card) {
        return null;
      }
      return (
        <PluginCardSessionHost
          windowId={window.id}
          sessionId={window.content.card.cardSessionId}
          stack={STACK}
          mode={ctx.mode}
        />
      );
    },
  };
}

function createInventoryCommands(hostContext: LauncherHostContext): DesktopCommandHandler[] {
  return [
    {
      id: 'inventory.folder.open',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.folder.open',
      run: () => {
        hostContext.openWindow(buildInventoryLaunchWindowPayload('command'));
        return 'handled';
      },
    },
    {
      id: 'inventory.chat.new',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.chat.new' || commandId === 'icon.open.inventory.new-chat',
      run: () => {
        hostContext.openWindow(buildChatWindowPayload());
        return 'handled';
      },
    },
    {
      id: 'inventory.chat.focused-debug',
      priority: 120,
      matches: (commandId) => {
        const parsed = parseInventoryChatCommand(commandId);
        return parsed?.kind === 'debug-event-viewer' || parsed?.kind === 'debug-timeline';
      },
      run: (commandId) => {
        const parsed = parseInventoryChatCommand(commandId);
        if (!parsed) {
          return 'pass';
        }
        if (parsed.kind === 'debug-event-viewer') {
          hostContext.openWindow(buildEventViewerWindowPayload(parsed.convId));
          return 'handled';
        }
        if (parsed.kind === 'debug-timeline') {
          hostContext.openWindow(buildTimelineDebugWindowPayload(parsed.convId));
          return 'handled';
        }
        return 'pass';
      },
    },
    {
      id: 'inventory.chat.profile-select',
      priority: 120,
      matches: (commandId) => parseInventoryChatCommand(commandId)?.kind === 'profile-select',
      run: (commandId, ctx) => {
        const parsed = parseInventoryChatCommand(commandId);
        if (!parsed || parsed.kind !== 'profile-select') {
          return 'pass';
        }
        const state = (ctx.getState?.() ?? {}) as InventoryRootState;
        const scopeKey = `conv:${parsed.convId}`;
        const selectedRegistry =
          state.chatProfiles?.selectedByScope?.[scopeKey]?.registry ??
          state.chatProfiles?.selectedRegistry ??
          'default';
        ctx.dispatch(
          chatProfilesSlice.actions.setSelectedProfile({
            profile: parsed.profile ?? null,
            registry: selectedRegistry,
            scopeKey,
          }),
        );
        return 'handled';
      },
    },
    {
      id: 'inventory.chat.conversation-actions',
      priority: 130,
      matches: (commandId) => {
        const parsed = parseInventoryChatCommand(commandId);
        return (
          parsed?.kind === 'conversation-change-profile' ||
          parsed?.kind === 'conversation-replay-last-turn' ||
          parsed?.kind === 'conversation-open-timeline' ||
          parsed?.kind === 'conversation-export-transcript'
        );
      },
      run: (commandId, ctx) => {
        const parsed = parseInventoryChatCommand(commandId);
        if (!parsed) {
          return 'pass';
        }

        if (parsed.kind === 'conversation-open-timeline') {
          hostContext.openWindow(buildTimelineDebugWindowPayload(parsed.convId));
          return 'handled';
        }

        if (parsed.kind === 'conversation-replay-last-turn') {
          hostContext.dispatch(showToast(`Replay requested for conversation ${parsed.convId}`));
          return 'handled';
        }

        if (parsed.kind === 'conversation-export-transcript') {
          hostContext.dispatch(showToast(`Export transcript requested for conversation ${parsed.convId}`));
          return 'handled';
        }

        if (parsed.kind === 'conversation-change-profile') {
          const state = (ctx.getState?.() ?? {}) as InventoryRootState;
          const profiles = state.chatProfiles?.availableProfiles ?? [];
          if (profiles.length === 0) {
            return 'pass';
          }
          const scopeKey = `conv:${parsed.convId}`;
          const selectedRegistry =
            state.chatProfiles?.selectedByScope?.[scopeKey]?.registry ??
            state.chatProfiles?.selectedRegistry ??
            'default';
          const currentProfile =
            state.chatProfiles?.selectedByScope?.[scopeKey]?.profile ??
            state.chatProfiles?.selectedProfile ??
            null;
          const currentIndex = profiles.findIndex((profile) => profile.slug === currentProfile);
          const nextProfile = profiles[(currentIndex + 1 + profiles.length) % profiles.length];
          ctx.dispatch(
            chatProfilesSlice.actions.setSelectedProfile({
              profile: nextProfile?.slug ?? null,
              registry: selectedRegistry,
              scopeKey,
            }),
          );
          return 'handled';
        }

        return 'pass';
      },
    },
    {
      id: 'inventory.chat.message-actions',
      priority: 140,
      matches: (commandId) =>
        commandId === 'chat.message.reply' ||
        commandId === 'chat.message.create-task' ||
        commandId === 'chat.message.debug-event',
      run: (commandId, _ctx, invocation) => {
        const payload = resolveMessageContextPayload(invocation);
        if (!payload) {
          return 'pass';
        }

        if (commandId === 'chat.message.debug-event') {
          hostContext.openWindow(buildEventViewerWindowPayload(payload.conversationId));
          return 'handled';
        }

        if (commandId === 'chat.message.reply') {
          hostContext.dispatch(showToast(`Reply action selected for message ${payload.messageId}`));
          return 'handled';
        }

        if (commandId === 'chat.message.create-task') {
          hostContext.dispatch(showToast(`Create Task action selected for message ${payload.messageId}`));
          return 'handled';
        }

        return 'pass';
      },
    },
    {
      id: 'inventory.card.open',
      priority: 100,
      matches: (commandId) => asCardId(commandId) !== null,
      run: (commandId) => {
        const cardId = asCardId(commandId);
        if (!cardId || !STACK.cards[cardId]) {
          return 'pass';
        }
        hostContext.openWindow(buildInventoryCardWindowPayload(cardId));
        return 'handled';
      },
    },
    {
      id: 'inventory.debug.event-viewer',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.debug.event-viewer' || commandId === 'icon.open.inventory.event-viewer',
      run: (_commandId, ctx) => {
        const convId = resolveFocusedConversationId(ctx.getState?.(), ctx.focusedWindowId);
        if (!convId) {
          return 'pass';
        }
        hostContext.openWindow(buildEventViewerWindowPayload(convId));
        return 'handled';
      },
    },
    {
      id: 'inventory.debug.timeline-debug',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.debug.timeline-debug' || commandId === 'icon.open.inventory.timeline-debug',
      run: (_commandId, ctx) => {
        const convId = resolveFocusedConversationId(ctx.getState?.(), ctx.focusedWindowId);
        if (!convId) {
          return 'pass';
        }
        hostContext.openWindow(buildTimelineDebugWindowPayload(convId));
        return 'handled';
      },
    },
    {
      id: 'inventory.debug.stacks',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.debug.stacks' || commandId === 'icon.open.inventory.runtime-debug',
      run: () => {
        hostContext.openWindow(buildRuntimeDebugWindowPayload());
        return 'handled';
      },
    },
    {
      id: 'inventory.debug.redux-perf',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.debug.redux-perf' || commandId === 'icon.open.inventory.redux-perf',
      run: () => {
        hostContext.openWindow(buildReduxPerfWindowPayload());
        return 'handled';
      },
    },
  ];
}

export function createInventoryContributions(hostContext: LauncherHostContext): DesktopContribution[] {
  return [
    {
      id: 'inventory.launcher',
      menus: [
        {
          id: 'file',
          label: 'File',
          items: [
            { id: 'inventory-open-folder', label: 'Open Inventory Folder', commandId: 'inventory.folder.open' },
            { id: 'inventory-new-chat', label: 'New Inventory Chat', commandId: 'inventory.chat.new', shortcut: 'Ctrl+N' },
            {
              id: 'inventory-open-home',
              label: `Open ${STACK.cards[STACK.homeCard]?.title ?? 'Home'}`,
              commandId: `inventory.card.open.${STACK.homeCard}`,
            },
            { id: 'inventory-close-focused', label: 'Close Window', commandId: 'window.close-focused', shortcut: 'Ctrl+W' },
          ],
        },
        {
          id: 'cards',
          label: 'Cards',
          items: Object.keys(STACK.cards).map((cardId) => ({
            id: `inventory-open-${cardId}`,
            label: `${STACK.cards[cardId].icon ?? ''} ${STACK.cards[cardId].title ?? cardId}`.trim(),
            commandId: `inventory.card.open.${cardId}`,
          })),
        },
        {
          id: 'debug',
          label: 'Debug',
          items: [
            { id: 'inventory-debug-stacks', label: '🔧 Stacks & Cards', commandId: 'inventory.debug.stacks' },
            { id: 'inventory-debug-event-viewer', label: '🧭 Event Viewer', commandId: 'inventory.debug.event-viewer' },
            { id: 'inventory-debug-timeline', label: '🧱 Timeline Debug', commandId: 'inventory.debug.timeline-debug' },
            { id: 'inventory-debug-redux', label: '📈 Redux Perf', commandId: 'inventory.debug.redux-perf' },
          ],
        },
      ],
      commands: createInventoryCommands(hostContext),
      windowContentAdapters: [createInventoryCardAdapter()],
    },
  ];
}

const INVENTORY_FOLDER_ICONS: DesktopIconDef[] = [
  { id: 'inventory-folder.new-chat', label: 'New Chat', icon: '💬' },
  { id: 'inventory-folder.runtime-debug', label: 'Stacks & Cards', icon: '🔧' },
  { id: 'inventory-folder.event-viewer', label: 'Event Viewer', icon: '🧭' },
  { id: 'inventory-folder.timeline-debug', label: 'Timeline Debug', icon: '🧱' },
  { id: 'inventory-folder.redux-perf', label: 'Redux Perf', icon: '📈' },
  ...Object.keys(STACK.cards).map((cardId) => ({
    id: `inventory-folder.card.${cardId}`,
    label: STACK.cards[cardId].title ?? cardId,
    icon: STACK.cards[cardId].icon ?? '📄',
  })),
];

function openInventoryFolderIcon(iconId: string, options: { dispatch: ReturnType<typeof useDispatch>; getState: () => unknown }) {
  const { dispatch, getState } = options;
  if (iconId === 'inventory-folder.new-chat') {
    dispatch(openWindow(buildChatWindowPayload()));
    return;
  }
  if (iconId === 'inventory-folder.runtime-debug') {
    dispatch(openWindow(buildRuntimeDebugWindowPayload()));
    return;
  }
  if (iconId === 'inventory-folder.redux-perf') {
    dispatch(openWindow(buildReduxPerfWindowPayload()));
    return;
  }
  if (iconId === 'inventory-folder.event-viewer' || iconId === 'inventory-folder.timeline-debug') {
    let convId = resolveFocusedConversationId(getState(), null);
    if (!convId) {
      const chatPayload = buildChatWindowPayload();
      dispatch(openWindow(chatPayload));
      if (chatPayload.content.kind === 'app' && chatPayload.content.appKey) {
        try {
          const parsed = parseAppKey(chatPayload.content.appKey);
          if (parsed.instanceId.startsWith(CHAT_INSTANCE_PREFIX)) {
            convId = parsed.instanceId.slice(CHAT_INSTANCE_PREFIX.length);
          }
        } catch {
          convId = null;
        }
      }
    }
    if (!convId) {
      return;
    }
    dispatch(
      openWindow(
        iconId === 'inventory-folder.event-viewer'
          ? buildEventViewerWindowPayload(convId)
          : buildTimelineDebugWindowPayload(convId),
      ),
    );
    return;
  }
  if (iconId.startsWith('inventory-folder.card.')) {
    const cardId = iconId.replace('inventory-folder.card.', '').trim();
    if (!cardId || !STACK.cards[cardId]) {
      return;
    }
    dispatch(openWindow(buildInventoryCardWindowPayload(cardId)));
  }
}

function InventoryFolderWindow() {
  const dispatch = useDispatch();
  const store = useStore();
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  const openIcon = useCallback(
    (iconId: string) => {
      openInventoryFolderIcon(iconId, {
        dispatch,
        getState: () => store.getState(),
      });
    },
    [dispatch, store],
  );

  return (
    <section style={{ padding: 12, display: 'grid', gap: 8, height: '100%' }}>
      <strong>Inventory</strong>
      <DesktopIconLayer
        icons={INVENTORY_FOLDER_ICONS}
        selectedIconId={selectedIconId}
        onSelectIcon={setSelectedIconId}
        onOpenIcon={openIcon}
      />
    </section>
  );
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error('clipboard unavailable');
}

function InventoryChatAssistantWindow({
  convId,
  apiBasePrefix,
  windowId,
}: {
  convId: string;
  apiBasePrefix: string;
  windowId: string;
}) {
  const dispatch = useDispatch();
  const [renderMode, setRenderMode] = useState<'normal' | 'debug'>('normal');
  const [copyConvStatus, setCopyConvStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const availableProfiles = useSelector(
    (state: InventoryRootState) => state.chatProfiles?.availableProfiles ?? [],
  );
  const selectedProfile = useSelector((state: InventoryRootState) => {
    const scopeKey = `conv:${convId}`;
    return (
      state.chatProfiles?.selectedByScope?.[scopeKey]?.profile ??
      state.chatProfiles?.selectedProfile ??
      null
    );
  });

  const focusedMenuSections = useMemo(
    () =>
      buildFocusedChatMenuSections({
        convId,
        availableProfiles,
        selectedProfile,
      }),
    [availableProfiles, convId, selectedProfile],
  );
  const focusedContextActions = useMemo(() => buildFocusedChatContextActions(convId), [convId]);
  const conversationContextActions = useMemo(() => buildConversationContextActions(convId), [convId]);

  useRegisterWindowMenuSections(focusedMenuSections);
  useRegisterWindowContextActions(focusedContextActions);

  const openEventViewer = useCallback(() => {
    dispatch(openWindow(buildEventViewerWindowPayload(convId)));
  }, [convId, dispatch]);

  const openTimelineDebug = useCallback(() => {
    dispatch(openWindow(buildTimelineDebugWindowPayload(convId)));
  }, [convId, dispatch]);

  const copyConversationId = useCallback(() => {
    copyTextToClipboard(convId)
      .then(() => {
        setCopyConvStatus('copied');
      })
      .catch(() => {
        setCopyConvStatus('error');
      })
      .finally(() => {
        setTimeout(() => setCopyConvStatus('idle'), 1300);
      });
  }, [convId]);

  return (
    <ChatConversationWindow
      convId={convId}
      windowId={windowId}
      basePrefix={apiBasePrefix}
      title="Inventory Chat"
      enableProfileSelector
      profileRegistry="default"
      profileScopeKey={`conv:${convId}`}
      renderMode={renderMode}
      conversationContextActions={conversationContextActions}
      headerActions={
        <>
          <button type="button" data-part="btn" onClick={openEventViewer} style={{ fontSize: 10, padding: '1px 6px' }}>
            🧭 Events
          </button>
          <button
            type="button"
            data-part="btn"
            onClick={openTimelineDebug}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            🧱 Timeline
          </button>
          <button
            type="button"
            data-part="btn"
            onClick={copyConversationId}
            title={convId}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            {copyConvStatus === 'copied'
              ? '✅ Copied'
              : copyConvStatus === 'error'
                ? '⚠ Copy failed'
                : '📋 Copy Conv ID'}
          </button>
          <button
            type="button"
            data-part="btn"
            data-state={renderMode === 'debug' ? 'active' : undefined}
            onClick={() => setRenderMode((mode) => (mode === 'normal' ? 'debug' : 'normal'))}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            {renderMode === 'debug' ? '🔍 Debug ON' : '🔍 Debug'}
          </button>
        </>
      }
    />
  );
}

export interface InventoryLauncherAppWindowProps {
  instanceId: string;
  windowId: string;
  apiBasePrefix: string;
}

export function InventoryLauncherAppWindow({
  instanceId,
  windowId,
  apiBasePrefix,
}: InventoryLauncherAppWindowProps): ReactNode {
  if (instanceId === FOLDER_INSTANCE) {
    return <InventoryFolderWindow />;
  }
  if (instanceId.startsWith(CHAT_INSTANCE_PREFIX)) {
    const convId = instanceId.slice(CHAT_INSTANCE_PREFIX.length);
    return <InventoryChatAssistantWindow convId={convId} windowId={windowId} apiBasePrefix={apiBasePrefix} />;
  }
  if (instanceId.startsWith(EVENT_VIEW_INSTANCE_PREFIX)) {
    const convId = instanceId.slice(EVENT_VIEW_INSTANCE_PREFIX.length);
    return <EventViewerWindow conversationId={convId} />;
  }
  if (instanceId.startsWith(TIMELINE_DEBUG_INSTANCE_PREFIX)) {
    const convId = instanceId.slice(TIMELINE_DEBUG_INSTANCE_PREFIX.length);
    return <TimelineDebugWindow conversationId={convId} />;
  }
  if (instanceId === RUNTIME_DEBUG_INSTANCE) {
    return <RuntimeCardDebugWindow stacks={[STACK]} />;
  }
  if (instanceId === REDUX_PERF_INSTANCE) {
    return <ReduxPerfWindow />;
  }
  if (instanceId.startsWith(CODE_EDITOR_INSTANCE_PREFIX)) {
    const cardId = instanceId.slice(CODE_EDITOR_INSTANCE_PREFIX.length);
    return <CodeEditorWindow cardId={cardId} initialCode={getEditorInitialCode(cardId)} />;
  }

  return (
    <section style={{ padding: 12, display: 'grid', gap: 8 }}>
      <strong>Inventory</strong>
      <span>Unknown inventory window instance: {instanceId}</span>
    </section>
  );
}
