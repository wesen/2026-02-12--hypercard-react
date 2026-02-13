import type { CrmStateSlice } from '../../domain/types';

export function selectContacts(state: CrmStateSlice) {
  return state.contacts.items;
}
