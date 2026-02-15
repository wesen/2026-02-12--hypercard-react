import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  type CardStackDefinition,
  type HypercardRuntimeStateSlice,
  type SharedActionRegistry,
  type SharedSelectorRegistry,
} from '../../../cards';
import { type RuntimeDebugHooks } from '../../../cards/runtime';
import type { WindowingStateSlice } from '../../../features/windowing/selectors';
import { selectSessionCurrentNav } from '../../../features/windowing/selectors';
import { sessionNavBack, sessionNavGo } from '../../../features/windowing/windowingSlice';
import { CardRenderer } from '../CardRenderer';
import { useCardRuntimeHost } from '../useCardRuntimeHost';

type StoreState = WindowingStateSlice & { hypercardRuntime?: unknown } & Record<string, unknown>;

export interface CardSessionHostProps {
  windowId: string;
  sessionId: string;
  stack: CardStackDefinition<any>;
  sharedSelectors?: SharedSelectorRegistry<any>;
  sharedActions?: SharedActionRegistry<any>;
  debugHooks?: RuntimeDebugHooks;
  mode?: 'interactive' | 'preview';
}

export function CardSessionHost({
  windowId,
  sessionId,
  stack,
  sharedSelectors,
  sharedActions,
  debugHooks,
  mode = 'interactive',
}: CardSessionHostProps) {
  const dispatch = useDispatch();
  const store = useStore<StoreState>();

  const currentNav = useSelector((s: StoreState) => selectSessionCurrentNav(s, sessionId));
  const runtimeSlice = useSelector((s: StoreState) => s.hypercardRuntime) as
    | HypercardRuntimeStateSlice['hypercardRuntime']
    | undefined;

  const currentCardId = currentNav?.card && stack.cards[currentNav.card] ? currentNav.card : stack.homeCard;

  // Session-aware runtime key: cardId::sessionId
  const runtimeCardId = `${currentCardId}::${sessionId}`;
  const { cardDef, runtime } = useCardRuntimeHost({
    stack,
    currentCardId,
    currentParam: currentNav?.param,
    runtimeCardId,
    mode,
    runtimeSlice,
    sharedSelectors,
    sharedActions,
    debugHooks,
    dispatch: (action) => dispatch(action as any),
    store,
    nav: {
      go: (card, param) => sessionNavGo({ sessionId, card, param }),
      back: () => sessionNavBack({ sessionId }),
    },
    windowId,
    sessionId,
  });

  return <CardRenderer cardId={runtimeCardId} cardDef={cardDef} runtime={runtime} />;
}
