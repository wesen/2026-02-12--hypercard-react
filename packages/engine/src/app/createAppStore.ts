import { configureStore, type Reducer } from '@reduxjs/toolkit';
import { hypercardRuntimeReducer } from '../cards/runtimeStateSlice';
import { debugReducer } from '../debug/debugSlice';
import { navigationReducer } from '../features/navigation/navigationSlice';
import { notificationsReducer } from '../features/notifications/notificationsSlice';

/**
 * Creates a Redux store factory pre-wired with all HyperCard engine reducers
 * (hypercardRuntime, navigation, notifications, debug).
 *
 * Returns both a singleton store and a createStore() factory for Storybook.
 *
 * @example
 * ```ts
 * const { store, createStore } = createAppStore({
 *   contacts: contactsReducer,
 *   companies: companiesReducer,
 * });
 * ```
 */
export function createAppStore<T extends Record<string, Reducer>>(domainReducers: T) {
  const reducer = {
    hypercardRuntime: hypercardRuntimeReducer,
    navigation: navigationReducer,
    notifications: notificationsReducer,
    debug: debugReducer,
    ...domainReducers,
  };

  function createStore() {
    return configureStore({ reducer });
  }

  const store = createStore();

  type AppStore = ReturnType<typeof createStore>;
  type RootState = ReturnType<AppStore['getState']>;
  type AppDispatch = AppStore['dispatch'];

  return {
    store,
    createStore,
  } as {
    store: AppStore;
    createStore: () => AppStore;
    RootState: RootState;
    AppDispatch: AppDispatch;
  };
}
