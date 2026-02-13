import { HyperCardShell } from '@hypercard/engine';
import { bookSharedActions, bookSharedSelectors } from './app/cardRuntime';
import { DebugPane } from './debug/DebugPane';
import { useRuntimeDebugHooks } from './debug/useRuntimeDebugHooks';
import { BOOK_STACK } from './domain/stack';

export function App() {
  const debugHooks = useRuntimeDebugHooks();

  return (
    <HyperCardShell
      stack={BOOK_STACK}
      sharedSelectors={bookSharedSelectors}
      sharedActions={bookSharedActions}
      debugHooks={debugHooks}
      renderAIPanel={() => <DebugPane />}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'readingNow', icon: '🔥' },
        { card: 'readingReport', icon: '📊' },
        { card: 'addBook', icon: '➕' },
      ]}
    />
  );
}
