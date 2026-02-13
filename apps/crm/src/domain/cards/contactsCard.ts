import { Act, Ev, Sel, ui, type CardDefinition } from '@hypercard/engine';
import { CONTACT_COLUMNS, CONTACT_FILTERS } from './common';
import type { CrmStateSlice } from '../types';

export const contactsCard: CardDefinition<CrmStateSlice> = {
  id: 'contacts',
  type: 'list',
  title: 'Contacts',
  icon: '👤',
  ui: ui.list({
    key: 'contactsList',
    items: Sel('contacts.all', undefined, { from: 'shared' }),
    columns: CONTACT_COLUMNS,
    filters: CONTACT_FILTERS,
    searchFields: ['name', 'email'],
    rowKey: 'id',
    toolbar: [
      { label: 'Add Contact', action: Act('nav.go', { card: 'addContact' }) },
      { label: 'Reset', action: Act('contacts.reset', undefined, { to: 'shared' }) },
    ],
  }),
  bindings: {
    contactsList: {
      rowClick: Act('nav.go', { card: 'contactDetail', param: Ev('row.id') }),
    },
  },
};
