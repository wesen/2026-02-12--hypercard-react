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
  executeCommand,
  resolveValueExpr,
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
  navShortcuts?: Array<{ card: string; icon: string }>;
  renderAIPanel?: (dispatch: (action: ActionDescriptor) => void) => ReactNode;
  themeClass?: string;
  mode?: 'interactive' | 'preview';
}

export function HyperCardShell({
  stack,
  sharedSelectors,
  sharedActions,
  navShortcuts,
  renderAIPanel,
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

  const runAction = useCallback((action: ActionDescriptor, event?: { name: string; payload: unknown }) => {
    const context = createCardContext(runtimeRoot, {
      stackId: stack.id,
      cardId: currentCardId,
      cardType: cardDef.type,
      backgroundId,
      mode,
      params,
      getState: () => store.getState(),
      dispatch: (a) => dispatch(a as any),
      nav: {
        go: (card, param) => dispatch(navigate({ card, paramValue: param })),
        back: () => dispatch(goBack()),
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
        showToast: (message) => dispatch(showToast(message)),
      },
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
    dispatch,
    lookup,
    sharedSelectors,
    sharedActions,
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
      dispatch: (a) => dispatch(a as any),
      nav: {
        go: (card, param) => dispatch(navigate({ card, paramValue: param })),
        back: () => dispatch(goBack()),
      },
    });

    const selectorResolver = createSelectorResolver(
      store.getState(),
      context,
      lookup,
      (sharedSelectors ?? {}) as SharedSelectorRegistry,
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
    dispatch,
    lookup,
    sharedSelectors,
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
    }),
    [mode, resolve, emit, runAction],
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

  let layoutContent;
  if (layout === 'split' && aiPanel) {
    layoutContent = <LayoutSplit main={mainContent} side={aiPanel} />;
  } else if (layout === 'drawer' && aiPanel) {
    layoutContent = <LayoutDrawer main={mainContent} drawer={aiPanel} />;
  } else {
    layoutContent = <LayoutCardChat main={mainContent} />;
  }

  return (
    <HyperCardTheme theme={themeClass}>
      <WindowChrome
        title={`${stack.name} — HyperCard + AI`}
        icon={stack.icon}
      >
        <TabBar
          tabs={LAYOUT_TABS}
          active={layout}
          onSelect={(key) => dispatch(setLayout(key as any))}
        />
        <div data-part="content-area">
          {layoutContent}
        </div>
        <div data-part="footer-line">
          CardDefinition runtime · {Object.keys(stack.cards).length} cards
        </div>
        {toast && <Toast message={toast} onDone={() => dispatch(clearToast())} />}
      </WindowChrome>
    </HyperCardTheme>
  );
}
