import { type ReactNode, useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  type ActionDescriptor,
  type CardStackDefinition,
  type HypercardRuntimeStateSlice,
  type SharedActionRegistry,
  type SharedSelectorRegistry,
} from '../../cards';
import { type RuntimeDebugHooks } from '../../cards/runtime';
import {
  goBack,
  initializeNavigation,
  type LayoutMode,
  navigate,
  setLayout,
} from '../../features/navigation/navigationSlice';
import {
  type NavigationStateSlice,
  selectCurrentNav,
  selectLayout,
  selectNavDepth,
} from '../../features/navigation/selectors';
import { clearToast } from '../../features/notifications/notificationsSlice';
import { type NotificationsStateSlice, selectToast } from '../../features/notifications/selectors';
import { HyperCardTheme } from '../../theme/HyperCardTheme';
import { Toast } from '../widgets/Toast';
import { CardRenderer } from './CardRenderer';
import { LayoutCardChat } from './LayoutCardChat';
import { LayoutDrawer } from './LayoutDrawer';
import { LayoutSplit } from './LayoutSplit';
import { NavBar } from './NavBar';
import { TabBar } from './TabBar';
import { useCardRuntimeHost } from './useCardRuntimeHost';
import { WindowChrome } from './WindowChrome';

const LAYOUT_TABS = [
  { key: 'split', label: '1 · Split Pane' },
  { key: 'drawer', label: '2 · Bottom Drawer' },
  { key: 'cardChat', label: '3 · Card as Chat' },
];

type ShellState = NavigationStateSlice & NotificationsStateSlice & { hypercardRuntime?: unknown };

/**
 * Shell props use `any` for registry generics because CardSelectorFn/CardActionHandler
 * are contravariant in TRootState — the shell is a pass-through wiring layer and cannot
 * know the app's concrete state type. Type safety is enforced at the card/app definition level.
 */
export interface HyperCardShellProps {
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

  // Initialize navigation from stack's homeCard on mount
  useEffect(() => {
    dispatch(initializeNavigation({ homeCard: stack.homeCard }));
  }, [dispatch, stack.homeCard]);

  const layout = useSelector((s: ShellState) => selectLayout(s));
  const current = useSelector((s: ShellState) => selectCurrentNav(s));
  const navDepth = useSelector((s: ShellState) => selectNavDepth(s));
  const toast = useSelector((s: ShellState) => selectToast(s));
  const runtimeSlice = useSelector((s: ShellState) => s.hypercardRuntime) as
    | HypercardRuntimeStateSlice['hypercardRuntime']
    | undefined;

  const currentCardId = stack.cards[current.card] ? current.card : stack.homeCard;
  const { cardDef, runtime, runAction } = useCardRuntimeHost({
    stack,
    currentCardId,
    currentParam: current.param,
    mode,
    runtimeSlice,
    sharedSelectors,
    sharedActions,
    debugHooks,
    dispatch: (action) => dispatch(action as any),
    store,
    nav: {
      go: (card, param) => navigate({ card, paramValue: param }),
      back: () => goBack(),
    },
  });

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
        <CardRenderer cardId={currentCardId} cardDef={cardDef} runtime={runtime} />
      </div>
    </>
  );

  const aiPanel = renderAIPanel ? renderAIPanel(runAction) : null;
  const debugPane = renderDebugPane ? renderDebugPane(runAction) : null;

  let layoutContent: React.ReactNode;
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
          <TabBar tabs={LAYOUT_TABS} active={layout} onSelect={(key) => dispatch(setLayout(key as LayoutMode))} />
        ) : null}
        <div data-part="content-area">{layoutContent}</div>
        <div data-part="footer-line">
          CardDefinition runtime · {Object.keys(stack.cards).length} cards · {layoutMode}
        </div>
        {toast && <Toast message={toast} onDone={() => dispatch(clearToast())} />}
      </WindowChrome>
    </HyperCardTheme>
  );
}
