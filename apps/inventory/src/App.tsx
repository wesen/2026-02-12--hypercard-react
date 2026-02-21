import {
  ChatConversationWindow,
  CodeEditorWindow,
  ensureChatModulesRegistered,
  EventViewerWindow,
  getEditorInitialCode,
  registerChatRuntimeModule,
  registerHypercardTimelineModule,
  RuntimeCardDebugWindow,
} from '@hypercard/engine';
import { type OpenWindowPayload, openWindow } from '@hypercard/engine/desktop-core';
import { type DesktopContribution, DesktopShell } from '@hypercard/engine/desktop-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { STACK } from './domain/stack';
import { ReduxPerfWindow } from './features/debug/ReduxPerfWindow';

const CHAT_APP_KEY = 'inventory-chat';
const REDUX_PERF_APP_KEY = 'redux-perf-debug';

registerChatRuntimeModule({
  id: 'chat.hypercard-timeline',
  register: registerHypercardTimelineModule,
});
ensureChatModulesRegistered();

function newConversationId(): string {
  return typeof window.crypto?.randomUUID === 'function' ? window.crypto.randomUUID() : `inv-${Date.now()}`;
}

function buildChatWindowPayload(options?: { dedupeKey?: string }): OpenWindowPayload {
  const convId = newConversationId();
  return {
    id: `window:chat:${convId}`,
    title: '💬 Inventory Chat',
    icon: '💬',
    bounds: {
      x: 340 + Math.round(Math.random() * 60),
      y: 20 + Math.round(Math.random() * 40),
      w: 520,
      h: 440,
    },
    content: {
      kind: 'app',
      appKey: `${CHAT_APP_KEY}:${convId}`,
    },
    dedupeKey: options?.dedupeKey ?? `chat:${convId}`,
  };
}

function chatConversationIdFromAppKey(appKey: string | undefined): string | null {
  if (!appKey || !appKey.startsWith(`${CHAT_APP_KEY}:`)) {
    return null;
  }
  const convId = appKey.slice(CHAT_APP_KEY.length + 1).trim();
  return convId.length > 0 ? convId : null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function resolveEventViewerConversationId(state: unknown, focusedWindowId: string | null): string | null {
  const root = asObject(state);
  const windowing = root ? asObject(root.windowing) : null;
  const windows = windowing ? asObject(windowing.windows) : null;
  if (!windows) {
    return null;
  }

  if (focusedWindowId) {
    const focusedWindow = asObject(windows[focusedWindowId]);
    const content = focusedWindow ? asObject(focusedWindow.content) : null;
    const fromFocused = chatConversationIdFromAppKey(
      content && typeof content.appKey === 'string' ? content.appKey : undefined,
    );
    if (fromFocused) {
      return fromFocused;
    }
  }

  for (const value of Object.values(windows)) {
    const win = asObject(value);
    const content = win ? asObject(win.content) : null;
    const convId = chatConversationIdFromAppKey(
      content && typeof content.appKey === 'string' ? content.appKey : undefined,
    );
    if (convId) {
      return convId;
    }
  }

  return null;
}

function buildEventViewerWindowPayload(convId: string): OpenWindowPayload {
  const shortId = convId.slice(0, 8);
  return {
    id: `window:event-viewer:${convId}`,
    title: `🧭 Event Viewer (${shortId})`,
    icon: '🧭',
    bounds: { x: 780, y: 40, w: 560, h: 420 },
    content: {
      kind: 'app',
      appKey: `event-viewer:${convId}`,
    },
    dedupeKey: `event-viewer:${convId}`,
  };
}

function buildRuntimeDebugWindowPayload(): OpenWindowPayload {
  return {
    id: 'window:runtime-debug',
    title: '🔧 Stacks & Cards',
    icon: '🔧',
    bounds: { x: 80, y: 30, w: 560, h: 480 },
    content: { kind: 'app', appKey: 'runtime-card-debug' },
    dedupeKey: 'runtime-card-debug',
  };
}

function InventoryChatAssistantWindow({ convId }: { convId: string }) {
  const dispatch = useDispatch();
  const [renderMode, setRenderMode] = useState<'normal' | 'debug'>('normal');

  const openEventViewer = useCallback(() => {
    dispatch(openWindow(buildEventViewerWindowPayload(convId)));
  }, [convId, dispatch]);

  return (
    <ChatConversationWindow
      convId={convId}
      title="Inventory Chat"
      renderMode={renderMode}
      headerActions={
        <>
          <button type="button" data-part="btn" onClick={openEventViewer} style={{ fontSize: 10, padding: '1px 6px' }}>
            🧭 Events
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

export function App() {
  const renderAppWindow = useCallback((appKey: string): ReactNode => {
    if (appKey === REDUX_PERF_APP_KEY) {
      return <ReduxPerfWindow />;
    }
    if (appKey.startsWith(`${CHAT_APP_KEY}:`)) {
      const convId = appKey.slice(CHAT_APP_KEY.length + 1);
      return <InventoryChatAssistantWindow convId={convId} />;
    }
    if (appKey.startsWith('event-viewer:')) {
      const convId = appKey.slice('event-viewer:'.length);
      return <EventViewerWindow conversationId={convId} />;
    }
    if (appKey === 'runtime-card-debug') {
      return <RuntimeCardDebugWindow stacks={[STACK]} />;
    }
    if (appKey.startsWith('code-editor:')) {
      const cardId = appKey.slice('code-editor:'.length);
      return <CodeEditorWindow cardId={cardId} initialCode={getEditorInitialCode(cardId)} />;
    }
    return null;
  }, []);

  const contributions = useMemo((): DesktopContribution[] => {
    const cardIcons = Object.keys(STACK.cards).map((cardId) => ({
      id: cardId,
      label: STACK.cards[cardId].title ?? cardId,
      icon: STACK.cards[cardId].icon ?? '📄',
    }));
    const debugIcons = [
      { id: 'runtime-debug', label: 'Stacks & Cards', icon: '🔧' },
      { id: 'event-viewer', label: 'Event Viewer', icon: '🧭' },
    ];
    if (import.meta.env.DEV) {
      debugIcons.push({ id: 'redux-perf', label: 'Redux Perf', icon: '📈' });
    }
    const startupWindows = [
      {
        id: 'startup.chat',
        create: () => buildChatWindowPayload({ dedupeKey: 'chat:startup' }),
      },
      ...(import.meta.env.DEV
        ? [
            {
              id: 'startup.redux-perf',
              create: () =>
                ({
                  id: 'window:redux-perf:dev',
                  title: '📈 Redux Perf',
                  icon: '📈',
                  bounds: { x: 900, y: 40, w: 420, h: 320 },
                  content: { kind: 'app', appKey: REDUX_PERF_APP_KEY },
                  dedupeKey: REDUX_PERF_APP_KEY,
                }) satisfies OpenWindowPayload,
            },
          ]
        : []),
    ];

    return [
      {
        id: 'inventory.desktop',
        icons: [{ id: 'new-chat', label: 'New Chat', icon: '💬' }, ...debugIcons, ...cardIcons],
        menus: [
          {
            id: 'file',
            label: 'File',
            items: [
              { id: 'new-chat', label: 'New Chat', commandId: 'chat.new', shortcut: 'Ctrl+N' },
              { id: 'event-viewer', label: 'Open Event Viewer', commandId: 'debug.event-viewer' },
              {
                id: 'new-home',
                label: `New ${STACK.cards[STACK.homeCard]?.title ?? 'Home'} Window`,
                commandId: 'window.open.home',
              },
              { id: 'close-focused', label: 'Close Window', commandId: 'window.close-focused', shortcut: 'Ctrl+W' },
            ],
          },
          {
            id: 'cards',
            label: 'Cards',
            items: Object.keys(STACK.cards).map((cardId) => ({
              id: `open-${cardId}`,
              label: `${STACK.cards[cardId].icon ?? ''} ${STACK.cards[cardId].title ?? cardId}`.trim(),
              commandId: `window.open.card.${cardId}`,
            })),
          },
          {
            id: 'window',
            label: 'Window',
            items: [
              { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
              { id: 'cascade', label: 'Cascade Windows', commandId: 'window.cascade' },
            ],
          },
          ...(import.meta.env.DEV
            ? [
                {
                  id: 'debug',
                  label: 'Debug',
                  items: [
                    { id: 'redux-perf', label: '📈 Redux Perf', commandId: 'debug.redux-perf' },
                    { id: 'event-viewer', label: '🧭 Event Viewer', commandId: 'debug.event-viewer' },
                    { id: 'stacks-cards', label: '🔧 Stacks & Cards', commandId: 'debug.stacks' },
                  ],
                },
              ]
            : []),
        ],
        commands: [
          {
            id: 'inventory.chat.new',
            priority: 100,
            matches: (commandId) => commandId === 'chat.new' || commandId === 'icon.open.new-chat',
            run: (_commandId, ctx) => {
              ctx.dispatch(openWindow(buildChatWindowPayload()));
              return 'handled';
            },
          },
          {
            id: 'inventory.debug.event-viewer',
            priority: 100,
            matches: (commandId) => commandId === 'debug.event-viewer' || commandId === 'icon.open.event-viewer',
            run: (_commandId, ctx) => {
              const convId = resolveEventViewerConversationId(ctx.getState?.(), ctx.focusedWindowId);
              if (!convId) {
                return 'pass';
              }
              ctx.dispatch(openWindow(buildEventViewerWindowPayload(convId)));
              return 'handled';
            },
          },
          {
            id: 'inventory.debug.stacks',
            priority: 100,
            matches: (commandId) => commandId === 'debug.stacks' || commandId === 'icon.open.runtime-debug',
            run: (_commandId, ctx) => {
              ctx.dispatch(openWindow(buildRuntimeDebugWindowPayload()));
              return 'handled';
            },
          },
          {
            id: 'inventory.debug.redux-perf',
            priority: 100,
            matches: (commandId) => commandId === 'debug.redux-perf' || commandId === 'icon.open.redux-perf',
            run: (_commandId, ctx) => {
              ctx.dispatch(
                openWindow({
                  id: 'window:redux-perf:dev',
                  title: '📈 Redux Perf',
                  icon: '📈',
                  bounds: { x: 900, y: 40, w: 420, h: 320 },
                  content: { kind: 'app', appKey: REDUX_PERF_APP_KEY },
                  dedupeKey: REDUX_PERF_APP_KEY,
                }),
              );
              return 'handled';
            },
          },
        ],
        startupWindows,
      },
    ];
  }, []);

  return <DesktopShell stack={STACK} contributions={contributions} renderAppWindow={renderAppWindow} />;
}
