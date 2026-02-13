import { HyperCardShell } from '@hypercard/engine';
import { inventorySharedActions, inventorySharedSelectors } from './app/cardRuntime';
import { STACK } from './domain/stack';

export function App() {
  return (
    <HyperCardShell
      stack={STACK}
      sharedSelectors={inventorySharedSelectors}
      sharedActions={inventorySharedActions}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'report', icon: '📊' },
        { card: 'assistant', icon: '💬' },
      ]}
    />
  );
}
