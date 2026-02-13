import { type ComponentType, useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import type { CardStackDefinition, SharedActionRegistry, SharedSelectorRegistry } from '../cards/types';
import { HyperCardShell } from '../components/shell/HyperCardShell';
import { StandardDebugPane } from '../debug/StandardDebugPane';
import { useStandardDebugHooks } from '../debug/useStandardDebugHooks';
import { navigate } from '../features/navigation/navigationSlice';
import { type NavigationStateSlice, selectCurrentCardId } from '../features/navigation/selectors';

export interface CardStoriesConfig<TRootState = unknown> {
  /** The card stack definition */
  stack: CardStackDefinition<TRootState>;
  /** Shared selectors registry */
  sharedSelectors: SharedSelectorRegistry<TRootState>;
  /** Shared actions registry */
  sharedActions: SharedActionRegistry<TRootState>;
  /** Factory to create a fresh store (for story isolation) */
  createStore: () => any;
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
 * Creates a Storybook store decorator and per-card story objects from a stack definition.
 *
 * The `meta` object (title, component, etc.) must be defined in the story file itself
 * because Storybook's CSF parser requires a statically-visible `export default`.
 *
 * @example
 * ```tsx
 * import { createStoryHelpers } from '@hypercard/engine';
 *
 * const { storeDecorator, createStory, FullApp } = createStoryHelpers({ ... });
 *
 * const meta = {
 *   title: 'CRM/Full App',
 *   component: FullApp,
 *   decorators: [storeDecorator],
 *   parameters: { layout: 'fullscreen' },
 * } satisfies Meta<typeof FullApp>;
 * export default meta;
 *
 * export const Default: StoryObj<typeof meta> = {};
 * export const Home: StoryObj<typeof meta> = createStory('home');
 * export const ContactDetail: StoryObj<typeof meta> = createStory('contactDetail', 'c1');
 * ```
 */
export function createStoryHelpers<TRootState = unknown>(config: CardStoriesConfig<TRootState>) {
  const {
    stack,
    sharedSelectors,
    sharedActions,
    createStore,
    navShortcuts,
    cardParams = {},
    snapshotSelector,
    debugTitle,
  } = config;

  // Store decorator for story isolation
  function storeDecorator(Story: ComponentType) {
    return (
      <Provider store={createStore()}>
        <Story />
      </Provider>
    );
  }

  // Shell-at-card component for navigating to a specific card
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
          <StandardDebugPane title={debugTitle ?? `${stack.name} Debug`} snapshotSelector={snapshotSelector} />
        )}
        navShortcuts={navShortcuts}
      />
    );
  }

  // Full app component (for default story / meta.component)
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
          <StandardDebugPane title={debugTitle ?? `${stack.name} Debug`} snapshotSelector={snapshotSelector} />
        )}
        navShortcuts={navShortcuts}
      />
    );
  }

  /**
   * Creates a story object for a specific card.
   * @param card — card ID from the stack
   * @param param — optional param value (for detail cards)
   */
  function createStory(card: string, param?: string) {
    const resolvedParam = param ?? cardParams[card];
    return {
      render: () => <ShellAtCard card={card} param={resolvedParam} />,
    };
  }

  return { storeDecorator, createStory, FullApp };
}
