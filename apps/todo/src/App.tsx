import { useSelector } from 'react-redux';
import { HyperCardShell } from '@hypercard/engine';
import { STACK } from './domain/stack';
import { todoActionHandler } from './app/domainActionHandler';
import { todoRenderers } from './overrides/cardRenderers';
import {
  selectTodoDomainData,
  type TodoDomainDataState,
} from './app/domainDataRegistry';

export function App() {
  const domainData = useSelector((s: TodoDomainDataState) => selectTodoDomainData(s));

  return (
    <HyperCardShell
      stack={STACK as any}
      domainActionHandler={todoActionHandler}
      customRenderers={todoRenderers}
      domainData={domainData}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'inProgress', icon: '🔥' },
      ]}
    />
  );
}
