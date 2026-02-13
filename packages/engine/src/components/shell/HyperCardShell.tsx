import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import {
  useDispatch,
  useSelector,
  useStore,
} from 'react-redux';
import { clearToast, showToast } from '../../features/notifications/notificationsSlice';
import {
  selectToast,
  type NotificationsStateSlice,
} from '../../features/notifications/selectors';
import { goBack, navigate, setLayout } from '../../features/navigation/navigationSlice';
import {
  selectCurrentNav,
  selectLayout,
  selectNavDepth,
  type NavigationStateSlice,
} from '../../features/navigation/selectors';
import { CardRenderer } from './CardRenderer';
import { LayoutCardChat } from './LayoutCardChat';
import { LayoutDrawer } from './LayoutDrawer';
import { LayoutSplit } from './LayoutSplit';
import { NavBar } from './NavBar';
import { TabBar } from './TabBar';
import { WindowChrome } from './WindowChrome';
import { Toast } from '../widgets/Toast';
import { HyperCardTheme } from '../../theme/HyperCardTheme';
import {
  ensureCardRuntime,
  type ActionDescriptor,
  type CardStackDefinition,
  type SharedActionRegistry,
  type SharedSelectorRegistry,
} from '../../cards';
import {
  createCardContext,
  createSelectorResolver,
  emitRuntimeDebugEvent,
  executeCommand,
  resolveValueExpr,
  type RuntimeDebugHooks,
  type RuntimeLookup,
} from '../../cards/runtime';

const LAYOUT_TABS = [
  { key: 'split', label: '1 · Split Pane' },
  { key: 'drawer', label: '2 · Bottom Drawer' },
  { key: 'cardChat', label: '3 · Card as Chat' },
];

type ShellState = NavigationStateSlice & NotificationsStateSlice & { hypercardRuntime?: unknown };

export interface HyperCardShellProps<TRootState = unknown> {
  stack: CardStackDefinition<any>;
  sharedSelectors?: SharedSelectorRegistry<any>;
  sharedActions?: SharedActionRegistry<any>;
  debugHooks?: RuntimeDebugHooks;
  navShortcuts?: Array<{ card: string; icon: string }>;
  renderAIPanel?: (dispatch: (action: ActionDescriptor) => void) => ReactNode;
  renderDebugPane?: (dispatch: (action: ActionDescriptor) => void) => ReactNode;
  layoutMode?: 'legacyTabs' | 'debugPane';
  themeClass?: string;
  mode?: 'interactive' | 'preview';
}

export function HyperCardShell({
  stack,
  sharedSelectors,
  sharedActions,
  debugHooks,
  navShortcuts,
  renderAIPanel,
  renderDebugPane,
  layoutMode = 'legacyTabs',
  themeClass,
  mode = 'interactive',
}: HyperCardShellProps) {
  const dispatch = useDispatch();
  const store = useStore<ShellState>();

  const layout = useSelector((s: ShellState) => selectLayout(s));
  const current = useSelector((s: ShellState) => selectCurrentNav(s));
  const navDepth = useSelector((s: ShellState) => selectNavDepth(s));
  const toast = useSelector((s: ShellState) => selectToast(s));
  const runtimeSlice = useSelector((s: ShellState) => s.hypercardRuntime as any);

  const currentCardId = stack.cards[current.card] ? current.card : stack.homeCard;
  const cardDef = stack.cards[currentCardId];
  const cardTypeDef = stack.cardTypes?.[cardDef.type];
  const backgroundId = cardDef.backgroundId;
  const backgroundDef = backgroundId ? stack.backgrounds?.[backgroundId] : undefined;

  const params = useMemo<Record<string, string>>(
    () => ({
      card: currentCardId,
      param: current.param ?? '',
    }),
    [currentCardId, current.param],
  );

  useEffect(() => {
    dispatch(ensureCardRuntime({
      stackId: stack.id,
      cardId: currentCardId,
      cardType: cardDef.type,
      backgroundId,
      defaults: {
        global: stack.global?.state,
        stack: stack.stack?.state,
        background: backgroundDef?.state,
        cardType: cardTypeDef?.state,
        card: cardDef.state?.initial,
      },
    }));
  }, [
    dispatch,
    stack.id,
    stack.global?.state,
    stack.stack?.state,
    currentCardId,
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

  const lookup: RuntimeLookup = useMemo(() => ({
    cardDef,
    stackDef: stack,
    cardTypeDef,
    backgroundDef,
  }), [cardDef, stack, cardTypeDef, backgroundDef]);

  const debugContext = useMemo(
    () => ({
      stackId: stack.id,
      cardId: currentCardId,
      cardType: cardDef.type,
    }),
    [stack.id, currentCardId, cardDef.type],
  );

  const dispatchWithDebug = useCallback((action: unknown) => {
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
  }, [dispatch, debugHooks, debugContext]);

  const runAction = useCallback((action: ActionDescriptor, event?: { name: string; payload: unknown }) => {
    const context = createCardContext(runtimeRoot, {
      stackId: stack.id,
      cardId: currentCardId,
      cardType: cardDef.type,
      backgroundId,
      mode,
      params,
      getState: () => store.getState(),
      dispatch: dispatchWithDebug,
      nav: {
        go: (card, param) => dispatchWithDebug(navigate({ card, paramValue: param })),
        back: () => dispatchWithDebug(goBack()),
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
  }, [
    runtimeRoot,
    stack.id,
    currentCardId,
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
  ]);

  const resolve = useCallback((expr: unknown, event?: { name: string; payload: unknown }) => {
    const context = createCardContext(runtimeRoot, {
      stackId: stack.id,
      cardId: currentCardId,
      cardType: cardDef.type,
      backgroundId,
      mode,
      params,
      getState: () => store.getState(),
      dispatch: dispatchWithDebug,
      nav: {
        go: (card, param) => dispatchWithDebug(navigate({ card, paramValue: param })),
        back: () => dispatchWithDebug(goBack()),
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
  }, [
    runtimeRoot,
    stack.id,
    currentCardId,
    cardDef.type,
    backgroundId,
    mode,
    params,
    store,
    dispatchWithDebug,
    lookup,
    sharedSelectors,
    debugHooks,
  ]);

  const emit = useCallback((nodeKey: string, eventName: string, payload: unknown) => {
    const command = cardDef.bindings?.[nodeKey]?.[eventName];
    if (!command) return;
    runAction(command, { name: eventName, payload });
  }, [cardDef.bindings, runAction]);

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

  const mainContent = (
    <>
      <NavBar
        currentCard={currentCardId}
        cardTitle={cardDef.title}
        cardIcon={cardDef.icon}
        navDepth={navDepth}
        onBack={() => runAction({ $: 'act', type: 'nav.back' })}
        onGo={(card) => runAction({ $: 'act', type: 'nav.go', args: { card } })}
        shortcuts={navShortcuts}
      />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CardRenderer
          cardId={currentCardId}
          cardDef={cardDef}
          runtime={runtime}
        />
      </div>
    </>
  );

  const aiPanel = renderAIPanel ? renderAIPanel(runAction) : null;
  const debugPane = renderDebugPane ? renderDebugPane(runAction) : null;

  let layoutContent;
  if (layoutMode === 'debugPane') {
    if (debugPane) {
      layoutContent = <LayoutSplit main={mainContent} side={debugPane} />;
    } else {
      layoutContent = <LayoutCardChat main={mainContent} />;
    }
  } else if (layout === 'split' && aiPanel) {
    layoutContent = <LayoutSplit main={mainContent} side={aiPanel} />;
  } else if (layout === 'drawer' && aiPanel) {
    layoutContent = <LayoutDrawer main={mainContent} drawer={aiPanel} />;
  } else {
    layoutContent = <LayoutCardChat main={mainContent} />;
  }

  return (
    <HyperCardTheme theme={themeClass}>
      <WindowChrome
        title={layoutMode === 'debugPane' ? `${stack.name} — HyperCard + Debug` : `${stack.name} — HyperCard + AI`}
        icon={stack.icon}
      >
        {layoutMode === 'legacyTabs' ? (
          <TabBar
            tabs={LAYOUT_TABS}
            active={layout}
            onSelect={(key) => dispatch(setLayout(key as any))}
          />
        ) : null}
        <div data-part="content-area">
          {layoutContent}
        </div>
        <div data-part="footer-line">
          CardDefinition runtime · {Object.keys(stack.cards).length} cards · {layoutMode}
        </div>
        {toast && <Toast message={toast} onDone={() => dispatch(clearToast())} />}
      </WindowChrome>
    </HyperCardTheme>
  );
}
