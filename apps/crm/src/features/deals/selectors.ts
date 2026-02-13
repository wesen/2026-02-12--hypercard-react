import type { CrmStateSlice } from '../../domain/types';

export function selectDeals(state: CrmStateSlice) {
  return state.deals.items;
}
