import { Act, type CardDefinition, Ev, Sel, ui } from '@hypercard/engine';
import type { CrmStateSlice } from '../types';
import { CONTACT_FORM_FIELDS } from './common';

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
