import { HyperCardShell } from '@hypercard/engine';
import { todoSharedActions, todoSharedSelectors } from './app/cardRuntime';
import { STACK } from './domain/stack';

export function App() {
  return (
    <HyperCardShell
      stack={STACK}
      sharedSelectors={todoSharedSelectors}
      sharedActions={todoSharedActions}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'inProgress', icon: '🔥' },
      ]}
    />
  );
}
