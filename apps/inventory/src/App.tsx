import {
  ChatConversationWindow,
  CodeEditorWindow,
  EventViewerWindow,
  RuntimeCardDebugWindow,
  TimelineDebugWindow,
  ensureChatModulesRegistered,
  getEditorInitialCode,
  registerChatRuntimeModule,
  registerHypercardTimelineModule,
} from '@hypercard/engine';
import {
  completeRequestById,
  ConfirmApiError,
  ConfirmRequestWindowHost,
  createConfirmRuntime,
  removeRequest,
  selectActiveConfirmRequestById,
  selectActiveConfirmRequests,
  type ConfirmApiClient,
  type ConfirmRuntimeAnyAction,
  type ConfirmRequest,
  upsertRequest,
} from '@hypercard/confirm-runtime';
import { closeWindow, type OpenWindowPayload, openWindow } from '@hypercard/engine/desktop-core';
import { type DesktopContribution, DesktopShell } from '@hypercard/engine/desktop-react';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './app/store';
import { STACK } from './domain/stack';
import { ReduxPerfWindow } from './features/debug/ReduxPerfWindow';

const CHAT_APP_KEY = 'inventory-chat';
const REDUX_PERF_APP_KEY = 'redux-perf-debug';
const CONFIRM_REQUEST_APP_KEY_PREFIX = 'confirm-request:';
const CONFIRM_QUEUE_APP_KEY = 'confirm-queue';

registerChatRuntimeModule({
  id: 'chat.hypercard-timeline',
  register: registerHypercardTimelineModule,
});
ensureChatModulesRegistered();

function newConversationId(): string {
  return typeof window.crypto?.randomUUID === 'function' ? window.crypto.randomUUID() : `inv-${Date.now()}`;
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error('clipboard unavailable');
}

function resolveAppBasePrefix(): string {
  const baseUrl = import.meta.env.BASE_URL ?? '/';
  const trimmed = String(baseUrl).replace(/\/$/, '');
  return trimmed === '' ? '' : trimmed;
}

function resolveConfirmBaseUrl(): string {
  const prefix = resolveAppBasePrefix();
  if (typeof window === 'undefined') {
    return `${prefix}/confirm`;
  }
  return `${window.location.origin}${prefix}/confirm`;
}

function buildChatWindowPayload(options?: { dedupeKey?: string }): OpenWindowPayload {
  const convId = newConversationId();
  return {
    id: `window:chat:${convId}`,
    title: 'Inventory Chat',
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

function buildConfirmRequestWindowPayload(requestId: string, title?: string): OpenWindowPayload {
  return {
    id: `window:confirm:${requestId}`,
    title: title && title.trim().length > 0 ? `Confirm: ${title}` : 'Confirm Request',
    icon: '✅',
    bounds: {
      x: 420 + Math.round(Math.random() * 80),
      y: 70 + Math.round(Math.random() * 50),
      w: 520,
      h: 420,
    },
    content: {
      kind: 'app',
      appKey: `${CONFIRM_REQUEST_APP_KEY_PREFIX}${requestId}`,
    },
    dedupeKey: `confirm-request:${requestId}`,
  };
}

function buildConfirmQueueWindowPayload(): OpenWindowPayload {
  return {
    id: 'window:confirm-queue',
    title: 'Confirm Queue',
    icon: '✅',
    bounds: { x: 260, y: 40, w: 520, h: 400 },
    content: {
      kind: 'app',
      appKey: CONFIRM_QUEUE_APP_KEY,
    },
    dedupeKey: CONFIRM_QUEUE_APP_KEY,
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
    title: `Event Viewer (${shortId})`,
    icon: '🧭',
    bounds: { x: 780, y: 40, w: 560, h: 420 },
    content: {
      kind: 'app',
      appKey: `event-viewer:${convId}`,
    },
    dedupeKey: `event-viewer:${convId}`,
  };
}

function buildTimelineDebugWindowPayload(convId: string): OpenWindowPayload {
  const shortId = convId.slice(0, 8);
  return {
    id: `window:timeline-debug:${convId}`,
    title: `Timeline Debug (${shortId})`,
    icon: '🧱',
    bounds: { x: 820, y: 60, w: 640, h: 460 },
    content: {
      kind: 'app',
      appKey: `timeline-debug:${convId}`,
    },
    dedupeKey: `timeline-debug:${convId}`,
  };
}

function buildRuntimeDebugWindowPayload(): OpenWindowPayload {
  return {
    id: 'window:runtime-debug',
    title: 'Stacks & Cards',
    icon: '🔧',
    bounds: { x: 80, y: 30, w: 560, h: 480 },
    content: { kind: 'app', appKey: 'runtime-card-debug' },
    dedupeKey: 'runtime-card-debug',
  };
}

function InventoryChatAssistantWindow({ convId }: { convId: string }) {
  const dispatch = useDispatch();
  const [renderMode, setRenderMode] = useState<'normal' | 'debug'>('normal');
  const [copyConvStatus, setCopyConvStatus] = useState<'idle' | 'copied' | 'error'>('idle');

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
      title="Inventory Chat"
      renderMode={renderMode}
      headerActions={
        <>
          <button type="button" data-part="btn" onClick={openEventViewer} style={{ fontSize: 10, padding: '1px 6px' }}>
            🧭 Events
          </button>
          <button type="button" data-part="btn" onClick={openTimelineDebug} style={{ fontSize: 10, padding: '1px 6px' }}>
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

function ConfirmQueueWindow({ onOpenRequest }: { onOpenRequest: (request: ConfirmRequest) => void }) {
  const requests = useSelector((state: RootState) => selectActiveConfirmRequests(state));

  return (
    <div data-part="card" style={{ padding: 10, display: 'grid', gap: 8 }}>
      <div data-part="field-value">Active requests: {requests.length}</div>
      {requests.length === 0 ? (
        <div data-part="table-empty">No active requests</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 8,
                alignItems: 'center',
                border: '1px solid currentColor',
                borderRadius: 3,
                padding: 6,
              }}
            >
              <div>
                <div data-part="field-label">{request.title ?? request.widgetType}</div>
                <div data-part="field-value">{request.widgetType} · {request.id}</div>
              </div>
              <button type="button" data-part="btn" onClick={() => onOpenRequest(request)}>
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmRequestDesktopWindow({ requestId, apiClient }: { requestId: string; apiClient: ConfirmApiClient | null }) {
  const dispatch = useDispatch();
  const request = useSelector((state: RootState) => selectActiveConfirmRequestById(state, requestId));

  if (!request) {
    return <div data-part="table-empty">Request not available (completed or not yet loaded)</div>;
  }
  if (!apiClient) {
    return <div data-part="table-empty">Confirm API unavailable</div>;
  }

  return (
    <ConfirmRequestWindowHost
      request={request}
      onSubmitResponse={(_id, payload) => {
        void apiClient
          .submitResponse(request, payload)
          .then((updated) => {
            if (updated) {
              dispatch(upsertRequest(updated));
            }
          })
          .catch(async (error: unknown) => {
            if (error instanceof ConfirmApiError && error.status === 409) {
              try {
                const latest = await apiClient.getRequest(request.id);
                if (latest.status && latest.status !== 'pending') {
                  dispatch(
                    completeRequestById({
                      requestId: latest.id,
                      completedAt: latest.completedAt ?? new Date().toISOString(),
                    }),
                  );
                  dispatch(closeWindow(`window:confirm:${latest.id}`));
                  return;
                }
              } catch {
                // Fall through to local cleanup.
              }

              dispatch(removeRequest(request.id));
              dispatch(closeWindow(`window:confirm:${request.id}`));
              return;
            }
            console.error('confirm submit failed', error);
          });
      }}
      onSubmitScriptEvent={(id, payload) => {
        void apiClient
          .submitScriptEvent(id, payload)
          .then((updated) => {
            if (updated) {
              dispatch(upsertRequest(updated));
            }
          })
          .catch(async (error: unknown) => {
            if (error instanceof ConfirmApiError && error.status === 409) {
              try {
                const latest = await apiClient.getRequest(id);
                if (latest.status && latest.status !== 'pending') {
                  dispatch(
                    completeRequestById({
                      requestId: latest.id,
                      completedAt: latest.completedAt ?? new Date().toISOString(),
                    }),
                  );
                  dispatch(closeWindow(`window:confirm:${latest.id}`));
                  return;
                }
              } catch {
                // Fall through to local cleanup.
              }

              dispatch(removeRequest(id));
              dispatch(closeWindow(`window:confirm:${id}`));
              return;
            }
            console.error('confirm script event submit failed', error);
          });
      }}
    />
  );
}

export function App() {
  const dispatch = useDispatch();
  const [confirmApiClient, setConfirmApiClient] = useState<ConfirmApiClient | null>(null);

  useEffect(() => {
    const runtime = createConfirmRuntime({
      host: {
        resolveBaseUrl: resolveConfirmBaseUrl,
        resolveSessionId: () => 'global',
        openRequestWindow: ({ requestId, title }) => {
          dispatch(openWindow(buildConfirmRequestWindowPayload(requestId, title)));
        },
        closeRequestWindow: (requestId) => {
          dispatch(closeWindow(`window:confirm:${requestId}`));
        },
        onError: (error) => {
          // Keep runtime errors visible during integration while leaving UX design to the handoff ticket.
          console.error('confirm-runtime error', error);
        },
      },
      dispatch: dispatch as unknown as (action: ConfirmRuntimeAnyAction) => void,
    });

    setConfirmApiClient(runtime.apiClient);
    runtime.connect();
    return () => runtime.disconnect();
  }, [dispatch]);

  const renderAppWindow = useCallback((appKey: string): ReactNode => {
    if (appKey === REDUX_PERF_APP_KEY) {
      return <ReduxPerfWindow />;
    }
    if (appKey === CONFIRM_QUEUE_APP_KEY) {
      return (
        <ConfirmQueueWindow
          onOpenRequest={(request) => dispatch(openWindow(buildConfirmRequestWindowPayload(request.id, request.title)))}
        />
      );
    }
    if (appKey.startsWith(CONFIRM_REQUEST_APP_KEY_PREFIX)) {
      const requestId = appKey.slice(CONFIRM_REQUEST_APP_KEY_PREFIX.length);
      return <ConfirmRequestDesktopWindow requestId={requestId} apiClient={confirmApiClient} />;
    }
    if (appKey.startsWith(`${CHAT_APP_KEY}:`)) {
      const convId = appKey.slice(CHAT_APP_KEY.length + 1);
      return <InventoryChatAssistantWindow convId={convId} />;
    }
    if (appKey.startsWith('event-viewer:')) {
      const convId = appKey.slice('event-viewer:'.length);
      return <EventViewerWindow conversationId={convId} />;
    }
    if (appKey.startsWith('timeline-debug:')) {
      const convId = appKey.slice('timeline-debug:'.length);
      return <TimelineDebugWindow conversationId={convId} />;
    }
    if (appKey === 'runtime-card-debug') {
      return <RuntimeCardDebugWindow stacks={[STACK]} />;
    }
    if (appKey.startsWith('code-editor:')) {
      const cardId = appKey.slice('code-editor:'.length);
      return <CodeEditorWindow cardId={cardId} initialCode={getEditorInitialCode(cardId)} />;
    }
    return null;
  }, [confirmApiClient, dispatch]);

  const contributions = useMemo((): DesktopContribution[] => {
    const cardIcons = Object.keys(STACK.cards).map((cardId) => ({
      id: cardId,
      label: STACK.cards[cardId].title ?? cardId,
      icon: STACK.cards[cardId].icon ?? '📄',
    }));
    const debugIcons = [
      { id: 'runtime-debug', label: 'Stacks & Cards', icon: '🔧' },
      { id: 'event-viewer', label: 'Event Viewer', icon: '🧭' },
      { id: 'timeline-debug', label: 'Timeline Debug', icon: '🧱' },
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
                  title: 'Redux Perf',
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
        icons: [
          { id: 'new-chat', label: 'New Chat', icon: '💬' },
          { id: 'confirm-queue', label: 'Confirm Queue', icon: '✅' },
          ...debugIcons,
          ...cardIcons,
        ],
        menus: [
          {
            id: 'file',
            label: 'File',
            items: [
              { id: 'new-chat', label: 'New Chat', commandId: 'chat.new', shortcut: 'Ctrl+N' },
              { id: 'confirm-queue', label: 'Open Confirm Queue', commandId: 'confirm.queue' },
              { id: 'event-viewer', label: 'Open Event Viewer', commandId: 'debug.event-viewer' },
              { id: 'timeline-debug', label: 'Open Timeline Debug', commandId: 'debug.timeline-debug' },
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
                    { id: 'timeline-debug', label: '🧱 Timeline Debug', commandId: 'debug.timeline-debug' },
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
            id: 'inventory.confirm.queue',
            priority: 100,
            matches: (commandId) => commandId === 'confirm.queue' || commandId === 'icon.open.confirm-queue',
            run: (_commandId, ctx) => {
              ctx.dispatch(openWindow(buildConfirmQueueWindowPayload()));
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
            id: 'inventory.debug.timeline-debug',
            priority: 100,
            matches: (commandId) => commandId === 'debug.timeline-debug' || commandId === 'icon.open.timeline-debug',
            run: (_commandId, ctx) => {
              const convId = resolveEventViewerConversationId(ctx.getState?.(), ctx.focusedWindowId);
              if (!convId) {
                return 'pass';
              }
              ctx.dispatch(openWindow(buildTimelineDebugWindowPayload(convId)));
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
                  title: 'Redux Perf',
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
