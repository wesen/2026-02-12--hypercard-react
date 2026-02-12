import { useSelector } from 'react-redux';
import { HyperCardShell } from '@hypercard/engine';
import { STACK } from './domain/stack';
import { inventoryActionHandler } from './app/domainActionHandler';
import { inventoryRenderers } from './overrides/cardRenderers';
import {
  selectInventoryDomainData,
  type InventoryDomainDataState,
} from './app/domainDataRegistry';

export function App() {
  const domainData = useSelector((s: InventoryDomainDataState) => selectInventoryDomainData(s));

  return (
    <HyperCardShell
      stack={STACK as any}
      domainActionHandler={inventoryActionHandler}
      customRenderers={inventoryRenderers}
      domainData={domainData}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'report', icon: '📊' },
        { card: 'assistant', icon: '💬' },
      ]}
    />
  );
}
