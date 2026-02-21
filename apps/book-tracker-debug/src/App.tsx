import { DesktopShell } from '@hypercard/engine/desktop-react';
import { STACK } from './domain/stack';

export function App() {
  return <DesktopShell stack={STACK} />;
}
