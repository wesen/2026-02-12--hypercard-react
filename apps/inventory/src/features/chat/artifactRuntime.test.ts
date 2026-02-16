import { describe, expect, it } from 'vitest';
import {
  buildArtifactOpenWindowPayload,
  extractArtifactUpsertFromSem,
  templateToCardId,
} from './artifactRuntime';

describe('artifactRuntime', () => {
  it('maps templates to card ids', () => {
    expect(templateToCardId('itemViewer')).toBe('itemViewer');
    expect(templateToCardId('ITEMVIEWER')).toBe('itemViewer');
    expect(templateToCardId('reportViewer')).toBe('reportViewer');
    expect(templateToCardId(undefined)).toBe('reportViewer');
  });

  it('builds deduped open-window payload with artifact param', () => {
    const payload = buildArtifactOpenWindowPayload({
      artifactId: 'detailed_inventory_summary',
      template: 'reportViewer',
      title: 'Detailed Inventory Summary',
    });

    expect(payload).toBeTruthy();
    expect(payload?.dedupeKey).toBe('artifact:detailed_inventory_summary');
    expect(payload?.content.kind).toBe('card');
    expect(payload?.content.card?.cardId).toBe('reportViewer');
    expect(payload?.content.card?.param).toBe('detailed_inventory_summary');
    expect(payload?.content.card?.cardSessionId).toBe('artifact-session:detailed_inventory_summary');
  });

  it('extracts artifact upsert from direct hypercard ready events', () => {
    const widget = extractArtifactUpsertFromSem('hypercard.widget.v1', {
      title: 'Inventory Summary Report',
      widgetType: 'report',
      data: {
        artifact: {
          id: 'inventory-summary',
          data: { totalUnits: 59 },
        },
      },
    });
    expect(widget).toEqual({
      id: 'inventory-summary',
      title: 'Inventory Summary Report',
      template: 'report',
      data: { totalUnits: 59 },
      source: 'widget',
    });

    const card = extractArtifactUpsertFromSem('hypercard.card_proposal.v1', {
      title: 'Detailed Inventory Summary',
      template: 'reportViewer',
      data: {
        artifact: {
          id: 'detailed_inventory_summary',
          data: { totalSkus: 10 },
        },
      },
    });
    expect(card).toEqual({
      id: 'detailed_inventory_summary',
      title: 'Detailed Inventory Summary',
      template: 'reportViewer',
      data: { totalSkus: 10 },
      source: 'card',
    });
  });

  it('extracts artifact upsert from projected timeline tool_result', () => {
    const projected = extractArtifactUpsertFromSem('timeline.upsert', {
      entity: {
        kind: 'tool_result',
        toolResult: {
          customKind: 'hypercard.card_proposal.v1',
          result: {
            title: 'Detailed Inventory Summary',
            template: 'reportViewer',
            data: {
              artifact: {
                id: 'detailed_inventory_summary',
                data: { totalSkus: 10 },
              },
            },
          },
        },
      },
    });

    expect(projected).toEqual({
      id: 'detailed_inventory_summary',
      title: 'Detailed Inventory Summary',
      template: 'reportViewer',
      data: { totalSkus: 10 },
      source: 'card',
    });
  });
});
