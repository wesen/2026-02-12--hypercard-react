import { formatTimelineEntity, formatTimelineUpsert } from '@hypercard/engine';
import { describe, expect, it } from 'vitest';

describe('formatTimelineUpsert', () => {
  it('maps projected card status rows to running card timeline items', () => {
    const entity = {
      id: 'tool-1:status',
      kind: 'status',
      status: {
        text: 'Updating card proposal: Detailed Inventory Summary',
        type: 'info',
      },
    };
    const projected = formatTimelineUpsert({ entity });

    expect(projected).toMatchObject({
      id: 'card:tool-1',
      title: 'Detailed Inventory Summary',
      status: 'running',
      detail: 'updating',
      kind: 'card',
    });
    // rawData should be the full entity
    expect(projected?.rawData).toEqual(entity);
  });

  it('maps generic timeline status rows to timeline items with error status', () => {
    const entity = {
      id: 'svc-1:status',
      kind: 'status',
      status: {
        text: 'timeline unavailable',
        type: 'error',
      },
    };
    const projected = formatTimelineUpsert({ entity });

    expect(projected).toMatchObject({
      id: 'timeline:svc-1',
      title: 'timeline unavailable',
      status: 'error',
      detail: 'timeline status=error',
      kind: 'timeline',
    });
    expect(projected?.rawData).toEqual(entity);
  });

  it('maps hypercard_card upserts to ready card items', () => {
    const projected = formatTimelineUpsert({
      entity: {
        id: 'card-low-stock:card',
        kind: 'hypercard_card',
        props: {
          itemId: 'card-low-stock',
          title: 'Low Stock Items',
          name: 'reportViewer',
          phase: 'ready',
          data: {
            artifact: {
              id: 'low-stock-items',
            },
          },
        },
      },
    });

    expect(projected).toMatchObject({
      id: 'card:card-low-stock',
      title: 'Low Stock Items',
      status: 'success',
      detail: 'template=reportViewer · artifact=low-stock-items',
      kind: 'card',
      template: 'reportViewer',
      artifactId: 'low-stock-items',
    });
    expect(projected?.rawData).toEqual({
      artifact: {
        id: 'low-stock-items',
      },
    });
  });

  it('maps tool_call rows from start to done with proper status', () => {
    const running = formatTimelineUpsert({
      entity: {
        id: 'tool-3',
        kind: 'tool_call',
        toolCall: {
          name: 'inventory_report',
          done: false,
          status: 'running',
          input: {
            period: 'today',
          },
        },
      },
    });

    expect(running).toMatchObject({
      id: 'tool:tool-3',
      title: 'Tool inventory_report',
      status: 'running',
      kind: 'tool',
    });
    expect(running?.detail).toContain('args=');
    expect(running?.detail).toContain('period');
    expect(running?.rawData).toEqual({ name: 'inventory_report', input: { period: 'today' } });

    const failed = formatTimelineUpsert({
      entity: {
        id: 'tool-3',
        kind: 'tool_call',
        toolCall: {
          name: 'inventory_report',
          done: true,
          status: 'failed',
        },
      },
    });

    expect(failed).toMatchObject({
      id: 'tool:tool-3',
      title: 'Tool inventory_report',
      status: 'error',
      detail: 'error',
      kind: 'tool',
    });
    expect(failed?.rawData).toEqual({ name: 'inventory_report' });
  });

  it('maps projected timeline entities with dedicated hypercard kinds to widget/card items', () => {
    const widget = formatTimelineEntity({
      id: 'widget-low-stock:widget',
      kind: 'hypercard_widget',
      createdAt: 1,
      props: {
        itemId: 'widget-low-stock',
        title: 'Low stock table',
        widgetType: 'table',
        phase: 'ready',
        data: { artifact: { id: 'artifact-1' } },
      },
    });

    expect(widget).toMatchObject({
      id: 'widget:widget-low-stock',
      kind: 'widget',
      template: 'table',
      artifactId: 'artifact-1',
    });

    const card = formatTimelineEntity({
      id: 'card-restock:card',
      kind: 'hypercard_card',
      createdAt: 1,
      props: {
        itemId: 'card-restock',
        title: 'Restock proposal',
        name: 'reportViewer',
        phase: 'ready',
        data: { artifact: { id: 'artifact-2' } },
      },
    });

    expect(card).toMatchObject({
      id: 'card:card-restock',
      kind: 'card',
      template: 'reportViewer',
      artifactId: 'artifact-2',
    });
  });
});
