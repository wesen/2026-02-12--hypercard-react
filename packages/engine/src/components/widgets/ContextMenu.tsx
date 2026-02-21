import { useEffect, useRef } from 'react';
import { PARTS } from '../../parts';

export type ContextMenuEntry = string | { separator: true };

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  onSelect: (item: string) => void;
  onClose: () => void;
}

function isSeparator(entry: ContextMenuEntry): entry is { separator: true } {
  return typeof entry !== 'string';
}

export function ContextMenu({ x, y, items, onSelect, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div data-part={PARTS.contextMenu} ref={ref} role="menu" style={{ left: x, top: y }}>
      {items.map((entry, i) =>
        isSeparator(entry) ? (
          <div key={`sep-${i}`} data-part={PARTS.contextMenuSeparator} />
        ) : (
          <div
            key={`${entry}-${i}`}
            data-part={PARTS.contextMenuItem}
            role="menuitem"
            onClick={() => {
              onSelect(entry);
              onClose();
            }}
          >
            {entry}
          </div>
        ),
      )}
    </div>
  );
}
