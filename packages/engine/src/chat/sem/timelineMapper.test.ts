import { describe, expect, it } from 'vitest';
import { timelineEntityFromProto } from './timelineMapper';

describe('timelineEntityFromProto', () => {
  it('keeps legacy tool_result entities unchanged during hard cutover', () => {
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
        id: 'tool-1:custom',
        kind: 'tool_result',
        version: 7,
        props: expect.objectContaining({
          customKind: 'hypercard.widget.v1',
        }),
      })
    );
  });

  it('remaps first-class hypercard.widget.v1 timeline kind into hypercard_widget entity', () => {
    const mapped = timelineEntityFromProto(
      {
        id: 'tool-widget-1:result',
        kind: 'hypercard.widget.v1',
        createdAtMs: 400,
        props: {
          toolCallId: 'tool-widget-1',
          result: {
            itemId: 'widget-first-class',
            title: 'Top Movers',
            widgetType: 'report',
            data: { artifact: { id: 'artifact-widget-fc' } },
          },
        },
      } as any,
      10
    );

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 'widget:widget-first-class',
        kind: 'hypercard_widget',
        props: expect.objectContaining({
          artifactId: 'artifact-widget-fc',
          template: 'report',
          title: 'Top Movers',
        }),
      })
    );
  });

  it('remaps first-class hypercard.card.v2 timeline kind and surfaces runtime card fields', () => {
    const mapped = timelineEntityFromProto(
      {
        id: 'tool-card-1:result',
        kind: 'hypercard.card.v2',
        createdAtMs: 500,
        props: {
          toolCallId: 'tool-card-1',
          result: {
            itemId: 'card-first-class',
            title: 'Low Stock Drilldown',
            data: {
              artifact: { id: 'artifact-card-fc' },
              card: {
                id: 'runtime-low-stock',
                code: '({ ui }) => ({ render() { return ui.text("hi"); } })',
              },
            },
          },
        },
      } as any,
      11
    );

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 'card:card-first-class',
        kind: 'hypercard_card',
        props: expect.objectContaining({
          artifactId: 'artifact-card-fc',
          runtimeCardId: 'runtime-low-stock',
          runtimeCardCode: '({ ui }) => ({ render() { return ui.text("hi"); } })',
        }),
      })
    );
  });
});
