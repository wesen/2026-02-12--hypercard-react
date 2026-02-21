import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { CardStackDefinition } from '../../../cards';
import { showToast } from '../../../features/notifications/notificationsSlice';
import {
  registerRuntimeSession,
  removeRuntimeSession,
  selectRuntimeCardState,
  selectRuntimeSession,
  selectRuntimeSessionState,
  setRuntimeSessionStatus,
} from '../../../features/pluginCardRuntime';
import { selectFocusedWindowId, selectSessionCurrentNav, selectSessionNavDepth } from '../../../desktop/core/state';
import { markRuntimeCardInjectionResults } from '../../../hypercard/artifacts/artifactsSlice';
import type { RuntimeIntent } from '../../../plugin-runtime/contracts';
import { hasRuntimeCard, injectPendingCardsWithReport, onRegistryChange } from '../../../plugin-runtime/runtimeCardRegistry';
import { QuickJSCardRuntimeService } from '../../../plugin-runtime/runtimeService';
import type { UINode } from '../../../plugin-runtime/uiTypes';
import { dispatchRuntimeIntent } from './pluginIntentRouting';
import { PluginCardRenderer } from './PluginCardRenderer';

type StoreState = Record<string, unknown>;

function getPluginConfig(stack: CardStackDefinition) {
  if (stack.plugin && stack.plugin.bundleCode.length > 0) {
    return stack.plugin;
  }

  return null;
}

function projectGlobalState(rootState: StoreState, opts: {
  stackId: string;
  sessionId: string;
  cardId: string;
  windowId: string;
  navDepth: number;
  currentNavParam?: string;
  focusedWindowId: string | null;
  runtimeStatus: string;
}) {
  const knownSlices = new Set(['pluginCardRuntime', 'windowing', 'notifications', 'debug']);
  const domains = Object.fromEntries(Object.entries(rootState).filter(([key]) => !knownSlices.has(key)));

  return {
    self: {
      stackId: opts.stackId,
      sessionId: opts.sessionId,
      cardId: opts.cardId,
      windowId: opts.windowId,
    },
    domains,
    nav: {
      current: opts.cardId,
      param: opts.currentNavParam,
      depth: opts.navDepth,
      canBack: opts.navDepth > 1,
    },
    system: {
      focusedWindowId: opts.focusedWindowId,
      runtimeHealth: {
        status: opts.runtimeStatus,
      },
    },
  };
}

export interface PluginCardSessionHostProps {
  windowId: string;
  sessionId: string;
  stack: CardStackDefinition;
  mode?: 'interactive' | 'preview';
}

export function PluginCardSessionHost({
  windowId,
  sessionId,
  stack,
  mode = 'interactive',
}: PluginCardSessionHostProps) {
  const dispatch = useDispatch();
  const store = useStore<StoreState>();

  const pluginConfig = useMemo(() => getPluginConfig(stack), [stack]);
  const currentNav = useSelector((state: StoreState) => selectSessionCurrentNav(state as any, sessionId));
  const navDepth = useSelector((state: StoreState) => selectSessionNavDepth(state as any, sessionId));
  const focusedWindowId = useSelector((state: StoreState) => selectFocusedWindowId(state as any));

  // Accept cards from the static stack definition OR runtime-injected cards (not in stack.cards)
  const currentCardId = currentNav?.card && (stack.cards[currentNav.card] || hasRuntimeCard(currentNav.card))
    ? currentNav.card
    : stack.homeCard;
  const runtimeSession = useSelector((state: StoreState) => selectRuntimeSession(state as any, sessionId));
  const sessionState = useSelector((state: StoreState) => selectRuntimeSessionState(state as any, sessionId));
  const cardState = useSelector((state: StoreState) => selectRuntimeCardState(state as any, sessionId, currentCardId));

  const runtimeServiceRef = useRef<QuickJSCardRuntimeService | null>(null);
  const isPreview = mode === 'preview';
  if (!runtimeServiceRef.current) {
    runtimeServiceRef.current = new QuickJSCardRuntimeService();
  }

  useEffect(() => {
    if (!pluginConfig) {
      return;
    }

    if (runtimeSession) {
      return;
    }

    dispatch(
      registerRuntimeSession({
        sessionId,
        stackId: stack.id,
        status: 'loading',
        capabilities: pluginConfig.capabilities,
      })
    );
  }, [dispatch, pluginConfig, runtimeSession, sessionId, stack.id]);

  useEffect(() => {
    if (!pluginConfig || !runtimeSession) {
      return;
    }

    if (runtimeSession.status !== 'loading') {
      return;
    }

    let cancelled = false;
    const runtimeService = runtimeServiceRef.current;
    const config = pluginConfig;

    async function loadBundle() {
      if (!runtimeService) {
        return;
      }

      try {
        const bundle = await runtimeService.loadStackBundle(stack.id, sessionId, config.bundleCode);
        if (cancelled) {
          return;
        }

        dispatch(setRuntimeSessionStatus({ sessionId, status: 'ready' }));

        // Inject any runtime cards that were registered before the session loaded
        if (runtimeService) {
          const report = injectPendingCardsWithReport(runtimeService, sessionId);
          if (report.injected.length > 0 || report.failed.length > 0) {
            dispatch(
              markRuntimeCardInjectionResults({
                injectedCardIds: report.injected,
                failed: report.failed.map((item) => ({ cardId: item.cardId, error: item.error })),
              }),
            );
          }
          if (report.injected.length > 0) {
            console.log(
              `[PluginCardSessionHost] Injected ${report.injected.length} runtime cards into ${sessionId}:`,
              report.injected,
            );
          }
        }

        if (bundle.initialSessionState && typeof bundle.initialSessionState === 'object') {
          dispatchRuntimeIntent(
            {
              scope: 'session',
              actionType: 'patch',
              payload: bundle.initialSessionState,
            },
            {
              dispatch: (action) => dispatch(action as never),
              getState: () => store.getState(),
              sessionId,
              cardId: currentCardId,
              windowId,
            }
          );
        }

        if (bundle.initialCardState && typeof bundle.initialCardState === 'object') {
          for (const [cardId, value] of Object.entries(bundle.initialCardState)) {
            if (typeof value === 'object' && value !== null) {
              dispatchRuntimeIntent(
                {
                  scope: 'card',
                  actionType: 'patch',
                  payload: value,
                },
                {
                  dispatch: (action) => dispatch(action as never),
                  getState: () => store.getState(),
                  sessionId,
                  cardId,
                  windowId,
                }
              );
            }
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        dispatch(setRuntimeSessionStatus({ sessionId, status: 'error', error: message }));
      }
    }

    void loadBundle();

    return () => {
      cancelled = true;
    };
  }, [dispatch, pluginConfig, runtimeSession, sessionId, stack.id, currentCardId, windowId, store]);

  // Subscribe to runtime card registry — inject new cards as they arrive
  useEffect(() => {
    if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready') {
      return;
    }
    const runtimeService = runtimeServiceRef.current;
    if (!runtimeService) {
      return;
    }
    return onRegistryChange(() => {
      const report = injectPendingCardsWithReport(runtimeService, sessionId);
      if (report.injected.length > 0 || report.failed.length > 0) {
        dispatch(
          markRuntimeCardInjectionResults({
            injectedCardIds: report.injected,
            failed: report.failed.map((item) => ({ cardId: item.cardId, error: item.error })),
          }),
        );
      }
      if (report.injected.length > 0) {
        console.log(
          `[PluginCardSessionHost] Live-injected ${report.injected.length} runtime cards into ${sessionId}:`,
          report.injected,
        );
      }
    });
  }, [dispatch, pluginConfig, runtimeSession, sessionId]);

  useEffect(() => {
    if (!pluginConfig) {
      return;
    }

    return () => {
      const runtimeService = runtimeServiceRef.current;
      runtimeService?.disposeSession(sessionId);
      dispatch(removeRuntimeSession({ sessionId }));
    };
  }, [dispatch, pluginConfig, sessionId]);

  const projectGlobal = useCallback(
    () =>
      projectGlobalState(store.getState(), {
        stackId: stack.id,
        sessionId,
        cardId: currentCardId,
        windowId,
        navDepth,
        currentNavParam: currentNav?.param,
        focusedWindowId,
        runtimeStatus: runtimeSession?.status ?? 'missing',
      }),
    [
      store,
      stack.id,
      sessionId,
      currentCardId,
      windowId,
      navDepth,
      currentNav?.param,
      focusedWindowId,
      runtimeSession?.status,
    ]
  );

  const tree = useMemo<UINode | null>(() => {
    if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready') {
      return null;
    }

    const projectedGlobalState = projectGlobal();

    try {
      return runtimeServiceRef.current?.renderCard(
        sessionId,
        currentCardId,
        cardState,
        sessionState,
        projectedGlobalState
      ) ?? null;
    } catch (error) {
      dispatch(
        showToast(error instanceof Error ? error.message : String(error))
      );
      return null;
    }
  }, [cardState, currentCardId, dispatch, pluginConfig, projectGlobal, runtimeSession, sessionId, sessionState]);

  const emitRuntimeEvent = useCallback(
    (handler: string, args?: unknown) => {
      if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready') {
        return;
      }

      let intents: RuntimeIntent[];
      try {
        const projectedGlobalState = projectGlobal();
        intents = runtimeServiceRef.current?.eventCard(
          sessionId,
          currentCardId,
          handler,
          args,
          cardState,
          sessionState,
          projectedGlobalState
        ) ?? [];
      } catch (error) {
        dispatch(showToast(error instanceof Error ? error.message : String(error)));
        return;
      }

      intents.forEach((intent) => {
        dispatchRuntimeIntent(intent, {
          dispatch: (action) => dispatch(action as never),
          getState: () => store.getState(),
          sessionId,
          cardId: currentCardId,
          windowId,
        });
      });
    },
    [
      cardState,
      currentCardId,
      dispatch,
      pluginConfig,
      projectGlobal,
      runtimeSession,
      sessionId,
      sessionState,
      windowId,
      store,
    ]
  );

  if (!pluginConfig) {
    return <div style={{ padding: 12, color: '#9f1d1d' }}>Plugin stack configuration is required for this host.</div>;
  }

  if (!runtimeSession || runtimeSession.status === 'loading') {
    return <div style={{ padding: 12 }}>{isPreview ? 'Loading plugin preview…' : 'Loading plugin runtime…'}</div>;
  }

  if (runtimeSession.status === 'error') {
    return <div style={{ padding: 12, color: '#9f1d1d' }}>Runtime error: {runtimeSession.error}</div>;
  }

  if (!tree) {
    return <div style={{ padding: 12 }}>No plugin output for card: {currentCardId}</div>;
  }

  return <PluginCardRenderer tree={tree} onEvent={emitRuntimeEvent} />;
}
