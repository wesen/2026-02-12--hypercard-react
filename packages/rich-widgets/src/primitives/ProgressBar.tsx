import { RICH_PARTS } from '../parts';

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function ProgressBar({ value, max = 1, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div data-part={RICH_PARTS.widgetProgressBar} className={className}>
      <div
        data-part={RICH_PARTS.widgetProgressFill}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
