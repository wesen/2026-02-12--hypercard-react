import { chatSessionReducer, createAppStore, timelineReducer } from '@hypercard/engine';
import { activitiesReducer } from '../features/activities/activitiesSlice';
import { companiesReducer } from '../features/companies/companiesSlice';
import { contactsReducer } from '../features/contacts/contactsSlice';
import { dealsReducer } from '../features/deals/dealsSlice';

export const { store, createStore: createCrmStore } = createAppStore({
  contacts: contactsReducer,
  companies: companiesReducer,
  deals: dealsReducer,
  activities: activitiesReducer,
  timeline: timelineReducer,
  chatSession: chatSessionReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
