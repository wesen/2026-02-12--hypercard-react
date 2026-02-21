import { describe, expect, it } from 'vitest';
import { timelineEntityFromProto } from './timelineMapper';

describe('timelineEntityFromProto', () => {
  it('remaps hypercard widget customKind into hypercard_widget entity', () => {
    const mapped = timelineEntityFromProto(
      {
        id: 'tool-1:custom',
        kind: 'tool_result',
        createdAtMs: 100,
        props: {
          customKind: 'hypercard.widget.v1',
          result: {
            itemId: 'widget-123',
            title: 'Low Stock Widget',
            data: { artifact: { id: 'artifact-1' } },
          },
        },
      } as any,
      7
    );

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 'widget:widget-123',
        kind: 'hypercard_widget',
        version: 7,
        props: expect.objectContaining({
          itemId: 'widget-123',
          artifactId: 'artifact-1',
          title: 'Low Stock Widget',
          status: 'success',
        }),
      })
    );
  });

  it('remaps hypercard card customKind into hypercard_card entity', () => {
    const mapped = timelineEntityFromProto(
      {
        id: 'tool-2:custom',
        kind: 'tool_result',
        createdAtMs: 200,
        props: {
          customKind: 'hypercard.card.v2',
          result: {
            itemId: 'card-123',
            title: 'Margin Card',
            data: { artifact: { id: 'artifact-2' } },
          },
        },
      } as any,
      8
    );

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 'card:card-123',
        kind: 'hypercard_card',
        version: 8,
        props: expect.objectContaining({
          itemId: 'card-123',
          artifactId: 'artifact-2',
          title: 'Margin Card',
          status: 'success',
        }),
      })
    );
  });

  it('normalizes quoted artifact ids during remap', () => {
    const mapped = timelineEntityFromProto(
      {
        id: 'tool-3:custom',
        kind: 'tool_result',
        createdAtMs: 300,
        props: {
          customKind: 'hypercard.widget.v1',
          result: {
            itemId: 'widget-quoted',
            title: "Today's Sales Summary",
            data: { artifact: { id: '"sales-summary-2026-02-20"' } },
          },
        },
      } as any,
      9
    );

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 'widget:widget-quoted',
        kind: 'hypercard_widget',
        props: expect.objectContaining({
          artifactId: 'sales-summary-2026-02-20',
        }),
      })
    );
  });
});
