import type { CardDefinition, ReportCardDef, DSLAction, ReportSection, ActionConfig } from '@hypercard/engine';
import { ReportView, Btn } from '@hypercard/engine';
import type { CardRendererContext } from '@hypercard/engine';
import { computeReportSections } from '../domain/reportCompute';
import type { Item, SaleEntry } from '../domain/types';

export function renderReportCard(cardDef: CardDefinition, ctx: CardRendererContext) {
  const def = cardDef as ReportCardDef;
  const items = (ctx.data.items ?? []) as Item[];
  const sales = (ctx.data.salesLog ?? []) as SaleEntry[];
  const threshold = Number(ctx.settings.lowStockThreshold ?? 3);

  const values = computeReportSections(items, sales, threshold);

  const sections: ReportSection[] = def.sections.map((s) => ({
    label: s.label,
    value: values[s.compute] ?? '—',
  }));

  const actions: ActionConfig[] = [
    { label: '🖨 Print', action: { type: 'toast', message: 'Report sent to printer (mock)' } as unknown, variant: 'default' },
    { label: '📧 Email', action: { type: 'toast', message: 'Report emailed (mock)' } as unknown, variant: 'default' },
  ];

  return (
    <div data-part="card" style={{ padding: 16 }}>
      <div data-part="card-title">{def.icon} {def.title}</div>
      <ReportView
        sections={sections}
        actions={actions}
        onAction={(a) => ctx.dispatch(a as DSLAction)}
      />
    </div>
  );
}
