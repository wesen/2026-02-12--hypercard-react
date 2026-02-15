import { DesktopShell } from '@hypercard/engine';
import { todoSharedActions, todoSharedSelectors } from './app/cardRuntime';
import { STACK } from './domain/stack';

export function App() {
  return <DesktopShell stack={STACK} sharedSelectors={todoSharedSelectors} sharedActions={todoSharedActions} />;
}
