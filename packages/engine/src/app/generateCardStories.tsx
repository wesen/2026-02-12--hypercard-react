import { type ComponentType, useRef } from 'react';
import { Provider } from 'react-redux';
import type { CardStackDefinition } from '../cards/types';
import type { DesktopIconDef } from '../components/shell/windowing/types';
import { DesktopShell } from '../components/shell/windowing/DesktopShell';

export interface CardStoriesConfig {
  /** The card stack definition */
  stack: CardStackDefinition;
  /** Factory to create a fresh store (for story isolation). Use createAppStore().createStore. */
  createStore: () => any; // eslint-disable-line -- Store type varies per app; typed at call site
  /** Optional desktop icon overrides for DesktopShell stories */
  icons?: DesktopIconDef[];
  /** Map of card → structured params value for detail/param cards in stories */
  cardParams?: Record<string, unknown>;
  /** Optional store seeding hook for deterministic story runtime state. */
  seedStore?: (store: any) => void;
}

/** Story params are stored in window nav as strings; encode structured params deterministically. */
export function toStoryParam(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
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
export function createStoryHelpers(config: CardStoriesConfig) {
  const { stack, createStore, icons, cardParams = {}, seedStore } = config;

  function StoryStoreProvider({ Story }: { Story: ComponentType }) {
    const storeRef = useRef<any>(null);
    const seededRef = useRef(false);
    if (!storeRef.current) {
      storeRef.current = createStore();
    }
    if (!seededRef.current) {
      seedStore?.(storeRef.current);
      seededRef.current = true;
    }

    return (
      <Provider store={storeRef.current}>
        <Story />
      </Provider>
    );
  }

  // Store decorator for story isolation
  function storeDecorator(Story: ComponentType) {
    return <StoryStoreProvider Story={Story} />;
  }

  // Shell-at-card component for navigating to a specific card
  function ShellAtCard({ card, params }: { card: string; params?: unknown }) {
    const stackAtCard = {
      ...stack,
      homeCard: card,
    };

    return (
      <DesktopShell
        stack={stackAtCard}
        icons={icons}
        homeParam={toStoryParam(params)}
      />
    );
  }

  // Full app component (for default story / meta.component)
  function FullApp() {
    return <DesktopShell stack={stack} icons={icons} />;
  }

  /**
   * Creates a story object for a specific card.
   * @param card — card ID from the stack
   * @param params — optional structured params payload (encoded for nav storage)
   */
  function createStory(card: string, params?: unknown) {
    const resolvedParams = params ?? cardParams[card];
    return {
      render: () => <ShellAtCard card={card} params={resolvedParams} />,
    };
  }

  return { storeDecorator, createStory, FullApp };
}
