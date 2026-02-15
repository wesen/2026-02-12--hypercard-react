import { DesktopShell, useStandardDebugHooks } from '@hypercard/engine';
import { bookSharedActions, bookSharedSelectors } from './app/cardRuntime';
import { BOOK_STACK } from './domain/stack';

export function App() {
  const debugHooks = useStandardDebugHooks();

  return (
    <DesktopShell
      stack={BOOK_STACK}
      sharedSelectors={bookSharedSelectors}
      sharedActions={bookSharedActions}
      debugHooks={debugHooks}
    />
  );
}
