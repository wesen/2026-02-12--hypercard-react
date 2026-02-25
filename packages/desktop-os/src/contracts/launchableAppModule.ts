import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { DesktopContribution } from '@hypercard/engine/desktop-react';
import type { Reducer } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import type { AppManifest, AppStateKey, LaunchReason } from './appManifest';
import type { LauncherHostContext } from './launcherHostContext';
import type { LauncherRenderContext } from './launcherRenderContext';

export interface LaunchableAppStateConfig {
  stateKey: AppStateKey;
  reducer: Reducer;
}

export interface LaunchableAppRenderParams {
  appId: string;
  instanceId: string;
  appKey: string;
  windowId: string;
  ctx: LauncherRenderContext;
}

export interface LaunchableAppModule {
  manifest: AppManifest;
  state?: LaunchableAppStateConfig;
  buildLaunchWindow: (ctx: LauncherHostContext, reason: LaunchReason) => OpenWindowPayload;
  createContributions?: (ctx: LauncherHostContext) => DesktopContribution[];
  renderWindow: (params: LaunchableAppRenderParams) => ReactNode | null;
  onRegister?: (ctx: LauncherHostContext) => void;
}
