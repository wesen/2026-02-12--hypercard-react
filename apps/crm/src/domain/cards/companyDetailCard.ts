import { Act, type CardDefinition, Ev, Sel, ui } from '@hypercard/engine';
import type { CrmStateSlice } from '../types';
import { COMPANY_COMPUTED, COMPANY_DETAIL_FIELDS } from './common';

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
        action: Act(
          'companies.save',
          {
            id: Sel('companies.paramId', undefined, { from: 'shared' }),
            edits: Sel('state.edits'),
          },
          { to: 'shared' },
        ),
      },
      {
        label: 'Delete',
        variant: 'danger',
        action: Act(
          'companies.delete',
          {
            id: Sel('companies.paramId', undefined, { from: 'shared' }),
          },
          { to: 'shared' },
        ),
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
