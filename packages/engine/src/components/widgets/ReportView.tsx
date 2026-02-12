import type { ReportSection, ActionConfig } from '../../types';
import { Btn } from './Btn';

export interface ReportViewProps {
  sections: ReportSection[];
  actions?: ActionConfig[];
  onAction?: (action: unknown) => void;
}

export function ReportView({ sections, actions, onAction }: ReportViewProps) {
  return (
    <div data-part="report-view">
      <div style={{ border: '2px solid var(--hc-color-border, #000)' }}>
        {sections.map((sec, i) => (
          <div key={sec.label} data-part="report-row" style={{ background: i % 2 ? undefined : 'transparent' }}>
            <span>{sec.label}</span>
            <span style={{ fontWeight: 'bold' }}>{sec.value}</span>
          </div>
        ))}
      </div>
      {actions && (
        <div data-part="button-group" style={{ marginTop: 10 }}>
          {actions.map((a) => (
            <Btn key={a.label} variant={a.variant} onClick={() => onAction?.(a.action)}>
              {a.label}
            </Btn>
          ))}
        </div>
      )}
    </div>
  );
}
