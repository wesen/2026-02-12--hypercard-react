import type { ReactNode } from 'react';
import { RICH_PARTS } from '../parts';

export interface WidgetToolbarProps {
  children: ReactNode;
  className?: string;
}

export function WidgetToolbar({ children, className }: WidgetToolbarProps) {
  return (
    <div data-part={RICH_PARTS.widgetToolbar} className={className}>
      {children}
    </div>
  );
}
