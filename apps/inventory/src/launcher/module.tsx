import type { LaunchableAppModule, LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import {
  buildInventoryLaunchWindowPayload,
  createInventoryContributions,
  INVENTORY_API_BASE_PREFIX_FALLBACK,
  type InventoryLauncherAppWindowProps,
  InventoryLauncherAppWindow,
} from './renderInventoryApp';

const launcherStateSlice = createSlice({
  name: 'inventoryLauncher',
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

function buildLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  return buildInventoryLaunchWindowPayload(reason);
}

export const inventoryLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'inventory',
    name: 'Inventory',
    icon: '📦',
    launch: { mode: 'window' },
    desktop: {
      order: 10,
    },
  },
  state: {
    stateKey: 'app_inventory',
    reducer: launcherStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(launcherStateSlice.actions.markLaunched(reason));
    return buildLaunchWindowPayload(reason);
  },
  createContributions: (ctx) => createInventoryContributions(ctx),
  renderWindow: ({ instanceId, ctx }): ReactNode => {
    const apiBasePrefix =
      ctx.resolveApiBase?.('inventory') ??
      ctx.resolveWsBase?.('inventory')?.replace(/\/ws$/, '') ??
      INVENTORY_API_BASE_PREFIX_FALLBACK;
    const props: InventoryLauncherAppWindowProps = {
      instanceId,
      apiBasePrefix,
    };
    return <InventoryLauncherAppWindow {...props} />;
  },
};
