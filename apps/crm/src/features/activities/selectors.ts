import type { CrmStateSlice } from '../../domain/types';

export function selectActivities(state: CrmStateSlice) {
  return state.activities.items;
}
