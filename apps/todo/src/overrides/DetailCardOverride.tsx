import { useState, createElement } from 'react';
import type { CardDefinition, DetailCardDef, DSLAction, FieldConfig, ActionConfig } from '@hypercard/engine';
import { DetailView } from '@hypercard/engine';
import type { CardRendererContext } from '@hypercard/engine';
import type { Task } from '../domain/types';

export function renderDetailCard(cardDef: CardDefinition, ctx: CardRendererContext) {
  const def = cardDef as DetailCardDef;
  const tasks = (ctx.data[def.dataSource] ?? []) as Task[];
  const record = tasks.find((t) => String(t[def.keyField as keyof Task]) === ctx.paramValue);

  if (!record) return <div data-part="card" style={{ padding: 16 }}>Task not found</div>;

  return <DetailCardInner def={def} record={record} ctx={ctx} />;
}

function DetailCardInner({ def, record, ctx }: { def: DetailCardDef; record: Task; ctx: CardRendererContext }) {
  const [edits, setEdits] = useState<Record<string, unknown>>({});

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
    variant: b.style === 'primary' ? 'primary' as const : b.style === 'danger' ? 'danger' as const : 'default' as const,
    action: { ...b.action, id: record.id, edits },
  }));

  return createElement(DetailView, {
    record: record as any,
    fields,
    edits,
    onEdit: (id: string, value: unknown) => setEdits((p) => ({ ...p, [id]: value })),
    actions,
    onAction: (action: unknown) => ctx.dispatch(action as DSLAction),
    fieldHighlight: (fieldId: string, value: unknown) => {
      if (fieldId === 'priority' && value === 'high') return { background: '#ffcccc' };
      if (fieldId === 'status' && value === 'done') return { background: '#ccffcc' };
      return undefined;
    },
  } as any);
}
