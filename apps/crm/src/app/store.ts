import { configureStore } from '@reduxjs/toolkit';
import {
  hypercardRuntimeReducer,
  navigationReducer,
  notificationsReducer,
} from '@hypercard/engine';
import { contactsReducer } from '../features/contacts/contactsSlice';
import { companiesReducer } from '../features/companies/companiesSlice';
import { dealsReducer } from '../features/deals/dealsSlice';
import { activitiesReducer } from '../features/activities/activitiesSlice';
import { debugReducer } from '../debug/debugSlice';

export function createAppStore() {
  return configureStore({
    reducer: {
      hypercardRuntime: hypercardRuntimeReducer,
      navigation: navigationReducer,
      notifications: notificationsReducer,
      contacts: contactsReducer,
      companies: companiesReducer,
      deals: dealsReducer,
      activities: activitiesReducer,
      debug: debugReducer,
    },
  });
}

export const store = createAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
