import { Act, type CardDefinition, Ev, Sel, ui } from '@hypercard/engine';
import type { CrmStateSlice } from '../types';
import { DEAL_COLUMNS, DEAL_FILTERS } from './common';

export const openDealsCard: CardDefinition<CrmStateSlice> = {
  id: 'openDeals',
  type: 'list',
  title: 'Open Deals',
  icon: '🔥',
  ui: ui.list({
    key: 'openDealsList',
    items: Sel('deals.open', undefined, { from: 'shared' }),
    columns: DEAL_COLUMNS,
    filters: DEAL_FILTERS,
    searchFields: ['title'],
    rowKey: 'id',
    toolbar: [
      { label: 'All Deals', action: Act('nav.go', { card: 'deals' }) },
      { label: 'Add Deal', action: Act('nav.go', { card: 'addDeal' }) },
    ],
    emptyMessage: 'No open deals. Time to prospect!',
  }),
  bindings: {
    openDealsList: {
      rowClick: Act('nav.go', { card: 'dealDetail', param: Ev('row.id') }),
    },
  },
};
