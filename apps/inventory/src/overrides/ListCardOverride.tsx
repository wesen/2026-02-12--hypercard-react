import { createElement } from 'react';
import type { CardDefinition, ListCardDef, DSLAction, FilterConfig, ActionConfig, FooterConfig } from '@hypercard/engine';
import { ListView, matchFilter, resolveValue } from '@hypercard/engine';
import type { CardRendererContext } from '@hypercard/engine';
import { itemColumns, salesColumns } from '../domain/columnConfigs';
import { formatCurrency } from '../domain/formatters';
import { STACK } from '../domain/stack';

export function renderListCard(cardDef: CardDefinition, ctx: CardRendererContext) {
  const def = cardDef as ListCardDef;
  const raw = (ctx.data[def.dataSource] ?? []) as Record<string, unknown>[];
  const threshold = Number(ctx.settings.lowStockThreshold ?? 3);

  // Static data filter
  const preFilter = def.dataFilter
    ? (items: Record<string, unknown>[]) =>
        items.filter((i) =>
          matchFilter(i, {
            ...def.dataFilter!,
            value: resolveValue(def.dataFilter!.value, { settings: ctx.settings }),
          }, { settings: ctx.settings }),
        )
    : undefined;

  const columns = def.dataSource === 'items' ? itemColumns(threshold) : salesColumns();

  const filters: FilterConfig[] | undefined = def.filters?.map((f) => ({
    field: f.field,
    type: f.type as 'select' | 'text',
    options: f.options,
    placeholder: f.placeholder,
  }));

  const toolbar: ActionConfig[] | undefined = def.toolbar?.map((b) => ({
    label: b.label,
    action: b.action as unknown,
    variant: b.style === 'primary' ? 'primary' : b.style === 'danger' ? 'danger' : 'default',
  }));

  const footer: FooterConfig | undefined = def.footer
    ? { ...def.footer, label: def.footer.label, format: formatCurrency }
    : undefined;

  return createElement(ListView, {
    items: raw,
    columns: columns as any,
    filters,
    searchFields: def.dataSource === 'items' ? ['name', 'sku'] : undefined,
    toolbar,
    footer,
    emptyMessage: def.emptyMessage,
    preFilter: preFilter as any,
    rowKey: def.dataSource === 'items' ? 'sku' : 'id',
    onRowClick: def.rowAction
      ? (row: Record<string, unknown>) => {
          const ra = def.rowAction! as Record<string, unknown>;
          const action = { ...ra, paramValue: String(row[String(ra.param ?? 'id')] ?? '') } as DSLAction;
          ctx.dispatch(action);
        }
      : undefined,
    onAction: (action: unknown) => ctx.dispatch(action as DSLAction),
  } as any);
}
