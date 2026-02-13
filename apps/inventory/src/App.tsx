import { HyperCardShell } from '@hypercard/engine';
import { STACK } from './domain/stack';
import { inventorySharedActions, inventorySharedSelectors } from './app/cardRuntime';

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
