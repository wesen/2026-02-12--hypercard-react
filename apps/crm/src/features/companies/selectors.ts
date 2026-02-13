import type { CrmStateSlice } from '../../domain/types';

export function selectCompanies(state: CrmStateSlice) {
  return state.companies.items;
}
