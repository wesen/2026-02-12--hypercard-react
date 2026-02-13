import { Act, type CardDefinition, Ev, Sel, ui } from '@hypercard/engine';
import type { CrmStateSlice } from '../types';
import { CONTACT_COMPUTED, CONTACT_DETAIL_FIELDS } from './common';

export const contactDetailCard: CardDefinition<CrmStateSlice> = {
  id: 'contactDetail',
  type: 'detail',
  title: 'Contact Detail',
  icon: '👤',
  state: { initial: { edits: {} } },
  ui: ui.detail({
    key: 'contactDetailView',
    record: Sel('contacts.byParam', undefined, { from: 'shared' }),
    fields: CONTACT_DETAIL_FIELDS,
    computed: CONTACT_COMPUTED,
    edits: Sel('state.edits'),
    actions: [
      {
        label: 'Save',
        variant: 'primary',
        action: Act(
          'contacts.save',
          {
            id: Sel('contacts.paramId', undefined, { from: 'shared' }),
            edits: Sel('state.edits'),
          },
          { to: 'shared' },
        ),
      },
      {
        label: 'Promote to Customer',
        action: Act(
          'contacts.setStatus',
          {
            id: Sel('contacts.paramId', undefined, { from: 'shared' }),
            status: 'customer',
          },
          { to: 'shared' },
        ),
      },
      {
        label: 'View Deals',
        action: Act('nav.go', { card: 'deals' }),
      },
      {
        label: 'Delete',
        variant: 'danger',
        action: Act(
          'contacts.delete',
          {
            id: Sel('contacts.paramId', undefined, { from: 'shared' }),
          },
          { to: 'shared' },
        ),
      },
    ],
  }),
  bindings: {
    contactDetailView: {
      change: Act('state.setField', {
        scope: 'card',
        path: 'edits',
        key: Ev('field'),
        value: Ev('value'),
      }),
    },
  },
};
