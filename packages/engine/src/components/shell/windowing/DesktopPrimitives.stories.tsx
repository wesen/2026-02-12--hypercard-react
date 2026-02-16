import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { useCallback } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import {
  selectActiveMenuId,
  selectFocusedWindow,
  selectSelectedIconId,
  selectWindowsByZ,
} from '../../../features/windowing/selectors';
import type { OpenWindowPayload } from '../../../features/windowing/types';
import {
  clearDesktopTransient,
  closeWindow,
  focusWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  setActiveMenu,
  setSelectedIcon,
  windowingReducer,
} from '../../../features/windowing/windowingSlice';
import { DesktopIconLayer } from './DesktopIconLayer';
import { DesktopMenuBar } from './DesktopMenuBar';
import type { DesktopIconDef, DesktopMenuSection, DesktopWindowDef } from './types';
import { useWindowInteractionController } from './useWindowInteractionController';
import { WindowLayer } from './WindowLayer';

// ── Fixtures ──

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '📈' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'ai-assistant', label: 'AI', icon: '🤖' },
];

const BIG_DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '📈' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { id: 'reports', label: 'Reports', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'mail', label: 'Mail', icon: '✉️' },
  { id: 'calculator', label: 'Calculator', icon: '🧮' },
  { id: 'trash', label: 'Trash', icon: '🗑️' },
];

const MENU_SECTIONS: DesktopMenuSection[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new-window', label: 'New Window', commandId: 'file.new-window', shortcut: 'Ctrl+N' },
      { id: 'close-window', label: 'Close Focused', commandId: 'file.close-focused', shortcut: 'Ctrl+W' },
      { separator: true },
      { id: 'about', label: 'About', commandId: 'help.about' },
    ],
  },
  {
    id: 'window',
    label: 'Window',
    items: [
      { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
      { id: 'cascade', label: 'Cascade Windows', commandId: 'window.cascade' },
      { separator: true },
      { id: 'bring-all', label: 'Bring All To Front', commandId: 'window.front' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [{ id: 'about-windowing', label: 'About Windowing', commandId: 'help.about' }],
  },
];

// ── Helpers ──

/** Convert windowing slice WindowInstance to the presentational DesktopWindowDef */
function toWindowDef(
  win: {
    id: string;
    title: string;
    icon?: string;
    bounds: { x: number; y: number; w: number; h: number };
    z: number;
    isDialog?: boolean;
    isResizable?: boolean;
  },
  focused: boolean,
): DesktopWindowDef {
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

let windowCounter = 0;
function makeOpenPayload(iconId: string, icons: DesktopIconDef[]): OpenWindowPayload {
  windowCounter += 1;
  const icon = icons.find((i) => i.id === iconId);
  return {
    id: `window:${iconId}`,
    title: icon?.label ?? iconId,
    icon: icon?.icon,
    bounds: { x: 140 + (windowCounter % 4) * 36, y: 40 + (windowCounter % 3) * 28, w: 320, h: 220 },
    content: { kind: 'app', appKey: iconId },
    dedupeKey: iconId,
  };
}

// ── Store factory ──

function createWindowingStore(preloadWindows?: OpenWindowPayload[]) {
  const store = configureStore({ reducer: { windowing: windowingReducer } });
  if (preloadWindows) {
    for (const win of preloadWindows) {
      store.dispatch(openWindow(win));
    }
  }
  return store;
}

// ── Connected Desktop ──

interface DesktopDemoInnerProps {
  icons: DesktopIconDef[];
}

function DesktopDemoInner({ icons }: DesktopDemoInnerProps) {
  const dispatch = useDispatch();
  const windows = useSelector(selectWindowsByZ);
  const focusedWin = useSelector(selectFocusedWindow);
  const activeMenuId = useSelector(selectActiveMenuId);
  const selectedIconId = useSelector(selectSelectedIconId);

  const windowDefs: DesktopWindowDef[] = windows.map((w) => toWindowDef(w, w.id === focusedWin?.id));

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

  // Interaction controller reads current geometry from store-derived defs
  const { beginMove, beginResize } = useWindowInteractionController({
    getWindowById: (id) => windowDefs.find((w) => w.id === id),
    onMoveWindow: handleMove,
    onResizeWindow: handleResize,
    onFocusWindow: handleFocus,
    constraints: { minX: 0, minY: 0, minWidth: 220, minHeight: 140 },
  });

  const handleOpenIcon = useCallback(
    (iconId: string) => {
      dispatch(setSelectedIcon(iconId));
      dispatch(openWindow(makeOpenPayload(iconId, icons)));
    },
    [dispatch, icons],
  );

  const handleCommand = useCallback(
    (commandId: string) => {
      if (commandId === 'file.new-window') {
        handleOpenIcon(icons[0].id);
        return;
      }
      if (commandId === 'file.close-focused' && focusedWin) {
        dispatch(closeWindow(focusedWin.id));
        return;
      }
      // tile/cascade are cosmetic — dispatch individual moves
      if (commandId === 'window.tile') {
        windows.forEach((w, i) => {
          dispatch(moveWindow({ id: w.id, x: 140 + (i % 3) * 280, y: 10 + Math.floor(i / 3) * 220 }));
          dispatch(resizeWindow({ id: w.id, w: 260, h: 200 }));
        });
        return;
      }
      if (commandId === 'window.cascade') {
        windows.forEach((w, i) => {
          dispatch(moveWindow({ id: w.id, x: 140 + i * 36, y: 20 + i * 28 }));
          dispatch(resizeWindow({ id: w.id, w: 340, h: 240 }));
        });
        return;
      }
    },
    [dispatch, focusedWin, handleOpenIcon, icons, windows],
  );

  return (
    <div
      style={{ position: 'absolute', inset: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          dispatch(clearDesktopTransient());
        }
      }}
    >
      <DesktopMenuBar
        sections={MENU_SECTIONS}
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
        renderWindowBody={(w) => (
          <div style={{ padding: 10 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>{w.title}</div>
            <p style={{ margin: 0, lineHeight: 1.4 }}>
              Window content. Drag the title bar, resize from the corner, use desktop icons to open/focus windows.
            </p>
          </div>
        )}
      />
    </div>
  );
}

// ── Story wrapper ──

interface DesktopDemoProps {
  icons?: DesktopIconDef[];
  preloadWindows?: OpenWindowPayload[];
}

function DesktopDemo({ icons, preloadWindows }: DesktopDemoProps) {
  const store = createWindowingStore(preloadWindows);
  return (
    <Provider store={store}>
      <DesktopDemoInner icons={icons ?? DESKTOP_ICONS} />
    </Provider>
  );
}

// ── Meta ──

const meta = {
  title: 'Shell/Windowing/Desktop Primitives',
  component: DesktopDemo,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DesktopDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──

export const Idle: Story = {
  args: {},
};

export const TwoWindowOverlap: Story = {
  args: {
    preloadWindows: [
      {
        id: 'w:inventory',
        title: 'Inventory',
        icon: '📦',
        bounds: { x: 180, y: 60, w: 360, h: 260 },
        content: { kind: 'app', appKey: 'inventory' },
      },
      {
        id: 'w:contacts',
        title: 'Contacts',
        icon: '👥',
        bounds: { x: 300, y: 140, w: 340, h: 240 },
        content: { kind: 'app', appKey: 'contacts' },
      },
    ],
  },
};

export const DenseWindowSet: Story = {
  args: {
    preloadWindows: [
      {
        id: 'w:inventory',
        title: 'Inventory',
        icon: '📦',
        bounds: { x: 140, y: 30, w: 320, h: 230 },
        content: { kind: 'app', appKey: 'inventory' },
      },
      {
        id: 'w:sales',
        title: 'Sales',
        icon: '📈',
        bounds: { x: 280, y: 70, w: 310, h: 240 },
        content: { kind: 'app', appKey: 'sales' },
      },
      {
        id: 'w:contacts',
        title: 'Contacts',
        icon: '👥',
        bounds: { x: 420, y: 110, w: 320, h: 230 },
        content: { kind: 'app', appKey: 'contacts' },
      },
      {
        id: 'w:ai',
        title: 'AI',
        icon: '🤖',
        bounds: { x: 560, y: 150, w: 300, h: 240 },
        content: { kind: 'app', appKey: 'ai' },
      },
    ],
  },
};

export const WithDialogWindow: Story = {
  args: {
    preloadWindows: [
      {
        id: 'w:inventory',
        title: 'Inventory',
        icon: '📦',
        bounds: { x: 160, y: 50, w: 360, h: 260 },
        content: { kind: 'app', appKey: 'inventory' },
      },
      {
        id: 'w:about',
        title: 'About HyperCard Desktop',
        bounds: { x: 320, y: 160, w: 300, h: 200 },
        isDialog: true,
        isResizable: false,
        content: { kind: 'dialog', dialogKey: 'about' },
      },
    ],
  },
};

export const BigDesktopIdle: Story = {
  args: {
    icons: BIG_DESKTOP_ICONS,
  },
};

export const BigDesktopWorkspace: Story = {
  args: {
    icons: BIG_DESKTOP_ICONS,
    preloadWindows: [
      {
        id: 'w:inventory',
        title: 'Inventory — Browse Items',
        icon: '📦',
        bounds: { x: 220, y: 20, w: 480, h: 360 },
        content: { kind: 'app', appKey: 'inventory' },
      },
      {
        id: 'w:contacts',
        title: 'Contacts — All',
        icon: '👥',
        bounds: { x: 340, y: 80, w: 420, h: 320 },
        content: { kind: 'app', appKey: 'contacts' },
      },
      {
        id: 'w:ai',
        title: 'AI Assistant',
        icon: '🤖',
        bounds: { x: 780, y: 30, w: 380, h: 500 },
        content: { kind: 'app', appKey: 'ai' },
      },
      {
        id: 'w:reports',
        title: 'Reports — Monthly Summary',
        icon: '📊',
        bounds: { x: 500, y: 300, w: 520, h: 340 },
        content: { kind: 'app', appKey: 'reports' },
      },
      {
        id: 'w:notes',
        title: 'Notes',
        icon: '📝',
        bounds: { x: 180, y: 420, w: 300, h: 260 },
        content: { kind: 'app', appKey: 'notes' },
      },
    ],
  },
};

export const BigDesktopSixWindows: Story = {
  args: {
    icons: BIG_DESKTOP_ICONS,
    preloadWindows: [
      {
        id: 'w:inventory',
        title: 'Inventory',
        icon: '📦',
        bounds: { x: 220, y: 10, w: 400, h: 300 },
        content: { kind: 'app', appKey: 'inventory' },
      },
      {
        id: 'w:sales',
        title: 'Sales Dashboard',
        icon: '📈',
        bounds: { x: 640, y: 10, w: 420, h: 280 },
        content: { kind: 'app', appKey: 'sales' },
      },
      {
        id: 'w:contacts',
        title: 'Contacts',
        icon: '👥',
        bounds: { x: 1080, y: 10, w: 380, h: 300 },
        content: { kind: 'app', appKey: 'contacts' },
      },
      {
        id: 'w:reports',
        title: 'Reports',
        icon: '📊',
        bounds: { x: 220, y: 340, w: 440, h: 320 },
        content: { kind: 'app', appKey: 'reports' },
      },
      {
        id: 'w:ai',
        title: 'AI Assistant',
        icon: '🤖',
        bounds: { x: 680, y: 320, w: 360, h: 360 },
        content: { kind: 'app', appKey: 'ai' },
      },
      {
        id: 'w:mail',
        title: 'Mail — Inbox',
        icon: '✉️',
        bounds: { x: 1060, y: 340, w: 400, h: 320 },
        content: { kind: 'app', appKey: 'mail' },
      },
    ],
  },
};
