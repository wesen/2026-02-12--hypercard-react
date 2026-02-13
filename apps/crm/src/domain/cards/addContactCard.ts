import { Act, Ev, Sel, ui, type CardDefinition } from '@hypercard/engine';
import { CONTACT_FORM_FIELDS } from './common';
import type { CrmStateSlice } from '../types';

export const addContactCard: CardDefinition<CrmStateSlice> = {
  id: 'addContact',
  type: 'form',
  title: 'Add Contact',
  icon: '➕',
  state: {
    initial: {
      formValues: { name: '', email: '', phone: '', companyId: '', status: 'lead' },
      submitResult: '',
    },
  },
  ui: ui.form({
    key: 'addContactForm',
    fields: CONTACT_FORM_FIELDS,
    values: Sel('state.formValues'),
    submitLabel: 'Add Contact',
    submitResult: Sel('state.submitResult'),
  }),
  bindings: {
    addContactForm: {
      change: Act('state.setField', {
        scope: 'card',
        path: 'formValues',
        key: Ev('field'),
        value: Ev('value'),
      }),
      submit: Act('contacts.create', { values: Ev('values') }, { to: 'shared' }),
    },
  },
};
