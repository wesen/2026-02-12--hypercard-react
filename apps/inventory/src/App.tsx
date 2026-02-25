import { formatAppKey, type LauncherRenderContext } from '@hypercard/desktop-os';
import { inventoryLauncherModule } from './launcher/module';

const STANDALONE_INSTANCE_ID = 'standalone';
const STANDALONE_WINDOW_ID = `window:inventory:${STANDALONE_INSTANCE_ID}`;

const standaloneRenderContext: LauncherRenderContext = {
  dispatch: () => undefined,
  getState: () => ({}),
  moduleId: inventoryLauncherModule.manifest.id,
  stateKey: inventoryLauncherModule.state?.stateKey,
};

export function App() {
  const appId = inventoryLauncherModule.manifest.id;
  const appKey = formatAppKey(appId, STANDALONE_INSTANCE_ID);

  return (
    inventoryLauncherModule.renderWindow({
      appId,
      appKey,
      instanceId: STANDALONE_INSTANCE_ID,
      windowId: STANDALONE_WINDOW_ID,
      ctx: standaloneRenderContext,
    }) ?? null
  );
}
