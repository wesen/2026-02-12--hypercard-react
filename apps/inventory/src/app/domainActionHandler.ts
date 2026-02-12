import type { DomainActionHandler } from '@hypercard/engine';
import { goBack, showToast } from '@hypercard/engine';
import { updateQty, saveItem, deleteItem, createItem, receiveStock } from '../features/inventory/inventorySlice';

export const inventoryActionHandler: DomainActionHandler = (action, dispatch) => {
  const a = action as Record<string, unknown>;
  switch (action.type) {
    case 'updateQty':
      dispatch(updateQty({ sku: a.sku as string, delta: a.delta as number }));
      dispatch(showToast(`${(a.delta as number) > 0 ? '+' : ''}${a.delta} qty for ${a.sku}`));
      return true;
    case 'saveItem':
      dispatch(saveItem({ sku: a.sku as string, edits: (a.edits ?? {}) as Record<string, unknown> }));
      dispatch(showToast(`Saved ${a.sku}`));
      return true;
    case 'deleteItem':
      dispatch(deleteItem({ sku: a.sku as string }));
      dispatch(goBack());
      dispatch(showToast(`Deleted ${a.sku}`));
      return true;
    case 'createItem':
      dispatch(createItem(a.values as any));
      dispatch(showToast(`Created ${(a.values as any)?.sku}`));
      return true;
    case 'receiveStock': {
      const vals = a.values as { sku?: string; qty?: number } | undefined;
      if (vals?.sku && vals?.qty) {
        dispatch(receiveStock({ sku: vals.sku, qty: Number(vals.qty) }));
        dispatch(showToast(`Received +${vals.qty} for ${vals.sku}`));
      }
      return true;
    }
    default:
      return false;
  }
};
