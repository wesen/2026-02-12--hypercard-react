import { type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { PluginCardSessionHost } from '@hypercard/engine/desktop-hypercard-adapter';
import { type DesktopContribution, type WindowContentAdapter } from '@hypercard/engine/desktop-react';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createCrmStore } from '../app/store';
import { STACK } from '../domain/stack';
import { CrmRealAppWindow } from './renderCrmApp';

const launcherStateSlice = createSlice({
  name: 'crmLauncher',
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

const CRM_WORKSPACE_INSTANCE_PREFIX = 'workspace-';
const CRM_SESSION_PREFIX = 'crm-session:';

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `crm-${Date.now()}`;
}

function buildWorkspaceWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = `${CRM_WORKSPACE_INSTANCE_PREFIX}${nextInstanceId()}`;
  return {
    id: `window:crm:${instanceId}`,
    title: 'CRM',
    icon: '📇',
    bounds: {
      x: 210,
      y: 60,
      w: 1040,
      h: 720,
    },
    content: {
      kind: 'card',
      card: {
        stackId: STACK.id,
        cardId: STACK.homeCard,
        cardSessionId: `${CRM_SESSION_PREFIX}${instanceId}`,
      },
    },
    dedupeKey: reason === 'startup' ? 'crm:startup' : undefined,
  };
}

function createCrmCardAdapter(): WindowContentAdapter {
  return {
    id: 'crm.card-window',
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

function CrmLauncherAppHost() {
  const storeRef = useRef<ReturnType<typeof createCrmStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createCrmStore();
  }
  return (
    <Provider store={storeRef.current}>
      <CrmRealAppWindow />
    </Provider>
  );
}

export const crmLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'crm',
    name: 'CRM',
    icon: '📇',
    launch: { mode: 'window' },
    desktop: {
      order: 30,
    },
  },
  state: {
    stateKey: 'app_crm',
    reducer: launcherStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(launcherStateSlice.actions.markLaunched(reason));
    return buildWorkspaceWindowPayload(reason);
  },
  createContributions: (): DesktopContribution[] => [
    {
      id: 'crm.window-adapters',
      windowContentAdapters: [createCrmCardAdapter()],
    },
  ],
  renderWindow: ({ windowId }): ReactNode => <CrmLauncherAppHost key={windowId} />,
};
