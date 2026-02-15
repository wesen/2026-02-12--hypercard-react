import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  type ActionDescriptor,
  type CardStackDefinition,
  ensureCardRuntime,
  type HypercardRuntimeStateSlice,
  type SharedActionRegistry,
  type SharedSelectorRegistry,
} from '../../../cards';
import {
  createCardContext,
  createSelectorResolver,
  emitRuntimeDebugEvent,
  executeCommand,
  type RuntimeDebugHooks,
  type RuntimeLookup,
  resolveValueExpr,
} from '../../../cards/runtime';
import { showToast } from '../../../features/notifications/notificationsSlice';
import type { WindowingStateSlice } from '../../../features/windowing/selectors';
import { selectSessionCurrentNav } from '../../../features/windowing/selectors';
import { sessionNavBack, sessionNavGo } from '../../../features/windowing/windowingSlice';
import { CardRenderer } from '../CardRenderer';

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
  const cardDef = stack.cards[currentCardId];
  const cardTypeDef = stack.cardTypes?.[cardDef.type];
  const backgroundId = cardDef.backgroundId;
  const backgroundDef = backgroundId ? stack.backgrounds?.[backgroundId] : undefined;

  // Session-aware runtime key: cardId::sessionId
  const runtimeCardId = `${currentCardId}::${sessionId}`;

  const params = useMemo<Record<string, string>>(
    () => ({
      card: currentCardId,
      param: currentNav?.param ?? '',
    }),
    [currentCardId, currentNav?.param],
  );

  useEffect(() => {
    dispatch(
      ensureCardRuntime({
        stackId: stack.id,
        cardId: runtimeCardId,
        cardType: cardDef.type,
        backgroundId,
        defaults: {
          global: stack.global?.state,
          stack: stack.stack?.state,
          background: backgroundDef?.state,
          cardType: cardTypeDef?.state,
          card: cardDef.state?.initial,
        },
      }),
    );
  }, [
    dispatch,
    stack.id,
    stack.global?.state,
    stack.stack?.state,
    runtimeCardId,
    cardDef.type,
    cardDef.state?.initial,
    cardTypeDef?.state,
    backgroundId,
    backgroundDef?.state,
  ]);

  const runtimeRoot = useMemo(
    () => ({
      hypercardRuntime: runtimeSlice ?? { global: {}, stacks: {} },
    }),
    [runtimeSlice],
  );

  const lookup: RuntimeLookup = useMemo(
    () => ({ cardDef, stackDef: stack, cardTypeDef, backgroundDef }),
    [cardDef, stack, cardTypeDef, backgroundDef],
  );

  const debugContext = useMemo(
    () => ({
      stackId: stack.id,
      cardId: runtimeCardId,
      cardType: cardDef.type,
      windowId,
      sessionId,
    }),
    [stack.id, runtimeCardId, cardDef.type, windowId, sessionId],
  );

  const dispatchWithDebug = useCallback(
    (action: unknown) => {
      emitRuntimeDebugEvent(debugHooks, debugContext, {
        kind: 'redux.dispatch.start',
        payload: { action },
      });
      const startedAt = Date.now();
      const result = dispatch(action as any);
      emitRuntimeDebugEvent(debugHooks, debugContext, {
        kind: 'redux.dispatch',
        durationMs: Date.now() - startedAt,
        payload: { action },
      });
      return result;
    },
    [dispatch, debugHooks, debugContext],
  );

  const runAction = useCallback(
    (action: ActionDescriptor, event?: { name: string; payload: unknown }) => {
      const context = createCardContext(runtimeRoot, {
        stackId: stack.id,
        cardId: runtimeCardId,
        cardType: cardDef.type,
        backgroundId,
        mode,
        params,
        getState: () => store.getState(),
        dispatch: dispatchWithDebug,
        nav: {
          go: (card, param) => dispatchWithDebug(sessionNavGo({ sessionId, card, param })),
          back: () => dispatchWithDebug(sessionNavBack({ sessionId })),
        },
      });

      executeCommand(
        { command: action, event },
        store.getState(),
        context,
        lookup,
        (sharedSelectors ?? {}) as SharedSelectorRegistry,
        (sharedActions ?? {}) as SharedActionRegistry,
        {
          showToast: (message) => dispatchWithDebug(showToast(message)),
        },
        debugHooks,
      );
    },
    [
      runtimeRoot,
      stack.id,
      runtimeCardId,
      cardDef.type,
      backgroundId,
      mode,
      params,
      store,
      dispatchWithDebug,
      lookup,
      sharedSelectors,
      sharedActions,
      debugHooks,
      sessionId,
    ],
  );

  const resolve = useCallback(
    (expr: unknown, event?: { name: string; payload: unknown }) => {
      const context = createCardContext(runtimeRoot, {
        stackId: stack.id,
        cardId: runtimeCardId,
        cardType: cardDef.type,
        backgroundId,
        mode,
        params,
        getState: () => store.getState(),
        dispatch: dispatchWithDebug,
        nav: {
          go: (card, param) => dispatchWithDebug(sessionNavGo({ sessionId, card, param })),
          back: () => dispatchWithDebug(sessionNavBack({ sessionId })),
        },
      });

      const selectorResolver = createSelectorResolver(
        store.getState(),
        context,
        lookup,
        (sharedSelectors ?? {}) as SharedSelectorRegistry,
        debugHooks,
      );

      return resolveValueExpr(expr, {
        state: store.getState(),
        params,
        event,
        selectors: selectorResolver,
      });
    },
    [
      runtimeRoot,
      stack.id,
      runtimeCardId,
      cardDef.type,
      backgroundId,
      mode,
      params,
      store,
      dispatchWithDebug,
      lookup,
      sharedSelectors,
      debugHooks,
      sessionId,
    ],
  );

  const emit = useCallback(
    (nodeKey: string, eventName: string, payload: unknown) => {
      const command = cardDef.bindings?.[nodeKey]?.[eventName];
      if (!command) return;
      runAction(command, { name: eventName, payload });
    },
    [cardDef.bindings, runAction],
  );

  const runtime = useMemo(
    () => ({
      mode,
      resolve,
      emit,
      execute: runAction,
      debugEvent: (event: Parameters<typeof emitRuntimeDebugEvent>[2]) =>
        emitRuntimeDebugEvent(debugHooks, debugContext, event),
    }),
    [mode, resolve, emit, runAction, debugHooks, debugContext],
  );

  return <CardRenderer cardId={runtimeCardId} cardDef={cardDef} runtime={runtime} />;
}
