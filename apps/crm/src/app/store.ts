import { chatSessionReducer, chatWindowReducer, timelineReducer } from '@hypercard/chat-runtime';
import { createAppStore } from '@hypercard/hypercard-runtime';
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
  chatWindow: chatWindowReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
