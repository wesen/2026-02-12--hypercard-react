import { Act, type CardDefinition, Ev, Sel, ui } from '@hypercard/engine';
import type { CrmStateSlice } from '../types';
import { DEAL_COLUMNS, DEAL_FILTERS } from './common';

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
