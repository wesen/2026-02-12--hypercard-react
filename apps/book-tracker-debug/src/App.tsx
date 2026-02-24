import { formatAppKey, type LauncherRenderContext } from '@hypercard/desktop-os';
import { bookTrackerLauncherModule } from './launcher/module';

const STANDALONE_INSTANCE_ID = 'standalone';
const STANDALONE_WINDOW_ID = `window:book-tracker-debug:${STANDALONE_INSTANCE_ID}`;

const standaloneRenderContext: LauncherRenderContext = {
  dispatch: () => undefined,
  getState: () => ({}),
  moduleId: bookTrackerLauncherModule.manifest.id,
  stateKey: bookTrackerLauncherModule.state?.stateKey,
};

export function App() {
  const appId = bookTrackerLauncherModule.manifest.id;
  const appKey = formatAppKey(appId, STANDALONE_INSTANCE_ID);

  return (
    bookTrackerLauncherModule.renderWindow({
      appId,
      appKey,
      instanceId: STANDALONE_INSTANCE_ID,
      windowId: STANDALONE_WINDOW_ID,
      ctx: standaloneRenderContext,
    }) ?? null
  );
}
