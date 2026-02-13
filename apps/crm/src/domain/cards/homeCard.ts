import { Act, type CardDefinition, ui } from '@hypercard/engine';
import type { CrmStateSlice } from '../types';

export const homeCard: CardDefinition<CrmStateSlice> = {
  id: 'home',
  type: 'menu',
  title: 'CRM Home',
  icon: '🏠',
  ui: ui.menu({
    key: 'homeMenu',
    icon: '💼',
    labels: [{ value: 'CRM Dashboard' }, { value: 'Contacts · Companies · Deals · Activities', style: 'muted' }],
    buttons: [
      { label: '👤 Contacts', action: Act('nav.go', { card: 'contacts' }) },
      { label: '🏢 Companies', action: Act('nav.go', { card: 'companies' }) },
      { label: '💰 Deals', action: Act('nav.go', { card: 'deals' }) },
      { label: '📊 Pipeline Report', action: Act('nav.go', { card: 'pipeline' }) },
      { label: '📝 Activity Log', action: Act('nav.go', { card: 'activityLog' }) },
      { label: '➕ New Contact', action: Act('nav.go', { card: 'addContact' }) },
      { label: '➕ New Deal', action: Act('nav.go', { card: 'addDeal' }) },
      { label: '➕ Log Activity', action: Act('nav.go', { card: 'addActivity' }) },
      { label: '🔄 Reset Demo Data', action: Act('crm.resetAll', undefined, { to: 'shared' }) },
    ],
  }),
};
