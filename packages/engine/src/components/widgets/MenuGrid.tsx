import type { ActionConfig } from '../../types';
import { Btn } from './Btn';

export interface MenuGridProps {
  icon?: string;
  labels?: Array<{ value: string; style?: string }>;
  buttons: ActionConfig[];
  onAction: (action: unknown) => void;
}

export function MenuGrid({ icon, labels, buttons, onAction }: MenuGridProps) {
  return (
    <div data-part="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'center' }}>
      {icon && <div style={{ fontSize: 32 }}>{icon}</div>}
      {labels?.map((l, i) => (
        <div key={i} data-part={l.style === 'muted' ? 'field-value' : 'card-title'}>
          {l.value}
        </div>
      ))}
      <div data-part="menu-grid">
        {buttons.map((b) => (
          <Btn key={b.label} variant={b.variant} onClick={() => onAction(b.action)} style={{ width: '100%', textAlign: 'left' }}>
            {b.label}
          </Btn>
        ))}
      </div>
    </div>
  );
}
