import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type { DesktopWindowDef } from './types';

interface ActiveInteraction {
  mode: 'move' | 'resize';
  windowId: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export interface WindowInteractionConstraints {
  minX?: number;
  minY?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface WindowInteractionControllerOptions {
  getWindowById: (windowId: string) => DesktopWindowDef | undefined;
  onMoveWindow: (windowId: string, next: { x: number; y: number }) => void;
  onResizeWindow: (windowId: string, next: { width: number; height: number }) => void;
  onFocusWindow?: (windowId: string) => void;
  constraints?: WindowInteractionConstraints;
}

export function useWindowInteractionController({
  getWindowById,
  onMoveWindow,
  onResizeWindow,
  onFocusWindow,
  constraints,
}: WindowInteractionControllerOptions) {
  const activeRef = useRef<ActiveInteraction | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const stopInteraction = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    activeRef.current = null;
  }, []);

  useEffect(() => stopInteraction, [stopInteraction]);

  const beginInteraction = useCallback(
    (mode: 'move' | 'resize', windowId: string, event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const target = getWindowById(windowId);
      if (!target || typeof window === 'undefined') {
        return;
      }

      onFocusWindow?.(windowId);
      stopInteraction();
      activeRef.current = {
        mode,
        windowId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: target.x,
        startY: target.y,
        startWidth: target.width,
        startHeight: target.height,
      };

      const onMove = (moveEvent: PointerEvent) => {
        const active = activeRef.current;
        if (!active || active.windowId !== windowId) {
          return;
        }

        const dx = moveEvent.clientX - active.startClientX;
        const dy = moveEvent.clientY - active.startClientY;

        if (active.mode === 'move') {
          onMoveWindow(windowId, {
            x: Math.max(constraints?.minX ?? 0, active.startX + dx),
            y: Math.max(constraints?.minY ?? 0, active.startY + dy),
          });
          return;
        }

        onResizeWindow(windowId, {
          width: Math.max(constraints?.minWidth ?? 220, active.startWidth + dx),
          height: Math.max(constraints?.minHeight ?? 140, active.startHeight + dy),
        });
      };

      const onUp = () => {
        stopInteraction();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      cleanupRef.current = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };
    },
    [
      constraints?.minHeight,
      constraints?.minWidth,
      constraints?.minX,
      constraints?.minY,
      getWindowById,
      onFocusWindow,
      onMoveWindow,
      onResizeWindow,
      stopInteraction,
    ],
  );

  return {
    beginMove: (windowId: string, event: ReactPointerEvent<HTMLElement>) => beginInteraction('move', windowId, event),
    beginResize: (windowId: string, event: ReactPointerEvent<HTMLElement>) =>
      beginInteraction('resize', windowId, event),
    stopInteraction,
  };
}
