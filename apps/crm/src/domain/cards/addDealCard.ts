import { Act, Ev, Sel, ui, type CardDefinition } from '@hypercard/engine';
import { DEAL_FORM_FIELDS } from './common';
import type { CrmStateSlice } from '../types';

export const addDealCard: CardDefinition<CrmStateSlice> = {
  id: 'addDeal',
  type: 'form',
  title: 'Add Deal',
  icon: '➕',
  state: {
    initial: {
      formValues: { title: '', contactId: '', companyId: '', stage: 'qualification', value: 0, probability: 25, closeDate: '' },
      submitResult: '',
    },
  },
  ui: ui.form({
    key: 'addDealForm',
    fields: DEAL_FORM_FIELDS,
    values: Sel('state.formValues'),
    submitLabel: 'Create Deal',
    submitResult: Sel('state.submitResult'),
  }),
  bindings: {
    addDealForm: {
      change: Act('state.setField', {
        scope: 'card',
        path: 'formValues',
        key: Ev('field'),
        value: Ev('value'),
      }),
      submit: Act('deals.create', { values: Ev('values') }, { to: 'shared' }),
    },
  },
};
