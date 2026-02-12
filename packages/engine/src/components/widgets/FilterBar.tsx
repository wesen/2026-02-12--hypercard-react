import type { FilterConfig } from '../../types';

export interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function FilterBar({ filters, values, onChange }: FilterBarProps) {
  return (
    <div data-part="filter-bar">
      {filters.map((f) =>
        f.type === 'select' ? (
          <select
            key={f.field}
            data-part="field-input"
            value={values[f.field] ?? 'All'}
            onChange={(e) => onChange(f.field, e.target.value)}
          >
            {f.options?.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input
            key={f.field}
            data-part="field-input"
            placeholder={f.placeholder}
            value={values[f.field] ?? ''}
            onChange={(e) => onChange(f.field, e.target.value)}
          />
        ),
      )}
    </div>
  );
}
