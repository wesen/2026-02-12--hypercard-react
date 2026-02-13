import { type CardStackDefinition, defineCardStack } from '@hypercard/engine';
import {
  activityLogCard,
  addActivityCard,
  addContactCard,
  addDealCard,
  companiesCard,
  companyDetailCard,
  contactDetailCard,
  contactsCard,
  dealDetailCard,
  dealsCard,
  homeCard,
  openDealsCard,
  pipelineCard,
} from './cards';
import type { CrmStateSlice } from './types';

export const CRM_STACK: CardStackDefinition<CrmStateSlice> = defineCardStack({
  id: 'crm',
  name: 'CRM',
  icon: '💼',
  homeCard: 'home',
  cards: {
    home: homeCard,
    contacts: contactsCard,
    contactDetail: contactDetailCard,
    addContact: addContactCard,
    companies: companiesCard,
    companyDetail: companyDetailCard,
    deals: dealsCard,
    openDeals: openDealsCard,
    dealDetail: dealDetailCard,
    addDeal: addDealCard,
    pipeline: pipelineCard,
    activityLog: activityLogCard,
    addActivity: addActivityCard,
  },
});
