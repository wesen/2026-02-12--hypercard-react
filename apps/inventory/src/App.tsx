import { DesktopShell } from '@hypercard/engine';
import { inventorySharedActions, inventorySharedSelectors } from './app/cardRuntime';
import { STACK } from './domain/stack';

export function App() {
  return (
    <DesktopShell
      stack={STACK}
      sharedSelectors={inventorySharedSelectors}
      sharedActions={inventorySharedActions}
    />
  );
}
