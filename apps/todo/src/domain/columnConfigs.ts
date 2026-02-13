import type { ColumnConfig } from '@hypercard/engine';
import type { Task } from './types';

export function taskColumns(): ColumnConfig<Task>[] {
  return [
    { key: 'id', label: 'ID', width: 35 },
    { key: 'title', label: 'TITLE', width: '1fr' },
    {
      key: 'status',
      label: 'STATUS',
      width: 55,
      cellState: (v) => (v === 'done' ? 'success' : v === 'doing' ? 'warning' : undefined),
      format: (v) => {
        if (v === 'done') return '✅';
        if (v === 'doing') return '🔥';
        return '◻️';
      },
    },
    {
      key: 'priority',
      label: 'PRI',
      width: 50,
      cellState: (v) => (v === 'high' ? 'error' : undefined),
      format: (v) => {
        if (v === 'high') return '🔴';
        if (v === 'medium') return '🟡';
        return '🟢';
      },
    },
    { key: 'due', label: 'DUE', width: 80, format: (v) => String(v ?? '—') },
  ];
}
