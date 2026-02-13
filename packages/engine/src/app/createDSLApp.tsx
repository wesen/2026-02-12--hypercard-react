import type { Reducer } from '@reduxjs/toolkit';
import type { CardStackDefinition, SharedActionRegistry, SharedSelectorRegistry } from '../cards/types';
import { HyperCardShell } from '../components/shell/HyperCardShell';
import { StandardDebugPane } from '../debug/StandardDebugPane';
import { useStandardDebugHooks } from '../debug/useStandardDebugHooks';
import { createAppStore } from './createAppStore';

export interface DSLAppConfig<TRootState = unknown> {
  /** The card stack definition */
  stack: CardStackDefinition<TRootState>;
  /** Shared selectors registry */
  sharedSelectors: SharedSelectorRegistry<TRootState>;
  /** Shared actions registry */
  sharedActions: SharedActionRegistry<TRootState>;
  /** Domain-specific reducers (engine reducers are added automatically) */
  domainReducers: Record<string, Reducer>;
  /** Navigation shortcut buttons */
  navShortcuts: Array<{ card: string; icon: string }>;
  /** Snapshot selector for the debug pane state inspector */
  snapshotSelector?: (state: any) => Record<string, unknown>;
  /** Debug pane title */
  debugTitle?: string;
}

/**
 * Creates a complete DSL app from a config object.
 * Returns an App component, a singleton store, and a createStore factory.
 *
 * @example
 * ```ts
 * const { App, store, createStore } = createDSLApp({
 *   stack: CRM_STACK,
 *   sharedSelectors: crmSharedSelectors,
 *   sharedActions: crmSharedActions,
 *   domainReducers: { contacts: contactsReducer, ... },
 *   navShortcuts: [{ card: 'home', icon: '🏠' }],
 *   snapshotSelector: (state) => ({ contacts: state.contacts }),
 * });
 * ```
 */
export function createDSLApp<TRootState = unknown>(config: DSLAppConfig<TRootState>) {
  const { stack, sharedSelectors, sharedActions, domainReducers, navShortcuts, snapshotSelector, debugTitle } = config;

  const { store, createStore } = createAppStore(domainReducers);

  function App() {
    const debugHooks = useStandardDebugHooks();

    return (
      <HyperCardShell
        stack={stack}
        sharedSelectors={sharedSelectors}
        sharedActions={sharedActions}
        debugHooks={debugHooks}
        layoutMode="debugPane"
        renderDebugPane={() => (
          <StandardDebugPane title={debugTitle ?? `${stack.name} Debug`} snapshotSelector={snapshotSelector} />
        )}
        navShortcuts={navShortcuts}
      />
    );
  }

  return { App, store, createStore };
}
