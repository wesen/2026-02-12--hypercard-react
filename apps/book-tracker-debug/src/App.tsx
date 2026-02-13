import { HyperCardShell, StandardDebugPane, useStandardDebugHooks } from '@hypercard/engine';
import { bookSharedActions, bookSharedSelectors } from './app/cardRuntime';
import { BOOK_STACK } from './domain/stack';

const snapshotSelector = (state: any) => ({
  navigation: state.navigation,
  books: state.books,
  runtime: state.hypercardRuntime,
});

export function App() {
  const debugHooks = useStandardDebugHooks();

  return (
    <HyperCardShell
      stack={BOOK_STACK}
      sharedSelectors={bookSharedSelectors}
      sharedActions={bookSharedActions}
      debugHooks={debugHooks}
      layoutMode="debugPane"
      renderDebugPane={() => <StandardDebugPane title="Book Tracker Debug" snapshotSelector={snapshotSelector} />}
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
