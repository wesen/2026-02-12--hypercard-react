import { Act, type CardDefinition, Ev, Sel, ui } from '@hypercard/engine';
import type { CrmStateSlice } from '../types';
import { ACTIVITY_FORM_FIELDS } from './common';

export const addActivityCard: CardDefinition<CrmStateSlice> = {
  id: 'addActivity',
  type: 'form',
  title: 'Log Activity',
  icon: '📝',
  state: {
    initial: {
      formValues: { subject: '', type: 'note', contactId: '', dealId: '', date: '', notes: '' },
      submitResult: '',
    },
  },
  ui: ui.form({
    key: 'addActivityForm',
    fields: ACTIVITY_FORM_FIELDS,
    values: Sel('state.formValues'),
    submitLabel: 'Log Activity',
    submitResult: Sel('state.submitResult'),
  }),
  bindings: {
    addActivityForm: {
      change: Act('state.setField', {
        scope: 'card',
        path: 'formValues',
        key: Ev('field'),
        value: Ev('value'),
      }),
      submit: Act('activities.create', { values: Ev('values') }, { to: 'shared' }),
    },
  },
};
