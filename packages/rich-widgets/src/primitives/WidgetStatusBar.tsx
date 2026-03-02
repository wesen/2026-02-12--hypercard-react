import type { ReactNode } from 'react';
import { RICH_PARTS } from '../parts';

export interface WidgetStatusBarProps {
  children: ReactNode;
  className?: string;
}

export function WidgetStatusBar({ children, className }: WidgetStatusBarProps) {
  return (
    <div data-part={RICH_PARTS.widgetStatusBar} className={className}>
      {children}
    </div>
  );
}
