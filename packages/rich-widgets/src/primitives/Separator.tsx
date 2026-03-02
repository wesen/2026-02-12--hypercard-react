import { RICH_PARTS } from '../parts';

export interface SeparatorProps {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function Separator({ orientation = 'vertical', className }: SeparatorProps) {
  return (
    <span
      data-part={RICH_PARTS.widgetSeparator}
      data-orientation={orientation}
      className={className}
    />
  );
}
