import { DesktopShell } from '@hypercard/engine';
import { STACK } from './domain/stack';

export function App() {
  return <DesktopShell stack={STACK} />;
}
