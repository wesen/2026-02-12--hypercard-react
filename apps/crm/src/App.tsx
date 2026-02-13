import { HyperCardShell } from '@hypercard/engine';
import { crmSharedActions, crmSharedSelectors } from './app/cardRuntime';
import { DebugPane } from './debug/DebugPane';
import { useRuntimeDebugHooks } from './debug/useRuntimeDebugHooks';
import { CRM_STACK } from './domain/stack';

export function App() {
  const debugHooks = useRuntimeDebugHooks();

  return (
    <HyperCardShell
      stack={CRM_STACK}
      sharedSelectors={crmSharedSelectors}
      sharedActions={crmSharedActions}
      debugHooks={debugHooks}
      layoutMode="debugPane"
      renderDebugPane={() => <DebugPane />}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'contacts', icon: '👤' },
        { card: 'companies', icon: '🏢' },
        { card: 'deals', icon: '💰' },
        { card: 'pipeline', icon: '📊' },
        { card: 'activityLog', icon: '📝' },
      ]}
    />
  );
}
