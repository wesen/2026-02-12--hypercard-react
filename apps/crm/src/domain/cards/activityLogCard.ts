import { Act, type CardDefinition, Sel, ui } from '@hypercard/engine';
import type { CrmStateSlice } from '../types';
import { ACTIVITY_COLUMNS, ACTIVITY_FILTERS } from './common';

export const activityLogCard: CardDefinition<CrmStateSlice> = {
  id: 'activityLog',
  type: 'list',
  title: 'Activity Log',
  icon: '📝',
  ui: ui.list({
    key: 'activityLogList',
    items: Sel('activities.recent', undefined, { from: 'shared' }),
    columns: ACTIVITY_COLUMNS,
    filters: ACTIVITY_FILTERS,
    searchFields: ['subject', 'notes'],
    rowKey: 'id',
    toolbar: [
      { label: 'Log Activity', action: Act('nav.go', { card: 'addActivity' }) },
      { label: 'Reset', action: Act('activities.reset', undefined, { to: 'shared' }) },
    ],
    emptyMessage: 'No activities recorded yet.',
  }),
  bindings: {
    activityLogList: {
      rowClick: Act('nav.go', { card: 'home' }),
    },
  },
};
