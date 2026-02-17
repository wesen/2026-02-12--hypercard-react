import { type MouseEvent, type PointerEvent, type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearToast } from '../../../features/notifications/notificationsSlice';
import { type NotificationsStateSlice, selectToast } from '../../../features/notifications/selectors';
import {
  selectActiveMenuId,
  selectFocusedWindow,
  selectSelectedIconId,
  selectWindowsByZ,
  type WindowingStateSlice,
} from '../../../desktop/core/state/selectors';
import type { WindowInstance } from '../../../desktop/core/state/types';
import {
  clearDesktopTransient,
  closeWindow,
  focusWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  setActiveMenu,
  setSelectedIcon,
} from '../../../desktop/core/state/windowingSlice';
import { dragOverlayStore, useDragOverlaySnapshot } from './dragOverlayStore';
import { PluginCardSessionHost } from './PluginCardSessionHost';
import { routeDesktopCommand } from './desktopCommandRouter';
import type { DesktopShellProps } from './desktopShellTypes';
import type { DesktopIconDef, DesktopMenuSection, DesktopWindowDef } from './types';
import { useWindowInteractionController } from './useWindowInteractionController';

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

let sessionCounter = 0;
function nextSessionId() {
  sessionCounter += 1;
  return `session-${sessionCounter}`;
}

export interface DesktopShellControllerResult {
  themeClass?: string;
  menus: DesktopMenuSection[];
  icons: DesktopIconDef[];
  activeMenuId: string | null;
  selectedIconId: string | null;
  windows: DesktopWindowDef[];
  toast: string | null;
  onDesktopBackgroundClick: (event: MouseEvent<HTMLDivElement>) => void;
  onActiveMenuChange: (id: string | null) => void;
  onCommand: (commandId: string) => void;
  onSelectIcon: (id: string) => void;
  onOpenIcon: (id: string) => void;
  onFocusWindow: (id: string) => void;
  onCloseWindow: (id: string) => void;
  onWindowDragStart: (windowId: string, event: PointerEvent<HTMLDivElement>) => void;
  onWindowResizeStart: (windowId: string, event: PointerEvent<HTMLButtonElement>) => void;
  renderWindowBody: (window: DesktopWindowDef) => ReactNode;
  onToastDone: () => void;
}

export function useDesktopShellController({
  stack,
  mode = 'interactive',
  themeClass,
  homeParam,
  menus: menusProp,
  icons: iconsProp,
  renderAppWindow,
  onCommand: onCommandProp,
}: DesktopShellProps): DesktopShellControllerResult {
  const dispatch = useDispatch();
  const lastOpenedHomeKeyRef = useRef<string | null>(null);
  const windowBodyCacheRef = useRef<Map<string, { signature: string; body: ReactNode }>>(new Map());
  const windows = useSelector((s: ShellState) => selectWindowsByZ(s));
  const focusedWin = useSelector((s: ShellState) => selectFocusedWindow(s));
  const activeMenuId = useSelector((s: ShellState) => selectActiveMenuId(s));
  const selectedIconId = useSelector((s: ShellState) => selectSelectedIconId(s));
  const toast = useSelector((s: ShellState) => selectToast(s));
  const dragOverlay = useDragOverlaySnapshot();
  const focusedWindowId = focusedWin?.id ?? null;

  const icons = useMemo(() => {
    if (iconsProp) return iconsProp;
    const cardIds = Object.keys(stack.cards);
    return cardIds.map((cardId) => ({
      id: cardId,
      label: stack.cards[cardId].title ?? cardId,
      icon: stack.cards[cardId].icon ?? '📄',
    }));
  }, [iconsProp, stack.cards]);

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
      const overlayDraft = dragOverlay.draftsById[w.id];
      if (overlayDraft) {
        return {
          ...toWindowDef(w, w.id === focusedWin?.id),
          x: overlayDraft.x,
          y: overlayDraft.y,
          width: overlayDraft.width,
          height: overlayDraft.height,
        };
      }
      return toWindowDef(w, w.id === focusedWin?.id);
    });
  }, [dragOverlay.draftsById, focusedWin?.id, windows]);

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
      dragOverlayStore.clear(id);
      dispatch(closeWindow(id));
    },
    [dispatch],
  );
  const handlePreviewMove = useCallback((id: string, next: { x: number; y: number }) => {
    const win = windowDefsByIdRef.current[id];
    if (!win) return;
    dragOverlayStore.update(id, { x: next.x, y: next.y, width: win.width, height: win.height });
  }, []);
  const handlePreviewResize = useCallback(
    (id: string, next: { width: number; height: number }) => {
      const win = windowDefsByIdRef.current[id];
      if (!win) return;
      dragOverlayStore.update(id, {
        x: win.x,
        y: win.y,
        width: next.width,
        height: next.height,
      });
    },
    [],
  );
  const handleCommitMove = useCallback(
    (id: string, next: { x: number; y: number }) => {
      dispatch(moveWindow({ id, x: next.x, y: next.y }));
      dragOverlayStore.clear(id);
    },
    [dispatch],
  );
  const handleCommitResize = useCallback(
    (id: string, next: { width: number; height: number }) => {
      dispatch(resizeWindow({ id, w: next.width, h: next.height }));
      dragOverlayStore.clear(id);
    },
    [dispatch],
  );
  const handleCancelInteraction = useCallback((id: string) => {
    dragOverlayStore.clear(id);
  }, []);
  const handleBeginInteraction = useCallback(
    (id: string, interactionMode: 'move' | 'resize', initial: { x: number; y: number; width: number; height: number }) =>
      dragOverlayStore.begin(id, interactionMode, initial),
    [],
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
    return () => dragOverlayStore.clearAll();
  }, []);

  useEffect(() => {
    dragOverlayStore.pruneMissing(windows.map((w) => w.id));
  }, [windows]);

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
      const handled = routeDesktopCommand(commandId, {
        homeCardId: stack.homeCard,
        focusedWindowId: focusedWin?.id ?? null,
        openCardWindow,
        closeWindow: handleClose,
        tileWindows: () => {
          dragOverlayStore.clearAll();
          windows.forEach((w, i) => {
            dispatch(moveWindow({ id: w.id, x: 140 + (i % 3) * 300, y: 10 + Math.floor(i / 3) * 260 }));
            dispatch(resizeWindow({ id: w.id, w: 280, h: 240 }));
          });
        },
        cascadeWindows: () => {
          dragOverlayStore.clearAll();
          windows.forEach((w, i) => {
            dispatch(moveWindow({ id: w.id, x: 140 + i * 36, y: 20 + i * 28 }));
            dispatch(resizeWindow({ id: w.id, w: 420, h: 340 }));
          });
        },
      });
      if (handled) return;
      onCommandProp?.(commandId);
    },
    [dispatch, focusedWin?.id, handleClose, onCommandProp, openCardWindow, stack.homeCard, windows],
  );

  const buildWindowBody = useCallback(
    (winInstance: WindowInstance) => {
      if (!winInstance) return null;

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

      return (
        <div style={{ padding: 10 }}>
          <p>{winInstance.title}</p>
        </div>
      );
    },
    [mode, renderAppWindow, stack],
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

  const handleDesktopBackgroundClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        dispatch(clearDesktopTransient());
      }
    },
    [dispatch],
  );

  const handleActiveMenuChange = useCallback((id: string | null) => dispatch(setActiveMenu(id)), [dispatch]);
  const handleSelectIcon = useCallback((id: string) => dispatch(setSelectedIcon(id)), [dispatch]);
  const handleToastDone = useCallback(() => dispatch(clearToast()), [dispatch]);

  return {
    themeClass,
    menus,
    icons,
    activeMenuId,
    selectedIconId,
    windows: windowDefs,
    toast,
    onDesktopBackgroundClick: handleDesktopBackgroundClick,
    onActiveMenuChange: handleActiveMenuChange,
    onCommand: handleCommand,
    onSelectIcon: handleSelectIcon,
    onOpenIcon: handleOpenIcon,
    onFocusWindow: handleFocus,
    onCloseWindow: handleClose,
    onWindowDragStart: beginMove,
    onWindowResizeStart: beginResize,
    renderWindowBody,
    onToastDone: handleToastDone,
  };
}
