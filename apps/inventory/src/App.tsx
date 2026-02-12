import { useSelector } from 'react-redux';
import { HyperCardShell } from '@hypercard/engine';
import { STACK } from './domain/stack';
import { inventoryActionHandler } from './app/domainActionHandler';
import { inventoryRenderers } from './overrides/cardRenderers';
import { selectItems, type InventoryStateSlice } from './features/inventory/selectors';
import { selectSalesLog, type SalesStateSlice } from './features/sales/selectors';

type AppState = InventoryStateSlice & SalesStateSlice;

export function App() {
  const items = useSelector((s: AppState) => selectItems(s));
  const sales = useSelector((s: AppState) => selectSalesLog(s));

  return (
    <HyperCardShell
      stack={STACK as any}
      domainActionHandler={inventoryActionHandler}
      customRenderers={inventoryRenderers}
      domainData={{ items, salesLog: sales }}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'report', icon: '📊' },
        { card: 'assistant', icon: '💬' },
      ]}
    />
  );
}
