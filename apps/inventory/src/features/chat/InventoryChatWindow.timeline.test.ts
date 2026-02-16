import { describe, expect, it } from 'vitest';
import { formatTimelineUpsert } from './timelineProjection';

describe('formatTimelineUpsert', () => {
  it('maps projected card status rows to running card timeline items', () => {
    const projected = formatTimelineUpsert({
      entity: {
        id: 'tool-1:status',
        kind: 'status',
        status: {
          text: 'Updating card proposal: Detailed Inventory Summary',
          type: 'info',
        },
      },
    });

    expect(projected).toEqual({
      id: 'card:tool-1',
      title: 'Detailed Inventory Summary',
      status: 'running',
      detail: 'updating',
      kind: 'card',
    });
  });

  it('maps generic timeline status rows to timeline items with error status', () => {
    const projected = formatTimelineUpsert({
      entity: {
        id: 'svc-1:status',
        kind: 'status',
        status: {
          text: 'timeline unavailable',
          type: 'error',
        },
      },
    });

    expect(projected).toEqual({
      id: 'timeline:svc-1',
      title: 'timeline unavailable',
      status: 'error',
      detail: 'timeline status=error',
      kind: 'timeline',
    });
  });

  it('maps hypercard card tool_result rows to ready card items', () => {
    const projected = formatTimelineUpsert({
      entity: {
        id: 'tool-2:result',
        kind: 'tool_result',
        toolResult: {
          toolCallId: 'tool-2',
          customKind: 'hypercard.card_proposal.v1',
          result: {
            title: 'Low Stock Items',
            template: 'reportViewer',
            data: {
              artifact: {
                id: 'low-stock-items',
              },
            },
          },
        },
      },
    });

    expect(projected).toEqual({
      id: 'card:tool-2',
      title: 'Low Stock Items',
      status: 'success',
      detail: 'template=reportViewer · artifact=low-stock-items',
      kind: 'card',
      template: 'reportViewer',
      artifactId: 'low-stock-items',
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

    expect(failed).toEqual({
      id: 'tool:tool-3',
      title: 'Tool inventory_report',
      status: 'error',
      detail: 'error',
      kind: 'tool',
    });
  });
});
