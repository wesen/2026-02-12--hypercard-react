import type { ReactNode, MouseEvent } from 'react';
import { useCallback } from 'react';
import { RICH_PARTS } from '../parts';

export interface ModalOverlayProps {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}

export function ModalOverlay({ children, onClose, className }: ModalOverlayProps) {
  const stopProp = useCallback((e: MouseEvent) => e.stopPropagation(), []);

  return (
    <div
      data-part={RICH_PARTS.modalOverlay}
      className={className}
      onClick={onClose}
    >
      <div data-part={RICH_PARTS.modalContent} onClick={stopProp}>
        {children}
      </div>
    </div>
  );
}
