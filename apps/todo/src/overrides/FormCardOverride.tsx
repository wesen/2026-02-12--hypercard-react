import { useState, createElement } from 'react';
import type { CardDefinition, FormCardDef, DSLAction, FieldConfig } from '@hypercard/engine';
import { FormView } from '@hypercard/engine';
import type { CardRendererContext } from '@hypercard/engine';

export function renderFormCard(cardDef: CardDefinition, ctx: CardRendererContext) {
  const def = cardDef as FormCardDef;
  return <FormCardInner def={def} ctx={ctx} />;
}

function FormCardInner({ def, ctx }: { def: FormCardDef; ctx: CardRendererContext }) {
  const initialValues: Record<string, unknown> = {};
  def.fields.forEach((f) => {
    if (f.default !== undefined) initialValues[f.id] = f.default;
  });

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
    ctx.dispatch({ ...def.submitAction, values: vals } as unknown as DSLAction);
    setResult('✅ Done!');
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
