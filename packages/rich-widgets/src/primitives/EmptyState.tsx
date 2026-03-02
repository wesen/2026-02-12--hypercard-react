import type { ReactNode } from 'react';
import { RICH_PARTS } from '../parts';

export interface EmptyStateProps {
  icon?: string;
  message: ReactNode;
  className?: string;
}

export function EmptyState({ icon, message, className }: EmptyStateProps) {
  return (
    <div data-part={RICH_PARTS.widgetEmptyState} className={className}>
      {icon && <div data-part={RICH_PARTS.widgetEmptyIcon}>{icon}</div>}
      <div>{message}</div>
    </div>
  );
}
