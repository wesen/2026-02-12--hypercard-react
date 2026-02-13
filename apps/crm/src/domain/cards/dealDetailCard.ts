import { Act, Ev, Sel, ui, type CardDefinition } from '@hypercard/engine';
import { DEAL_DETAIL_FIELDS, DEAL_COMPUTED } from './common';
import type { CrmStateSlice } from '../types';

export const dealDetailCard: CardDefinition<CrmStateSlice> = {
  id: 'dealDetail',
  type: 'detail',
  title: 'Deal Detail',
  icon: '💰',
  state: { initial: { edits: {} } },
  ui: ui.detail({
    key: 'dealDetailView',
    record: Sel('deals.byParam', undefined, { from: 'shared' }),
    fields: DEAL_DETAIL_FIELDS,
    computed: DEAL_COMPUTED,
    edits: Sel('state.edits'),
    actions: [
      {
        label: 'Save',
        variant: 'primary',
        action: Act('deals.save', {
          id: Sel('deals.paramId', undefined, { from: 'shared' }),
          edits: Sel('state.edits'),
        }, { to: 'shared' }),
      },
      {
        label: 'Advance Stage',
        action: Act('deals.setStage', {
          id: Sel('deals.paramId', undefined, { from: 'shared' }),
          stage: 'negotiation',
        }, { to: 'shared' }),
      },
      {
        label: 'Mark Won',
        action: Act('deals.setStage', {
          id: Sel('deals.paramId', undefined, { from: 'shared' }),
          stage: 'closed-won',
        }, { to: 'shared' }),
      },
      {
        label: 'Mark Lost',
        variant: 'danger',
        action: Act('deals.setStage', {
          id: Sel('deals.paramId', undefined, { from: 'shared' }),
          stage: 'closed-lost',
        }, { to: 'shared' }),
      },
      {
        label: 'Delete',
        variant: 'danger',
        action: Act('deals.delete', {
          id: Sel('deals.paramId', undefined, { from: 'shared' }),
        }, { to: 'shared' }),
      },
    ],
  }),
  bindings: {
    dealDetailView: {
      change: Act('state.setField', {
        scope: 'card',
        path: 'edits',
        key: Ev('field'),
        value: Ev('value'),
      }),
    },
  },
};
