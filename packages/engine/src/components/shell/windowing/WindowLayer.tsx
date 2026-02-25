import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { PARTS } from '../../../parts';
import { DesktopWindowScopeProvider } from './desktopMenuRuntime';
import type { DesktopWindowDef } from './types';
import { WindowSurface } from './WindowSurface';

export interface WindowLayerProps {
  /** Windows should be pre-sorted by z-index (lowest first). */
  windows: DesktopWindowDef[];
  renderWindowBody?: (window: DesktopWindowDef) => ReactNode;
  onFocusWindow?: (windowId: string) => void;
  onCloseWindow?: (windowId: string) => void;
  onWindowDragStart?: (windowId: string, event: PointerEvent<HTMLDivElement>) => void;
  onWindowResizeStart?: (windowId: string, event: PointerEvent<HTMLButtonElement>) => void;
  onWindowContextMenu?: (
    windowId: string,
    event: MouseEvent<HTMLElement>,
    source: 'surface' | 'title-bar',
  ) => void;
}

export function WindowLayer({
  windows,
  renderWindowBody,
  onFocusWindow,
  onCloseWindow,
  onWindowDragStart,
  onWindowResizeStart,
  onWindowContextMenu,
}: WindowLayerProps) {
  return (
    <section data-part={PARTS.windowingWindowLayer} aria-label="Window layer">
      {windows.map((window) => (
        <WindowSurface
          key={window.id}
          window={window}
          onFocusWindow={onFocusWindow}
          onCloseWindow={onCloseWindow}
          onWindowDragStart={onWindowDragStart}
          onWindowResizeStart={onWindowResizeStart}
          onWindowContextMenu={onWindowContextMenu}
        >
          <DesktopWindowScopeProvider windowId={window.id}>{renderWindowBody?.(window)}</DesktopWindowScopeProvider>
        </WindowSurface>
      ))}
    </section>
  );
}
