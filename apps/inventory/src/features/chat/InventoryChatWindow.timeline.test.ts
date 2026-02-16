import { describe, expect, it } from 'vitest';
import { formatTimelineUpsert } from './timelineProjection';

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

  it('maps hypercard card tool_result rows to ready card items', () => {
    const resultRecord = {
      title: 'Low Stock Items',
      template: 'reportViewer',
      data: {
        artifact: {
          id: 'low-stock-items',
        },
      },
    };
    const projected = formatTimelineUpsert({
      entity: {
        id: 'tool-2:result',
        kind: 'tool_result',
        toolResult: {
          toolCallId: 'tool-2',
          customKind: 'hypercard.card.v2',
          result: resultRecord,
        },
      },
    });

    expect(projected).toMatchObject({
      id: 'card:tool-2',
      title: 'Low Stock Items',
      status: 'success',
      detail: 'template=reportViewer · artifact=low-stock-items',
      kind: 'card',
      template: 'reportViewer',
      artifactId: 'low-stock-items',
    });
    // rawData should be the parsed result record
    expect(projected?.rawData).toEqual(resultRecord);
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
});
