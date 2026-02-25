import { useEffect, useRef } from 'react';
import { PARTS } from '../../parts';

export interface ContextMenuActionEntry {
  id: string;
  label: string;
  commandId?: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  payload?: Record<string, unknown>;
}

export type ContextMenuEntry = string | { separator: true } | ContextMenuActionEntry;

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  /** Backward-compatible string selection callback. */
  onSelect: (item: string) => void;
  onAction?: (entry: ContextMenuActionEntry) => void;
  onClose: () => void;
}

function isSeparator(entry: ContextMenuEntry): entry is { separator: true } {
  return typeof entry !== 'string' && 'separator' in entry;
}

function isActionEntry(entry: ContextMenuEntry): entry is ContextMenuActionEntry {
  return typeof entry !== 'string' && !isSeparator(entry);
}

export function ContextMenu({ x, y, items, onSelect, onAction, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div data-part={PARTS.contextMenu} ref={ref} role="menu" style={{ left: x, top: y }} tabIndex={-1}>
      {items.map((entry, i) =>
        isSeparator(entry) ? (
          <div key={`sep-${i}`} data-part={PARTS.contextMenuSeparator} />
        ) : isActionEntry(entry) ? (
          <button
            key={entry.id}
            type="button"
            data-part={PARTS.contextMenuItem}
            role="menuitem"
            disabled={entry.disabled}
            aria-checked={entry.checked ? true : undefined}
            onClick={() => {
              if (onAction) {
                onAction(entry);
              } else if (entry.commandId) {
                onSelect(entry.commandId);
              }
              onClose();
            }}
          >
            <span>{entry.checked ? '✓ ' : ''}{entry.label}</span>
            {entry.shortcut ? <span data-part={PARTS.windowingMenuShortcut}>{entry.shortcut}</span> : null}
          </button>
        ) : (
          <button
            key={`${entry}-${i}`}
            data-part={PARTS.contextMenuItem}
            type="button"
            role="menuitem"
            onClick={() => {
              onSelect(entry);
              onClose();
            }}
          >
            {entry}
          </button>
        ),
      )}
    </div>
  );
}
