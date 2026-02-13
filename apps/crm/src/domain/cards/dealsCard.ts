import { Act, Ev, Sel, ui, type CardDefinition } from '@hypercard/engine';
import { DEAL_COLUMNS, DEAL_FILTERS } from './common';
import type { CrmStateSlice } from '../types';

export const dealsCard: CardDefinition<CrmStateSlice> = {
  id: 'deals',
  type: 'list',
  title: 'Deals',
  icon: '💰',
  ui: ui.list({
    key: 'dealsList',
    items: Sel('deals.all', undefined, { from: 'shared' }),
    columns: DEAL_COLUMNS,
    filters: DEAL_FILTERS,
    searchFields: ['title'],
    rowKey: 'id',
    toolbar: [
      { label: 'Add Deal', action: Act('nav.go', { card: 'addDeal' }) },
      { label: 'Open Only', action: Act('nav.go', { card: 'openDeals' }) },
      { label: 'Reset', action: Act('deals.reset', undefined, { to: 'shared' }) },
    ],
  }),
  bindings: {
    dealsList: {
      rowClick: Act('nav.go', { card: 'dealDetail', param: Ev('row.id') }),
    },
  },
};
