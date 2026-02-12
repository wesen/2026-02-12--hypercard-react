import type { CSSProperties } from 'react';
import type { FieldConfig } from '../../types';

export interface FieldRowProps {
  field: FieldConfig;
  value: unknown;
  onChange?: (value: unknown) => void;
  style?: CSSProperties;
}

export function FieldRow({ field, value, onChange, style }: FieldRowProps) {
  if (field.type === 'label') {
    return (
      <>
        <span data-part="field-label" />
        <span
          data-part="field-value"
          style={{ ...(field.style === 'muted' ? { fontStyle: 'italic' } : {}), ...style }}
        >
          {String(field.value ?? '')}
        </span>
      </>
    );
  }

  if (field.type === 'readonly') {
    return (
      <>
        <span data-part="field-label">{field.label}:</span>
        <span data-part="field-value" style={style}>{String(value ?? '')}</span>
      </>
    );
  }

  if (field.type === 'tags') {
    return (
      <>
        <span data-part="field-label">{field.label}:</span>
        <span data-part="field-value" style={style}>
          {Array.isArray(value) ? value.join(', ') : String(value ?? '')}
        </span>
      </>
    );
  }

  if (field.type === 'select') {
    return (
      <>
        <span data-part="field-label">{field.label}:</span>
        <select
          data-part="field-input"
          value={String(value ?? '')}
          onChange={(e) => onChange?.(e.target.value)}
          style={style}
        >
          {field.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </>
    );
  }

  // text or number
  return (
    <>
      <span data-part="field-label">{field.label}:</span>
      <input
        data-part="field-input"
        type={field.type === 'number' ? 'number' : 'text'}
        step={field.step}
        placeholder={field.placeholder}
        value={value == null ? '' : String(value)}
        onChange={(e) => {
          const v = field.type === 'number' ? Number(e.target.value) : e.target.value;
          onChange?.(v);
        }}
        style={style}
      />
    </>
  );
}
