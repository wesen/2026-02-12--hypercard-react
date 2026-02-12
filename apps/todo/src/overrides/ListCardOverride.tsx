import { createElement } from 'react';
import type { CardDefinition, ListCardDef, DSLAction, FilterConfig, ActionConfig } from '@hypercard/engine';
import { ListView, matchFilter, resolveValue } from '@hypercard/engine';
import type { CardRendererContext } from '@hypercard/engine';
import { taskColumns } from '../domain/columnConfigs';

export function renderListCard(cardDef: CardDefinition, ctx: CardRendererContext) {
  const def = cardDef as ListCardDef;
  const raw = (ctx.data[def.dataSource] ?? []) as Record<string, unknown>[];

  const preFilter = def.dataFilter
    ? (items: Record<string, unknown>[]) =>
        items.filter((i) =>
          matchFilter(i, {
            ...def.dataFilter!,
            value: resolveValue(def.dataFilter!.value, { settings: ctx.settings }),
          }, { settings: ctx.settings }),
        )
    : undefined;

  const columns = taskColumns();

  const filters: FilterConfig[] | undefined = def.filters?.map((f) => ({
    field: f.field,
    type: f.type as 'select' | 'text',
    options: f.options,
    placeholder: f.placeholder,
  }));

  const toolbar: ActionConfig[] | undefined = def.toolbar?.map((b) => ({
    label: b.label,
    action: b.action as unknown,
    variant: b.style === 'primary' ? 'primary' as const : b.style === 'danger' ? 'danger' as const : 'default' as const,
  }));

  return createElement(ListView, {
    items: raw,
    columns: columns as any,
    filters,
    searchFields: ['title'],
    toolbar,
    emptyMessage: def.emptyMessage,
    preFilter: preFilter as any,
    rowKey: 'id',
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
