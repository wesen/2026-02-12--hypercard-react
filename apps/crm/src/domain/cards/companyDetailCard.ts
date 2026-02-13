import { Act, Ev, Sel, ui, type CardDefinition } from '@hypercard/engine';
import { COMPANY_DETAIL_FIELDS, COMPANY_COMPUTED } from './common';
import type { CrmStateSlice } from '../types';

export const companyDetailCard: CardDefinition<CrmStateSlice> = {
  id: 'companyDetail',
  type: 'detail',
  title: 'Company Detail',
  icon: '🏢',
  state: { initial: { edits: {} } },
  ui: ui.detail({
    key: 'companyDetailView',
    record: Sel('companies.byParam', undefined, { from: 'shared' }),
    fields: COMPANY_DETAIL_FIELDS,
    computed: COMPANY_COMPUTED,
    edits: Sel('state.edits'),
    actions: [
      {
        label: 'Save',
        variant: 'primary',
        action: Act('companies.save', {
          id: Sel('companies.paramId', undefined, { from: 'shared' }),
          edits: Sel('state.edits'),
        }, { to: 'shared' }),
      },
      {
        label: 'Delete',
        variant: 'danger',
        action: Act('companies.delete', {
          id: Sel('companies.paramId', undefined, { from: 'shared' }),
        }, { to: 'shared' }),
      },
    ],
  }),
  bindings: {
    companyDetailView: {
      change: Act('state.setField', {
        scope: 'card',
        path: 'edits',
        key: Ev('field'),
        value: Ev('value'),
      }),
    },
  },
};
