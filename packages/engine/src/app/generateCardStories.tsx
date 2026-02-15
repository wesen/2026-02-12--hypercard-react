import { type ComponentType } from 'react';
import { Provider } from 'react-redux';
import type { CardStackDefinition, SharedActionRegistry, SharedSelectorRegistry } from '../cards/types';
import type { DesktopIconDef } from '../components/shell/windowing/types';
import { DesktopShell } from '../components/shell/windowing/DesktopShell';
import { useStandardDebugHooks } from '../debug/useStandardDebugHooks';

export interface CardStoriesConfig<TRootState = unknown> {
  /** The card stack definition */
  stack: CardStackDefinition<TRootState>;
  /** Shared selectors registry */
  sharedSelectors: SharedSelectorRegistry<TRootState>;
  /** Shared actions registry */
  sharedActions: SharedActionRegistry<TRootState>;
  /** Factory to create a fresh store (for story isolation). Use createAppStore().createStore. */
  createStore: () => any; // eslint-disable-line -- Store type varies per app; typed at call site
  /** Optional desktop icon overrides for DesktopShell stories */
  icons?: DesktopIconDef[];
  /** Map of card → param value for detail/param cards in stories */
  cardParams?: Record<string, string>;
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
    icons,
    cardParams = {},
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
    const stackAtCard = {
      ...stack,
      homeCard: card,
    };

    return (
      <DesktopShell
        stack={stackAtCard}
        sharedSelectors={sharedSelectors}
        sharedActions={sharedActions}
        debugHooks={debugHooks}
        icons={icons}
        homeParam={param}
      />
    );
  }

  // Full app component (for default story / meta.component)
  function FullApp() {
    const debugHooks = useStandardDebugHooks();
    return (
      <DesktopShell
        stack={stack}
        sharedSelectors={sharedSelectors}
        sharedActions={sharedActions}
        debugHooks={debugHooks}
        icons={icons}
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
