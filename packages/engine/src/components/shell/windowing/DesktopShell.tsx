import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { CardStackDefinition, SharedActionRegistry, SharedSelectorRegistry } from '../../../cards';
import type { RuntimeDebugHooks } from '../../../cards/runtime';
import { clearToast } from '../../../features/notifications/notificationsSlice';
import { type NotificationsStateSlice, selectToast } from '../../../features/notifications/selectors';
import {
  selectActiveMenuId,
  selectFocusedWindow,
  selectSelectedIconId,
  selectWindowsByZ,
  type WindowingStateSlice,
} from '../../../features/windowing/selectors';
import type { WindowInstance } from '../../../features/windowing/types';
import {
  clearDesktopTransient,
  closeWindow,
  focusWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  setActiveMenu,
  setSelectedIcon,
} from '../../../features/windowing/windowingSlice';
import { PARTS } from '../../../parts';
import { HyperCardTheme } from '../../../theme/HyperCardTheme';
import { Toast } from '../../widgets/Toast';
import { CardSessionHost } from './CardSessionHost';
import { DesktopIconLayer } from './DesktopIconLayer';
import { DesktopMenuBar } from './DesktopMenuBar';
import type { DesktopIconDef, DesktopMenuSection, DesktopWindowDef } from './types';
import { useWindowInteractionController } from './useWindowInteractionController';
import { WindowLayer } from './WindowLayer';

type ShellState = WindowingStateSlice & NotificationsStateSlice & Record<string, unknown>;

/** Convert windowing state WindowInstance to presentational DesktopWindowDef */
function toWindowDef(win: WindowInstance, focused: boolean): DesktopWindowDef {
  return {
    id: win.id,
    title: win.title,
    icon: win.icon,
    x: win.bounds.x,
    y: win.bounds.y,
    width: win.bounds.w,
    height: win.bounds.h,
    zIndex: win.z,
    focused,
    isDialog: win.isDialog,
    isResizable: win.isResizable,
  };
}

export interface DesktopShellProps {
  stack: CardStackDefinition<any>;
  sharedSelectors?: SharedSelectorRegistry<any>;
  sharedActions?: SharedActionRegistry<any>;
  debugHooks?: RuntimeDebugHooks;
  mode?: 'interactive' | 'preview';
  themeClass?: string;
  /** Custom menu sections. If omitted, a default menu is generated. */
  menus?: DesktopMenuSection[];
  /** Custom desktop icons. If omitted, icons are generated from stack cards. */
  icons?: DesktopIconDef[];
}

let sessionCounter = 0;
function nextSessionId() {
  sessionCounter += 1;
  return `session-${sessionCounter}`;
}

export function DesktopShell({
  stack,
  sharedSelectors,
  sharedActions,
  debugHooks,
  mode = 'interactive',
  themeClass,
  menus: menusProp,
  icons: iconsProp,
}: DesktopShellProps) {
  const dispatch = useDispatch();
  const windows = useSelector((s: ShellState) => selectWindowsByZ(s));
  const focusedWin = useSelector((s: ShellState) => selectFocusedWindow(s));
  const activeMenuId = useSelector((s: ShellState) => selectActiveMenuId(s));
  const selectedIconId = useSelector((s: ShellState) => selectSelectedIconId(s));
  const toast = useSelector((s: ShellState) => selectToast(s));

  // Generate icons from stack cards if not provided
  const icons = useMemo(() => {
    if (iconsProp) return iconsProp;
    const cardIds = Object.keys(stack.cards);
    return cardIds.map((cardId, i) => ({
      id: cardId,
      label: stack.cards[cardId].title ?? cardId,
      icon: stack.cards[cardId].icon ?? '📄',
      x: 20,
      y: 16 + i * 88,
    }));
  }, [iconsProp, stack.cards]);

  // Generate menus if not provided
  const menus = useMemo((): DesktopMenuSection[] => {
    if (menusProp) return menusProp;
    return [
      {
        id: 'file',
        label: 'File',
        items: [
          {
            id: 'new-home',
            label: `New ${stack.cards[stack.homeCard]?.title ?? 'Home'} Window`,
            commandId: 'window.open.home',
            shortcut: 'Ctrl+N',
          },
          { id: 'close-focused', label: 'Close Window', commandId: 'window.close-focused', shortcut: 'Ctrl+W' },
        ],
      },
      {
        id: 'cards',
        label: 'Cards',
        items: Object.keys(stack.cards).map((cardId) => ({
          id: `open-${cardId}`,
          label: `${stack.cards[cardId].icon ?? ''} ${stack.cards[cardId].title ?? cardId}`.trim(),
          commandId: `window.open.card.${cardId}`,
        })),
      },
      {
        id: 'window',
        label: 'Window',
        items: [
          { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
          { id: 'cascade', label: 'Cascade Windows', commandId: 'window.cascade' },
        ],
      },
    ];
  }, [menusProp, stack.cards, stack.homeCard]);

  // Open home card on mount
  useEffect(() => {
    const homeCard = stack.cards[stack.homeCard];
    if (!homeCard) return;
    const sid = nextSessionId();
    dispatch(
      openWindow({
        id: `window:${stack.homeCard}:${sid}`,
        title: homeCard.title ?? stack.homeCard,
        icon: homeCard.icon,
        bounds: { x: 140, y: 20, w: 420, h: 340 },
        content: {
          kind: 'card',
          card: { stackId: stack.id, cardId: stack.homeCard, cardSessionId: sid },
        },
        dedupeKey: stack.homeCard,
      }),
    );
  }, [dispatch, stack.id, stack.homeCard, stack.cards]);

  const windowDefs = useMemo(
    () => windows.map((w) => toWindowDef(w, w.id === focusedWin?.id)),
    [windows, focusedWin?.id],
  );

  const handleFocus = useCallback((id: string) => dispatch(focusWindow(id)), [dispatch]);
  const handleClose = useCallback((id: string) => dispatch(closeWindow(id)), [dispatch]);
  const handleMove = useCallback(
    (id: string, next: { x: number; y: number }) => dispatch(moveWindow({ id, x: next.x, y: next.y })),
    [dispatch],
  );
  const handleResize = useCallback(
    (id: string, next: { width: number; height: number }) =>
      dispatch(resizeWindow({ id, w: next.width, h: next.height })),
    [dispatch],
  );

  const { beginMove, beginResize } = useWindowInteractionController({
    getWindowById: (id) => windowDefs.find((w) => w.id === id),
    onMoveWindow: handleMove,
    onResizeWindow: handleResize,
    onFocusWindow: handleFocus,
    constraints: { minX: 0, minY: 0, minWidth: 220, minHeight: 140 },
  });

  const openCardWindow = useCallback(
    (cardId: string) => {
      const cardDef = stack.cards[cardId];
      if (!cardDef) return;
      const sid = nextSessionId();
      dispatch(
        openWindow({
          id: `window:${cardId}:${sid}`,
          title: cardDef.title ?? cardId,
          icon: cardDef.icon,
          bounds: { x: 160 + (sessionCounter % 5) * 32, y: 30 + (sessionCounter % 4) * 24, w: 420, h: 340 },
          content: {
            kind: 'card',
            card: { stackId: stack.id, cardId, cardSessionId: sid },
          },
          dedupeKey: cardId,
        }),
      );
    },
    [dispatch, stack.id, stack.cards],
  );

  const handleOpenIcon = useCallback(
    (iconId: string) => {
      dispatch(setSelectedIcon(iconId));
      openCardWindow(iconId);
    },
    [dispatch, openCardWindow],
  );

  const handleCommand = useCallback(
    (commandId: string) => {
      if (commandId === 'window.open.home') {
        openCardWindow(stack.homeCard);
        return;
      }
      if (commandId === 'window.close-focused' && focusedWin) {
        dispatch(closeWindow(focusedWin.id));
        return;
      }
      if (commandId.startsWith('window.open.card.')) {
        const cardId = commandId.replace('window.open.card.', '');
        openCardWindow(cardId);
        return;
      }
      if (commandId === 'window.tile') {
        windows.forEach((w, i) => {
          dispatch(moveWindow({ id: w.id, x: 140 + (i % 3) * 300, y: 10 + Math.floor(i / 3) * 260 }));
          dispatch(resizeWindow({ id: w.id, w: 280, h: 240 }));
        });
        return;
      }
      if (commandId === 'window.cascade') {
        windows.forEach((w, i) => {
          dispatch(moveWindow({ id: w.id, x: 140 + i * 36, y: 20 + i * 28 }));
          dispatch(resizeWindow({ id: w.id, w: 420, h: 340 }));
        });
        return;
      }
    },
    [dispatch, focusedWin, openCardWindow, stack.homeCard, windows],
  );

  const renderWindowBody = useCallback(
    (winDef: DesktopWindowDef) => {
      const winInstance = windows.find((w) => w.id === winDef.id);
      if (!winInstance) return null;

      const cardRef = winInstance.content.card;
      if (winInstance.content.kind === 'card' && cardRef) {
        return (
          <CardSessionHost
            windowId={winInstance.id}
            sessionId={cardRef.cardSessionId}
            stack={stack}
            sharedSelectors={sharedSelectors}
            sharedActions={sharedActions}
            debugHooks={debugHooks}
            mode={mode}
          />
        );
      }

      // Fallback for non-card windows
      return (
        <div style={{ padding: 10 }}>
          <p>{winInstance.title}</p>
        </div>
      );
    },
    [windows, stack, sharedSelectors, sharedActions, debugHooks, mode],
  );

  return (
    <HyperCardTheme theme={themeClass}>
      <div
        data-part={PARTS.windowingDesktopShell}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            dispatch(clearDesktopTransient());
          }
        }}
      >
        <DesktopMenuBar
          sections={menus}
          activeMenuId={activeMenuId}
          onActiveMenuChange={(id) => dispatch(setActiveMenu(id))}
          onCommand={handleCommand}
        />
        <DesktopIconLayer
          icons={icons}
          selectedIconId={selectedIconId}
          onSelectIcon={(id) => dispatch(setSelectedIcon(id))}
          onOpenIcon={handleOpenIcon}
        />
        <WindowLayer
          windows={windowDefs}
          onFocusWindow={handleFocus}
          onCloseWindow={handleClose}
          onWindowDragStart={(id, event) => beginMove(id, event)}
          onWindowResizeStart={(id, event) => beginResize(id, event)}
          renderWindowBody={renderWindowBody}
        />
        {toast && <Toast message={toast} onDone={() => dispatch(clearToast())} />}
      </div>
    </HyperCardTheme>
  );
}
