import { useCallback } from 'react';
import type { Stack, DSLAction, CardDefinition } from '../../dsl/types';
import type { DomainActionHandler } from '../../app/dispatchDSLAction';
import { dispatchDSLAction } from '../../app/dispatchDSLAction';
import type { CardTypeRenderer } from './CardRenderer';
import { CardRenderer } from './CardRenderer';
import { WindowChrome } from './WindowChrome';
import { TabBar } from './TabBar';
import { NavBar } from './NavBar';
import { LayoutSplit } from './LayoutSplit';
import { LayoutDrawer } from './LayoutDrawer';
import { LayoutCardChat } from './LayoutCardChat';
import { Toast } from '../widgets/Toast';

import { useDispatch, useSelector } from 'react-redux';
import { setLayout } from '../../features/navigation/navigationSlice';
import {
  selectCurrentNav,
  selectNavDepth,
  selectLayout,
  type NavigationStateSlice,
} from '../../features/navigation/selectors';
import {
  selectToast,
  type NotificationsStateSlice,
} from '../../features/notifications/selectors';
import { clearToast } from '../../features/notifications/notificationsSlice';

type ShellState = NavigationStateSlice & NotificationsStateSlice;

export interface HyperCardShellProps {
  stack: Stack;
  domainActionHandler?: DomainActionHandler;
  customRenderers?: Record<string, CardTypeRenderer>;
  /** Additional data from domain slices (merged with stack.data) */
  domainData?: Record<string, unknown[]>;
  navShortcuts?: Array<{ card: string; icon: string }>;
  /** Render function for AI panel (chat) — only used in split/drawer layouts */
  renderAIPanel?: (dispatch: (action: DSLAction) => void) => React.ReactNode;
  /** Theme class name to apply (e.g. 'theme-classic', 'theme-modern') */
  themeClass?: string;
}

const LAYOUT_TABS = [
  { key: 'split', label: '1 · Split Pane' },
  { key: 'drawer', label: '2 · Bottom Drawer' },
  { key: 'cardChat', label: '3 · Card as Chat' },
];

export function HyperCardShell({
  stack,
  domainActionHandler,
  customRenderers,
  domainData,
  navShortcuts,
  renderAIPanel,
  themeClass,
}: HyperCardShellProps) {
  const dispatch = useDispatch();
  const layout = useSelector((s: ShellState) => selectLayout(s));
  const current = useSelector((s: ShellState) => selectCurrentNav(s));
  const navDepth = useSelector((s: ShellState) => selectNavDepth(s));
  const toast = useSelector((s: ShellState) => selectToast(s));

  const dslDispatch = useCallback(
    (action: DSLAction) => dispatchDSLAction(dispatch, action, domainActionHandler),
    [dispatch, domainActionHandler],
  );

  const cardDef = stack.cards[current.card];

  // Merge stack.data with any domain-provided data
  const data: Record<string, Record<string, unknown>[]> = domainData
    ? { ...stack.data, ...(domainData as Record<string, Record<string, unknown>[]>) }
    : stack.data;

  const context = {
    data,
    settings: stack.settings,
    dispatch: dslDispatch,
    paramValue: current.param,
  };

  const mainContent = (
    <>
      <NavBar
        currentCard={current.card}
        cardDef={cardDef}
        navDepth={navDepth}
        onAction={dslDispatch}
        shortcuts={navShortcuts}
      />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CardRenderer
          cardId={current.card}
          cardDef={cardDef}
          context={context}
          customRenderers={customRenderers}
        />
      </div>
    </>
  );

  const aiPanel = renderAIPanel ? renderAIPanel(dslDispatch) : null;

  let layoutContent;
  if (layout === 'split' && aiPanel) {
    layoutContent = <LayoutSplit main={mainContent} side={aiPanel} />;
  } else if (layout === 'drawer' && aiPanel) {
    layoutContent = <LayoutDrawer main={mainContent} drawer={aiPanel} />;
  } else {
    layoutContent = <LayoutCardChat main={mainContent} />;
  }

  return (
    <WindowChrome
      title={`${stack.name} — HyperCard + AI`}
      icon={stack.icon}
      className={themeClass}
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
        DSL-driven · {Object.keys(stack.cards).length} cards
        {domainData?.items ? ` · ${(domainData.items as unknown[]).length} items` : ''}
        {stack.ai ? ` · ${stack.ai.intents.length} AI intents` : ''}
      </div>
      {toast && <Toast message={toast} onDone={() => dispatch(clearToast())} />}
    </WindowChrome>
  );
}
