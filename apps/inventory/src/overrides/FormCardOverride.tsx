import { useState, createElement } from 'react';
import type { CardDefinition, FormCardDef, DSLAction, FieldConfig } from '@hypercard/engine';
import { FormView, showToast } from '@hypercard/engine';
import type { CardRendererContext } from '@hypercard/engine';
import type { Item } from '../domain/types';

export function renderFormCard(cardDef: CardDefinition, ctx: CardRendererContext) {
  const def = cardDef as FormCardDef;

  return <FormCardInner def={def} ctx={ctx} />;
}

function FormCardInner({ def, ctx }: { def: FormCardDef; ctx: CardRendererContext }) {
  const initialValues: Record<string, unknown> = {};
  def.fields.forEach((f) => { if (f.default !== undefined) initialValues[f.id] = f.default; });

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [result, setResult] = useState<string | null>(null);

  const fields: FieldConfig[] = def.fields.map((f) => ({
    id: f.id,
    label: f.label ?? f.id,
    type: f.type as FieldConfig['type'],
    options: f.options,
    step: f.step,
    placeholder: f.placeholder,
    required: f.required,
  }));

  function handleSubmit(vals: Record<string, unknown>) {
    // Price checker special case
    if (def.submitAction.type === 'priceCheck') {
      const items = (ctx.data.items ?? []) as Item[];
      const found = items.find((i) => i.sku.toLowerCase() === String(vals.sku ?? '').toLowerCase());
      if (found) {
        setResult(`✅ ${found.name} — $${found.price.toFixed(2)} (${found.qty} in stock)`);
      } else {
        setResult(`❌ SKU "${vals.sku}" not found`);
      }
      return;
    }

    // Generic: dispatch submit action with values
    ctx.dispatch({ ...def.submitAction, values: vals } as unknown as DSLAction);
    setResult(`✅ Done!`);
    const reset: Record<string, unknown> = {};
    def.fields.forEach((f) => { reset[f.id] = f.default ?? ''; });
    setValues(reset);
  }

  return createElement(FormView, {
    fields,
    values,
    onChange: (id: string, v: unknown) => setValues((p) => ({ ...p, [id]: v })),
    onSubmit: handleSubmit,
    submitResult: result,
    submitLabel: def.submitLabel,
  } as any);
}
