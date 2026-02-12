import { useState, createElement } from 'react';
import type { CardDefinition, DetailCardDef, DSLAction, FieldConfig, ComputedFieldConfig, ActionConfig } from '@hypercard/engine';
import { DetailView } from '@hypercard/engine';
import type { CardRendererContext } from '@hypercard/engine';
import { inventoryComputedFields } from '../domain/computeFields';
import type { Item } from '../domain/types';

export function renderDetailCard(cardDef: CardDefinition, ctx: CardRendererContext) {
  const def = cardDef as DetailCardDef;
  const items = (ctx.data[def.dataSource] ?? []) as Item[];
  const record = items.find((i) => String(i[def.keyField as keyof Item]) === ctx.paramValue);

  if (!record) return <div data-part="card" style={{ padding: 16 }}>Item not found</div>;

  return <DetailCardInner def={def} record={record} ctx={ctx} />;
}

function DetailCardInner({ def, record, ctx }: { def: DetailCardDef; record: Item; ctx: CardRendererContext }) {
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const threshold = Number(ctx.settings.lowStockThreshold ?? 3);
  const current = { ...record, ...edits } as Item;

  const fields: FieldConfig[] = def.fields.map((f) => ({
    id: f.id,
    label: f.label ?? f.id,
    type: f.type as FieldConfig['type'],
    options: f.options,
    step: f.step,
    placeholder: f.placeholder,
    required: f.required,
  }));

  const actions: ActionConfig[] = (def.buttons ?? []).map((b) => ({
    label: b.label,
    variant: b.style === 'primary' ? 'primary' : b.style === 'danger' ? 'danger' : 'default',
    action: { ...b.action, sku: record.sku, edits },
  }));

  return createElement(DetailView, {
    record: record as any,
    fields,
    computed: inventoryComputedFields as any,
    edits,
    onEdit: (id: string, value: unknown) => setEdits((p) => ({ ...p, [id]: value })),
    actions,
    onAction: (action: unknown) => ctx.dispatch(action as DSLAction),
    fieldHighlight: (fieldId: string, value: unknown) => {
      if (fieldId === 'qty') {
        const qty = Number(value);
        if (qty === 0) return { background: '#ffcccc' };
        if (qty <= threshold) return { background: '#fff3cd' };
      }
      return undefined;
    },
  } as any);
}
