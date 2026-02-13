import { Act, Ev, Sel, ui, type CardDefinition } from '@hypercard/engine';
import { COMPANY_COLUMNS, COMPANY_FILTERS } from './common';
import type { CrmStateSlice } from '../types';

export const companiesCard: CardDefinition<CrmStateSlice> = {
  id: 'companies',
  type: 'list',
  title: 'Companies',
  icon: '🏢',
  ui: ui.list({
    key: 'companiesList',
    items: Sel('companies.all', undefined, { from: 'shared' }),
    columns: COMPANY_COLUMNS,
    filters: COMPANY_FILTERS,
    searchFields: ['name', 'industry'],
    rowKey: 'id',
    toolbar: [
      { label: 'Reset', action: Act('companies.reset', undefined, { to: 'shared' }) },
    ],
  }),
  bindings: {
    companiesList: {
      rowClick: Act('nav.go', { card: 'companyDetail', param: Ev('row.id') }),
    },
  },
};
