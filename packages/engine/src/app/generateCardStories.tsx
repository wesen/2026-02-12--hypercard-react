import React, { useEffect, type ComponentType } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { HyperCardShell } from '../components/shell/HyperCardShell';
import { StandardDebugPane } from '../debug/StandardDebugPane';
import { useStandardDebugHooks } from '../debug/useStandardDebugHooks';
import { navigate } from '../features/navigation/navigationSlice';
import { selectCurrentCardId, type NavigationStateSlice } from '../features/navigation/selectors';
import type { CardStackDefinition, SharedActionRegistry, SharedSelectorRegistry } from '../cards/types';

export interface CardStoriesConfig<TRootState = unknown> {
  /** The card stack definition */
  stack: CardStackDefinition<TRootState>;
  /** Shared selectors registry */
  sharedSelectors: SharedSelectorRegistry<TRootState>;
  /** Shared actions registry */
  sharedActions: SharedActionRegistry<TRootState>;
  /** Factory to create a fresh store (for story isolation) */
  createStore: () => any;
  /** Storybook story title prefix (e.g., 'CRM') */
  title: string;
  /** Navigation shortcut buttons */
  navShortcuts: Array<{ card: string; icon: string }>;
  /** Map of card → param value for detail/param cards in stories */
  cardParams?: Record<string, string>;
  /** Snapshot selector for the debug pane state inspector */
  snapshotSelector?: (state: any) => Record<string, unknown>;
  /** Debug pane title */
  debugTitle?: string;
}

/**
 * Generates Storybook meta + per-card story exports from a stack definition.
 *
 * @example
 * ```ts
 * const stories = generateCardStories({ stack, sharedSelectors, sharedActions, createStore, title: 'CRM', ... });
 * export default stories.meta;
 * export const { Home, Contacts, ContactDetail } = stories.stories;
 * ```
 */
export function generateCardStories<TRootState = unknown>(config: CardStoriesConfig<TRootState>) {
  const {
    stack,
    sharedSelectors,
    sharedActions,
    createStore,
    title,
    navShortcuts,
    cardParams = {},
    snapshotSelector,
    debugTitle,
  } = config;

  // Store decorator for story isolation
  function StoreDecorator(Story: ComponentType) {
    return (
      <Provider store={createStore()}>
        <Story />
      </Provider>
    );
  }

  // Shell-at-card component
  function ShellAtCard({ card, param }: { card: string; param?: string }) {
    const debugHooks = useStandardDebugHooks();
    const dispatch = useDispatch();
    const currentCard = useSelector((state: NavigationStateSlice) => selectCurrentCardId(state));

    useEffect(() => {
      if (currentCard !== card) {
        dispatch(navigate({ card, paramValue: param }));
      }
    }, [dispatch, card, param, currentCard]);

    return (
      <HyperCardShell
        stack={stack}
        sharedSelectors={sharedSelectors}
        sharedActions={sharedActions}
        debugHooks={debugHooks}
        layoutMode="debugPane"
        renderDebugPane={() => (
          <StandardDebugPane
            title={debugTitle ?? `${title} Debug`}
            snapshotSelector={snapshotSelector}
          />
        )}
        navShortcuts={navShortcuts}
      />
    );
  }

  // Full app component (default story)
  function FullApp() {
    const debugHooks = useStandardDebugHooks();
    return (
      <HyperCardShell
        stack={stack}
        sharedSelectors={sharedSelectors}
        sharedActions={sharedActions}
        debugHooks={debugHooks}
        layoutMode="debugPane"
        renderDebugPane={() => (
          <StandardDebugPane
            title={debugTitle ?? `${title} Debug`}
            snapshotSelector={snapshotSelector}
          />
        )}
        navShortcuts={navShortcuts}
      />
    );
  }

  // Build meta
  const meta = {
    title: `${title}/Full App`,
    component: FullApp,
    decorators: [StoreDecorator],
    parameters: { layout: 'fullscreen' as const },
  };

  // Build per-card stories
  const storyEntries: Record<string, { render: () => React.JSX.Element }> = {};

  // Default story
  storyEntries.Default = { render: () => <FullApp /> };

  // One story per card
  for (const cardId of Object.keys(stack.cards)) {
    // Convert cardId to PascalCase for export name
    const storyName = cardId.charAt(0).toUpperCase() + cardId.slice(1);
    const param = cardParams[cardId];
    storyEntries[storyName] = {
      render: () => <ShellAtCard card={cardId} param={param} />,
    };
  }

  return { meta, stories: storyEntries };
}
