import { type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { PluginCardSessionHost } from '@hypercard/engine/desktop-hypercard-adapter';
import { type DesktopContribution, type WindowContentAdapter } from '@hypercard/engine/desktop-react';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createBookStore } from '../app/store';
import { STACK } from '../domain/stack';
import { BookTrackerRealAppWindow } from './renderBookTrackerApp';

const launcherStateSlice = createSlice({
  name: 'bookTrackerLauncher',
  initialState: {
    launchCount: 0,
    lastLaunchReason: null as LaunchReason | null,
  },
  reducers: {
    markLaunched(state, action: PayloadAction<LaunchReason>) {
      state.launchCount += 1;
      state.lastLaunchReason = action.payload;
    },
  },
});

const BOOK_TRACKER_WORKSPACE_INSTANCE_PREFIX = 'workspace-';
const BOOK_TRACKER_SESSION_PREFIX = 'book-tracker-session:';

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `book-tracker-${Date.now()}`;
}

function buildWorkspaceWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = `${BOOK_TRACKER_WORKSPACE_INSTANCE_PREFIX}${nextInstanceId()}`;
  return {
    id: `window:book-tracker-debug:${instanceId}`,
    title: 'Book Tracker',
    icon: '📚',
    bounds: {
      x: 260,
      y: 88,
      w: 980,
      h: 700,
    },
    content: {
      kind: 'card',
      card: {
        stackId: STACK.id,
        cardId: STACK.homeCard,
        cardSessionId: `${BOOK_TRACKER_SESSION_PREFIX}${instanceId}`,
      },
    },
    dedupeKey: reason === 'startup' ? 'book-tracker-debug:startup' : undefined,
  };
}

function createBookTrackerCardAdapter(): WindowContentAdapter {
  return {
    id: 'book-tracker-debug.card-window',
    canRender: (window) => window.content.kind === 'card' && window.content.card?.stackId === STACK.id,
    render: (window) => {
      const cardRef = window.content.card;
      if (window.content.kind !== 'card' || !cardRef || cardRef.stackId !== STACK.id) {
        return null;
      }
      return <PluginCardSessionHost windowId={window.id} sessionId={cardRef.cardSessionId} stack={STACK} />;
    },
  };
}

function BookTrackerLauncherAppHost() {
  const storeRef = useRef<ReturnType<typeof createBookStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createBookStore();
  }
  return (
    <Provider store={storeRef.current}>
      <BookTrackerRealAppWindow />
    </Provider>
  );
}

export const bookTrackerLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'book-tracker-debug',
    name: 'Book Tracker',
    icon: '📚',
    launch: { mode: 'window' },
    desktop: {
      order: 40,
    },
  },
  state: {
    stateKey: 'app_book_tracker_debug',
    reducer: launcherStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(launcherStateSlice.actions.markLaunched(reason));
    return buildWorkspaceWindowPayload(reason);
  },
  createContributions: (): DesktopContribution[] => [
    {
      id: 'book-tracker-debug.window-adapters',
      windowContentAdapters: [createBookTrackerCardAdapter()],
    },
  ],
  renderWindow: ({ windowId }): ReactNode => <BookTrackerLauncherAppHost key={windowId} />,
};
