import {
  DesktopShell,
  useStandardDebugHooks,
} from '@hypercard/engine';
import { crmSharedActions, crmSharedSelectors } from './app/cardRuntime';
import { CRM_STACK } from './domain/stack';

export function App() {
  const debugHooks = useStandardDebugHooks();

  return (
    <DesktopShell
      stack={CRM_STACK}
      sharedSelectors={crmSharedSelectors}
      sharedActions={crmSharedActions}
      debugHooks={debugHooks}
    />
  );
}
