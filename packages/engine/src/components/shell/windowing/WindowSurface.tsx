import { memo, type PointerEvent, type ReactNode } from 'react';
import { PARTS } from '../../../parts';
import type { DesktopWindowDef } from './types';
import { WindowResizeHandle } from './WindowResizeHandle';
import { WindowTitleBar } from './WindowTitleBar';

export interface WindowSurfaceProps {
  window: DesktopWindowDef;
  children?: ReactNode;
  onFocusWindow?: (windowId: string) => void;
  onCloseWindow?: (windowId: string) => void;
  onWindowDragStart?: (windowId: string, event: PointerEvent<HTMLDivElement>) => void;
  onWindowResizeStart?: (windowId: string, event: PointerEvent<HTMLButtonElement>) => void;
}

interface WindowBodyProps {
  children?: ReactNode;
}

const WindowBody = memo(function WindowBody({ children }: WindowBodyProps) {
  return <div data-part={PARTS.windowingWindowBody}>{children}</div>;
});

function WindowSurfaceBase({
  window,
  children,
  onFocusWindow,
  onCloseWindow,
  onWindowDragStart,
  onWindowResizeStart,
}: WindowSurfaceProps) {
  return (
    <section
      data-part={PARTS.windowingWindow}
      data-state={window.focused ? 'focused' : undefined}
      data-variant={window.isDialog ? 'dialog' : undefined}
      role="dialog"
      aria-modal={window.isDialog ?? false}
      aria-label={window.title}
      style={{
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        onFocusWindow?.(window.id);
      }}
    >
      <WindowTitleBar
        title={window.title}
        icon={window.icon}
        focused={window.focused}
        onClose={window.isDialog ? undefined : () => onCloseWindow?.(window.id)}
        onPointerDown={window.isDialog ? undefined : (event) => onWindowDragStart?.(window.id, event)}
      />
      <WindowBody>{children}</WindowBody>
      {window.isResizable !== false && !window.isDialog ? (
        <WindowResizeHandle onPointerDown={(event) => onWindowResizeStart?.(window.id, event)} />
      ) : null}
    </section>
  );
}

function areWindowSurfacePropsEqual(prev: WindowSurfaceProps, next: WindowSurfaceProps): boolean {
  return (
    prev.children === next.children &&
    prev.onFocusWindow === next.onFocusWindow &&
    prev.onCloseWindow === next.onCloseWindow &&
    prev.onWindowDragStart === next.onWindowDragStart &&
    prev.onWindowResizeStart === next.onWindowResizeStart &&
    prev.window.id === next.window.id &&
    prev.window.title === next.window.title &&
    prev.window.icon === next.window.icon &&
    prev.window.x === next.window.x &&
    prev.window.y === next.window.y &&
    prev.window.width === next.window.width &&
    prev.window.height === next.window.height &&
    prev.window.zIndex === next.window.zIndex &&
    prev.window.focused === next.window.focused &&
    prev.window.isDialog === next.window.isDialog &&
    prev.window.isResizable === next.window.isResizable
  );
}

export const WindowSurface = memo(WindowSurfaceBase, areWindowSurfacePropsEqual);
