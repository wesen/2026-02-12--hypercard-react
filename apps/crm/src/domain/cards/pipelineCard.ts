import { Act, Sel, ui, type CardDefinition } from '@hypercard/engine';
import type { CrmStateSlice } from '../types';

export const pipelineCard: CardDefinition<CrmStateSlice> = {
  id: 'pipeline',
  type: 'report',
  title: 'Pipeline Report',
  icon: '📊',
  ui: ui.report({
    key: 'pipelineReportView',
    sections: Sel('pipeline.reportSections', undefined, { from: 'shared' }),
    actions: [
      { label: 'View Deals', action: Act('nav.go', { card: 'deals' }) },
      { label: 'View Contacts', action: Act('nav.go', { card: 'contacts' }) },
      { label: 'Reset All', action: Act('crm.resetAll', undefined, { to: 'shared' }) },
    ],
  }),
};
