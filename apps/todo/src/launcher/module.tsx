import { type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { PluginCardSessionHost } from '@hypercard/engine/desktop-hypercard-adapter';
import { type DesktopContribution, type WindowContentAdapter } from '@hypercard/engine/desktop-react';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createTodoStore } from '../app/store';
import { STACK } from '../domain/stack';
import { TodoRealAppWindow } from './renderTodoApp';

const launcherStateSlice = createSlice({
  name: 'todoLauncher',
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

const TODO_WORKSPACE_INSTANCE_PREFIX = 'workspace-';
const TODO_SESSION_PREFIX = 'todo-session:';

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `todo-${Date.now()}`;
}

function buildWorkspaceWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = `${TODO_WORKSPACE_INSTANCE_PREFIX}${nextInstanceId()}`;
  return {
    id: `window:todo:${instanceId}`,
    title: 'Todo',
    icon: '✅',
    bounds: {
      x: 180,
      y: 56,
      w: 980,
      h: 700,
    },
    content: {
      kind: 'card',
      card: {
        stackId: STACK.id,
        cardId: STACK.homeCard,
        cardSessionId: `${TODO_SESSION_PREFIX}${instanceId}`,
      },
    },
    dedupeKey: reason === 'startup' ? 'todo:startup' : undefined,
  };
}

function createTodoCardAdapter(): WindowContentAdapter {
  return {
    id: 'todo.card-window',
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

function TodoLauncherAppHost() {
  const storeRef = useRef<ReturnType<typeof createTodoStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createTodoStore();
  }
  return (
    <Provider store={storeRef.current}>
      <TodoRealAppWindow />
    </Provider>
  );
}

export const todoLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'todo',
    name: 'Todo',
    icon: '✅',
    launch: { mode: 'window' },
    desktop: {
      order: 20,
    },
  },
  state: {
    stateKey: 'app_todo',
    reducer: launcherStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(launcherStateSlice.actions.markLaunched(reason));
    return buildWorkspaceWindowPayload(reason);
  },
  createContributions: (): DesktopContribution[] => [
    {
      id: 'todo.window-adapters',
      windowContentAdapters: [createTodoCardAdapter()],
    },
  ],
  renderWindow: ({ windowId }): ReactNode => <TodoLauncherAppHost key={windowId} />,
};
