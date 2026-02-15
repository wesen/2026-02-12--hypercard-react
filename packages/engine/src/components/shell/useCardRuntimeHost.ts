import { useCallback, useEffect, useMemo } from 'react';
import {
  type ActionDescriptor,
  type CardStackDefinition,
  ensureCardRuntime,
  type HypercardRuntimeStateSlice,
  type SharedActionRegistry,
  type SharedSelectorRegistry,
} from '../../cards';
import {
  createCardContext,
  createSelectorResolver,
  emitRuntimeDebugEvent,
  executeCommand,
  type RuntimeDebugHooks,
  type RuntimeLookup,
  resolveValueExpr,
} from '../../cards/runtime';
import { showToast } from '../../features/notifications/notificationsSlice';
import type { CardRendererRuntime } from './CardRenderer';

interface RuntimeStoreLike {
  getState: () => unknown;
}

interface RuntimeNavAdapter {
  go: (card: string, param?: string) => unknown;
  back: () => unknown;
}

export interface UseCardRuntimeHostOptions {
  stack: CardStackDefinition<any>;
  currentCardId: string;
  currentParam?: string;
  runtimeCardId?: string;
  mode: 'interactive' | 'preview';
  runtimeSlice?: HypercardRuntimeStateSlice['hypercardRuntime'];
  sharedSelectors?: SharedSelectorRegistry<any>;
  sharedActions?: SharedActionRegistry<any>;
  debugHooks?: RuntimeDebugHooks;
  dispatch: (action: unknown) => unknown;
  store: RuntimeStoreLike;
  nav: RuntimeNavAdapter;
  windowId?: string;
  sessionId?: string;
}

export interface UseCardRuntimeHostResult {
  cardDef: CardStackDefinition<any>['cards'][string];
  runtime: CardRendererRuntime;
  runAction: (action: ActionDescriptor, event?: { name: string; payload: unknown }) => void;
}

export function useCardRuntimeHost({
  stack,
  currentCardId,
  currentParam,
  runtimeCardId = currentCardId,
  mode,
  runtimeSlice,
  sharedSelectors,
  sharedActions,
  debugHooks,
  dispatch,
  store,
  nav,
  windowId,
  sessionId,
}: UseCardRuntimeHostOptions): UseCardRuntimeHostResult {
  const cardDef = stack.cards[currentCardId];
  const cardTypeDef = stack.cardTypes?.[cardDef.type];
  const backgroundId = cardDef.backgroundId;
  const backgroundDef = backgroundId ? stack.backgrounds?.[backgroundId] : undefined;

  const params = useMemo<Record<string, string>>(
    () => ({
      card: currentCardId,
      param: currentParam ?? '',
    }),
    [currentCardId, currentParam],
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
    () => ({
      cardDef,
      stackDef: stack,
      cardTypeDef,
      backgroundDef,
    }),
    [cardDef, stack, cardTypeDef, backgroundDef],
  );

  const debugContext = useMemo(
    () => ({
      stackId: stack.id,
      cardId: runtimeCardId,
      cardType: cardDef.type,
      ...(windowId ? { windowId } : {}),
      ...(sessionId ? { sessionId } : {}),
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
      const result = dispatch(action);
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
          go: (card, param) => {
            const navAction = nav.go(card, param);
            if (navAction) dispatchWithDebug(navAction);
          },
          back: () => {
            const navAction = nav.back();
            if (navAction) dispatchWithDebug(navAction);
          },
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
      nav,
      lookup,
      sharedSelectors,
      sharedActions,
      debugHooks,
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
          go: (card, param) => {
            const navAction = nav.go(card, param);
            if (navAction) dispatchWithDebug(navAction);
          },
          back: () => {
            const navAction = nav.back();
            if (navAction) dispatchWithDebug(navAction);
          },
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
      nav,
      lookup,
      sharedSelectors,
      debugHooks,
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

  return {
    cardDef,
    runtime,
    runAction,
  };
}
