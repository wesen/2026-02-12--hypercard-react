import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { CardStackDefinition } from '../../../cards';
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
  beginWindowInteraction,
  cancelWindowInteraction,
  clearWindowInteraction,
  commitWindowInteraction,
  clearDesktopTransient,
  closeWindow,
  focusWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  setActiveMenu,
  setSelectedIcon,
  updateWindowInteractionDraft,
} from '../../../features/windowing/windowingSlice';
import { PARTS } from '../../../parts';
import { HyperCardTheme } from '../../../theme/HyperCardTheme';
import { Toast } from '../../widgets/Toast';
import { DesktopIconLayer } from './DesktopIconLayer';
import { DesktopMenuBar } from './DesktopMenuBar';
import { PluginCardSessionHost } from './PluginCardSessionHost';
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

function getWindowBodySignature(win: WindowInstance, mode: 'interactive' | 'preview'): string {
  if (win.content.kind === 'card') {
    const card = win.content.card;
    return `card:${card?.stackId ?? ''}:${card?.cardId ?? ''}:${card?.cardSessionId ?? ''}:${card?.param ?? ''}:${mode}`;
  }

  if (win.content.kind === 'app') {
    return `app:${win.content.appKey ?? ''}:${win.id}:${mode}`;
  }

  return `dialog:${win.content.dialogKey ?? ''}:${win.title}:${win.id}:${mode}`;
}

export interface DesktopShellProps {
  stack: CardStackDefinition;
  mode?: 'interactive' | 'preview';
  themeClass?: string;
  /** Optional initial param injected into the first auto-opened home-card window. */
  homeParam?: string;
  /** Custom menu sections. If omitted, a default menu is generated. */
  menus?: DesktopMenuSection[];
  /** Custom desktop icons. If omitted, icons are generated from stack cards. */
  icons?: DesktopIconDef[];
  /**
   * Render a custom window body for non-card windows (content.kind === 'app').
   * Receives the appKey from the window's content and the window id.
   * Return null to fall back to the default placeholder.
   */
  renderAppWindow?: (appKey: string, windowId: string) => ReactNode;
  /** Called for menu/icon commands not handled by the built-in command set. */
  onCommand?: (commandId: string) => void;
}

let sessionCounter = 0;
function nextSessionId() {
  sessionCounter += 1;
  return `session-${sessionCounter}`;
}

export function DesktopShell({
  stack,
  mode = 'interactive',
  themeClass,
  homeParam,
  menus: menusProp,
  icons: iconsProp,
  renderAppWindow,
  onCommand: onCommandProp,
}: DesktopShellProps) {
  const dispatch = useDispatch();
  const lastOpenedHomeKeyRef = useRef<string | null>(null);
  const windowBodyCacheRef = useRef<Map<string, { signature: string; body: ReactNode }>>(new Map());
  const windows = useSelector((s: ShellState) => selectWindowsByZ(s));
  const focusedWin = useSelector((s: ShellState) => selectFocusedWindow(s));
  const activeMenuId = useSelector((s: ShellState) => selectActiveMenuId(s));
  const selectedIconId = useSelector((s: ShellState) => selectSelectedIconId(s));
  const toast = useSelector((s: ShellState) => selectToast(s));
  const interactionDraftsById = useSelector((s: ShellState) => s.windowing.interaction.draftsById);
  const focusedWindowId = focusedWin?.id ?? null;

  // Generate icons from stack cards if not provided
  const icons = useMemo(() => {
    if (iconsProp) return iconsProp;
    const cardIds = Object.keys(stack.cards);
    return cardIds.map((cardId) => ({
      id: cardId,
      label: stack.cards[cardId].title ?? cardId,
      icon: stack.cards[cardId].icon ?? '📄',
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
    const homeKey = `${stack.id}:${stack.homeCard}:${homeParam ?? ''}`;
    if (lastOpenedHomeKeyRef.current === homeKey) return;
    lastOpenedHomeKeyRef.current = homeKey;

    const sid = nextSessionId();
    dispatch(
      openWindow({
        id: `window:${stack.homeCard}:${sid}`,
        title: homeCard.title ?? stack.homeCard,
        icon: homeCard.icon,
        bounds: { x: 140, y: 20, w: 420, h: 340 },
        content: {
          kind: 'card',
          card: { stackId: stack.id, cardId: stack.homeCard, cardSessionId: sid, param: homeParam },
        },
        dedupeKey: stack.homeCard,
      }),
    );
  }, [dispatch, homeParam, stack.id, stack.homeCard, stack.cards]);

  const windowDefs = useMemo(() => {
    return windows.map((w) => {
      const draft = interactionDraftsById[w.id];
      if (!draft) return toWindowDef(w, w.id === focusedWin?.id);
      return {
        ...toWindowDef(w, w.id === focusedWin?.id),
        x: draft.x,
        y: draft.y,
        width: draft.w,
        height: draft.h,
      };
    });
  }, [focusedWin?.id, interactionDraftsById, windows]);

  const windowDefsById = useMemo(() => {
    const byId: Record<string, DesktopWindowDef> = {};
    for (const win of windowDefs) byId[win.id] = win;
    return byId;
  }, [windowDefs]);
  const windowDefsByIdRef = useRef(windowDefsById);
  useEffect(() => {
    windowDefsByIdRef.current = windowDefsById;
  }, [windowDefsById]);

  const windowsById = useMemo(() => {
    const byId: Record<string, WindowInstance> = {};
    for (const win of windows) byId[win.id] = win;
    return byId;
  }, [windows]);

  const handleFocus = useCallback(
    (id: string) => {
      if (id === focusedWindowId) return;
      dispatch(focusWindow(id));
    },
    [dispatch, focusedWindowId],
  );
  const handleClose = useCallback(
    (id: string) => {
      dispatch(closeWindow(id));
    },
    [dispatch],
  );
  const handlePreviewMove = useCallback((id: string, next: { x: number; y: number }) => {
    const win = windowDefsByIdRef.current[id];
    if (!win) return;
    dispatch(
      updateWindowInteractionDraft({
        id,
        bounds: { x: next.x, y: next.y, w: win.width, h: win.height },
      }),
    );
  }, [dispatch]);
  const handlePreviewResize = useCallback(
    (id: string, next: { width: number; height: number }) => {
      const win = windowDefsByIdRef.current[id];
      if (!win) return;
      dispatch(
        updateWindowInteractionDraft({
          id,
          bounds: {
            x: win.x,
            y: win.y,
            w: next.width,
            h: next.height,
          },
        }),
      );
    },
    [dispatch],
  );
  const handleCommitMove = useCallback(
    (id: string) => {
      dispatch(commitWindowInteraction({ id }));
    },
    [dispatch],
  );
  const handleCommitResize = useCallback(
    (id: string) => {
      dispatch(commitWindowInteraction({ id }));
    },
    [dispatch],
  );
  const handleCancelInteraction = useCallback((id: string) => {
    dispatch(cancelWindowInteraction({ id }));
  }, [dispatch]);
  const handleBeginInteraction = useCallback(
    (id: string, mode: 'move' | 'resize', initial: { x: number; y: number; width: number; height: number }) => {
      dispatch(beginWindowInteraction({ id, mode, bounds: { x: initial.x, y: initial.y, w: initial.width, h: initial.height } }));
    },
    [dispatch],
  );
  const getWindowDefById = useCallback((id: string) => windowDefsByIdRef.current[id], []);

  const { beginMove, beginResize } = useWindowInteractionController({
    getWindowById: getWindowDefById,
    onBeginWindowInteraction: handleBeginInteraction,
    onMoveWindow: handlePreviewMove,
    onResizeWindow: handlePreviewResize,
    onCommitMoveWindow: handleCommitMove,
    onCommitResizeWindow: handleCommitResize,
    onCancelWindowInteraction: handleCancelInteraction,
    onFocusWindow: handleFocus,
    constraints: { minX: 0, minY: 0, minWidth: 220, minHeight: 140 },
  });

  useEffect(() => {
    return () => {
      dispatch(clearWindowInteraction());
    };
  }, [dispatch]);

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
      if (stack.cards[iconId]) {
        openCardWindow(iconId);
      } else {
        onCommandProp?.(`icon.open.${iconId}`);
      }
    },
    [dispatch, onCommandProp, openCardWindow, stack.cards],
  );

  const handleCommand = useCallback(
    (commandId: string) => {
      if (commandId === 'window.open.home') {
        openCardWindow(stack.homeCard);
        return;
      }
      if (commandId === 'window.close-focused' && focusedWin) {
        handleClose(focusedWin.id);
        return;
      }
      if (commandId.startsWith('window.open.card.')) {
        const cardId = commandId.replace('window.open.card.', '');
        openCardWindow(cardId);
        return;
      }
      if (commandId === 'window.tile') {
        dispatch(clearWindowInteraction());
        windows.forEach((w, i) => {
          dispatch(moveWindow({ id: w.id, x: 140 + (i % 3) * 300, y: 10 + Math.floor(i / 3) * 260 }));
          dispatch(resizeWindow({ id: w.id, w: 280, h: 240 }));
        });
        return;
      }
      if (commandId === 'window.cascade') {
        dispatch(clearWindowInteraction());
        windows.forEach((w, i) => {
          dispatch(moveWindow({ id: w.id, x: 140 + i * 36, y: 20 + i * 28 }));
          dispatch(resizeWindow({ id: w.id, w: 420, h: 340 }));
        });
        return;
      }
      onCommandProp?.(commandId);
    },
    [dispatch, focusedWin, handleClose, onCommandProp, openCardWindow, stack.homeCard, windows],
  );

  const buildWindowBody = useCallback(
    (winInstance: WindowInstance) => {
      if (!winInstance) return null;

      // App windows — delegate to host-provided renderer
      if (winInstance.content.kind === 'app' && winInstance.content.appKey && renderAppWindow) {
        const rendered = renderAppWindow(winInstance.content.appKey, winInstance.id);
        if (rendered) return rendered;
      }

      const cardRef = winInstance.content.card;
      if (winInstance.content.kind === 'card' && cardRef) {
        return (
          <PluginCardSessionHost
            windowId={winInstance.id}
            sessionId={cardRef.cardSessionId}
            stack={stack}
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
    [stack, mode, renderAppWindow],
  );

  useEffect(() => {
    windowBodyCacheRef.current.clear();
  }, [buildWindowBody]);

  const windowBodyById = useMemo(() => {
    const nextCache = new Map<string, { signature: string; body: ReactNode }>();
    const nextBodies: Record<string, ReactNode> = {};

    for (const win of windows) {
      const signature = getWindowBodySignature(win, mode);
      const cached = windowBodyCacheRef.current.get(win.id);
      if (cached && cached.signature === signature) {
        nextBodies[win.id] = cached.body;
        nextCache.set(win.id, cached);
        continue;
      }

      const body = buildWindowBody(win);
      nextBodies[win.id] = body;
      nextCache.set(win.id, { signature, body });
    }

    windowBodyCacheRef.current = nextCache;
    return nextBodies;
  }, [buildWindowBody, mode, windows]);

  const renderWindowBody = useCallback(
    (winDef: DesktopWindowDef) => {
      if (!windowsById[winDef.id]) return null;
      return windowBodyById[winDef.id] ?? null;
    },
    [windowBodyById, windowsById],
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
          onWindowDragStart={beginMove}
          onWindowResizeStart={beginResize}
          renderWindowBody={renderWindowBody}
        />
        {toast && <Toast message={toast} onDone={() => dispatch(clearToast())} />}
      </div>
    </HyperCardTheme>
  );
}
