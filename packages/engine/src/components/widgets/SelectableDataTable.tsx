import { useMemo, useState } from 'react';
import { PARTS } from '../../parts';
import type { ColumnConfig, RowKeyFn } from '../../types';

export type SelectableTableMode = 'single' | 'multiple';

export interface SelectableDataTableProps<T = Record<string, unknown>> {
  items: T[];
  columns: ColumnConfig<T>[];
  rowKey?: string | RowKeyFn<T>;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
  mode?: SelectableTableMode;
  searchable?: boolean;
  searchText?: string;
  onSearchTextChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchFields?: string[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function resolveRowKey<T extends Record<string, unknown>>(
  row: T,
  index: number,
  rowKey?: string | RowKeyFn<T>,
): string {
  if (typeof rowKey === 'function') {
    return rowKey(row, index);
  }
  if (typeof rowKey === 'string') {
    return String(row[rowKey]);
  }
  return String((row as Record<string, unknown>).id ?? index);
}

export function filterRows<T extends Record<string, unknown>>(items: T[], fields: string[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items;
  }
  return items.filter((item) =>
    fields.some((field) => String(item[field as keyof T] ?? '').toLowerCase().includes(normalized)),
  );
}

export function nextTableSelection(current: string[], rowId: string, mode: SelectableTableMode): string[] {
  if (mode === 'single') {
    return [rowId];
  }
  return current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId];
}

export function SelectableDataTable<T extends Record<string, unknown>>({
  items,
  columns,
  rowKey,
  selectedRowKeys,
  onSelectionChange,
  mode = 'single',
  searchable,
  searchText,
  onSearchTextChange,
  searchPlaceholder,
  searchFields,
  emptyMessage,
  onRowClick,
}: SelectableDataTableProps<T>) {
  const [internalSearchText, setInternalSearchText] = useState('');
  const resolvedSearch = searchText ?? internalSearchText;

  const resolvedSearchFields = useMemo(
    () => (searchFields && searchFields.length > 0 ? searchFields : columns.map((column) => column.key)),
    [columns, searchFields],
  );

  const filteredItems = useMemo(
    () => filterRows(items, resolvedSearchFields, resolvedSearch),
    [items, resolvedSearchFields, resolvedSearch],
  );

  const templateColumns = columns
    .map((column) => (typeof column.width === 'number' ? `${column.width}px` : (column.width ?? '1fr')))
    .join(' ');

  const handleSearchChange = (value: string) => {
    onSearchTextChange?.(value);
    if (onSearchTextChange === undefined) {
      setInternalSearchText(value);
    }
  };

  const handleRowClick = (row: T, index: number) => {
    const id = resolveRowKey(row, index, rowKey);
    const next = nextTableSelection(selectedRowKeys, id, mode);
    onSelectionChange(next);
    onRowClick?.(row);
  };

  return (
    <div data-part={PARTS.confirmWidgetBody}>
      {searchable && (
        <input
          data-part={PARTS.fieldInput}
          type="text"
          value={resolvedSearch}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder={searchPlaceholder ?? 'Search rows...'}
        />
      )}

      <div data-part={PARTS.dataTable}>
        <div data-part={PARTS.tableHeader} style={{ display: 'grid', gridTemplateColumns: templateColumns }}>
          {columns.map((column) => (
            <span key={column.key} style={{ textAlign: column.align }}>
              {column.label ?? column.key}
            </span>
          ))}
        </div>

        {filteredItems.length === 0 && <div data-part={PARTS.tableEmpty}>{emptyMessage ?? 'No items'}</div>}
        {filteredItems.map((row, index) => {
          const id = resolveRowKey(row, index, rowKey);
          const selected = selectedRowKeys.includes(id);

          return (
            <button
              key={id}
              type="button"
              data-part={PARTS.tableRow}
              data-state={selected ? 'selected' : undefined}
              onClick={() => handleRowClick(row, index)}
              style={{
                display: 'grid',
                gridTemplateColumns: templateColumns,
                textAlign: 'left',
                width: '100%',
              }}
            >
              {columns.map((column) => {
                const raw = row[column.key as keyof T] as unknown;
                const state = column.cellState?.(raw, row);
                const style = column.cellStyle?.(raw, row);
                const rendered = column.renderCell
                  ? column.renderCell(raw, row)
                  : column.format
                    ? column.format(raw, row)
                    : String(raw ?? '');

                return (
                  <span
                    key={column.key}
                    data-part={PARTS.tableCell}
                    data-state={state}
                    style={{
                      textAlign: column.align,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      ...style,
                    }}
                  >
                    {rendered}
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
