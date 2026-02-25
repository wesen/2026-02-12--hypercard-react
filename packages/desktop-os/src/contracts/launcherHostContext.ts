import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';

export interface LauncherHostContext {
  dispatch: (action: unknown) => unknown;
  getState: () => unknown;
  openWindow: (payload: OpenWindowPayload) => void;
  closeWindow: (windowId: string) => void;
  resolveApiBase: (appId: string) => string;
  resolveWsBase: (appId: string) => string;
}
