import type { AppStateKey } from './appManifest';

export interface LauncherRenderContext {
  dispatch: (action: unknown) => unknown;
  getState: () => unknown;
  moduleId: string;
  stateKey?: AppStateKey;
}
