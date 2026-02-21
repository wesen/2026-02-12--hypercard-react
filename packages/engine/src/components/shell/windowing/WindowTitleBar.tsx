import type { PointerEvent } from 'react';
import { PARTS } from '../../../parts';

export interface WindowTitleBarProps {
  title: string;
  icon?: string;
  focused?: boolean;
  onClose?: () => void;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
}

export function WindowTitleBar({ title, icon, focused, onClose, onPointerDown }: WindowTitleBarProps) {
  return (
    <div
      data-part={PARTS.windowingWindowTitleBar}
      data-state={focused ? 'focused' : undefined}
      onPointerDown={onPointerDown}
    >
      <button
        type="button"
        data-part={PARTS.windowingCloseButton}
        aria-label={`Close ${title}`}
        onClick={(event) => {
          event.stopPropagation();
          onClose?.();
        }}
      />
      <div data-part={PARTS.windowingWindowTitle}>
        {icon ? `${icon} ` : ''}
        {title}
      </div>
    </div>
  );
}
