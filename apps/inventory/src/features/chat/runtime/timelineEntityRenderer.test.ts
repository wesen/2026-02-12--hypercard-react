import { describe, expect, it } from 'vitest';
import { buildTimelineDisplayMessages, mapTimelineEntityToMessage } from './timelineEntityRenderer';

describe('mapTimelineEntityToMessage', () => {
  it('renders tool results with custom kind label', () => {
    const message = mapTimelineEntityToMessage({
      id: 'w-1:result',
      kind: 'tool_result',
      createdAt: 1,
      props: {
        customKind: 'hypercard.widget.v1',
        resultText: 'Widget ready: Low stock items (table, artifact=low-stock-items)',
      },
    });

    expect(message.text).toBe(
      'Result (hypercard.widget.v1): Widget ready: Low stock items (table, artifact=low-stock-items)',
    );
  });

  it('renders tool results with default prefix when no custom kind', () => {
    const message = mapTimelineEntityToMessage({
      id: 'c-1:result',
      kind: 'tool_result',
      createdAt: 1,
      props: {
        resultText: 'completed',
      },
    });

    expect(message.text).toBe('Result: completed');
  });
});

describe('buildTimelineDisplayMessages', () => {
  it('projects tool/widget/card entities into round-scoped inline widget messages', () => {
    const messages = buildTimelineDisplayMessages([
      {
        id: 'msg-user-1',
        kind: 'message',
        createdAt: 1,
        props: { role: 'user', content: 'show low stock', streaming: false },
      },
      {
        id: 'tool-1',
        kind: 'tool_call',
        createdAt: 2,
        updatedAt: 3,
        props: {
          name: 'inventory_low_stock',
          input: { qty: 3 },
          done: true,
          status: 'success',
        },
      },
      {
        id: 'widget-low-stock:widget',
        kind: 'hypercard_widget',
        createdAt: 4,
        updatedAt: 5,
        props: {
          schemaVersion: 1,
          itemId: 'widget-low-stock',
          title: 'Low stock items',
          widgetType: 'table',
          phase: 'ready',
          data: { artifact: { id: 'low-stock-items' } },
        },
      },
      {
        id: 'card-restock:card',
        kind: 'hypercard_card',
        createdAt: 6,
        updatedAt: 7,
        props: {
          schemaVersion: 1,
          itemId: 'card-restock',
          title: 'Restock plan',
          name: 'reportViewer',
          phase: 'ready',
          data: { artifact: { id: 'restock-plan' } },
        },
      },
    ]);

    expect(messages.map((message) => message.id)).toContain('timeline-widget-message-r1');
    expect(messages.map((message) => message.id)).toContain('widget-panel-widget-message-r1');
    expect(messages.map((message) => message.id)).toContain('card-panel-widget-message-r1');

    const runTimeline = messages.find((message) => message.id === 'timeline-widget-message-r1');
    const runItems = ((runTimeline?.content?.[0].kind === 'widget'
      ? runTimeline.content[0].widget.props.items
      : undefined) ?? []) as Array<{ id: string; title: string; detail?: string }>;
    expect(runItems).toHaveLength(1);
    expect(runItems[0]).toMatchObject({
      id: 'tool:tool-1',
      title: 'Tool inventory_low_stock',
    });
    expect(runItems[0]?.detail).toContain('args=');

    const widgetsPanel = messages.find((message) => message.id === 'widget-panel-widget-message-r1');
    const widgetItems = ((widgetsPanel?.content?.[0].kind === 'widget'
      ? widgetsPanel.content[0].widget.props.items
      : undefined) ?? []) as Array<{ id: string; artifactId?: string }>;
    expect(widgetItems[0]).toMatchObject({
      id: 'widget:widget-low-stock',
      artifactId: 'low-stock-items',
    });

    const cardsPanel = messages.find((message) => message.id === 'card-panel-widget-message-r1');
    const cardItems = ((cardsPanel?.content?.[0].kind === 'widget'
      ? cardsPanel.content[0].widget.props.items
      : undefined) ?? []) as Array<{ id: string; artifactId?: string }>;
    expect(cardItems[0]).toMatchObject({
      id: 'card:card-restock',
      artifactId: 'restock-plan',
    });
  });

  it('keeps pre-user events in Previous Session round', () => {
    const messages = buildTimelineDisplayMessages([
      {
        id: 'tool-legacy',
        kind: 'tool_call',
        createdAt: 1,
        props: { name: 'legacy_tool', done: true, status: 'success' },
      },
      {
        id: 'msg-user-1',
        kind: 'message',
        createdAt: 2,
        props: { role: 'user', content: 'new question', streaming: false },
      },
      {
        id: 'tool-live',
        kind: 'tool_call',
        createdAt: 3,
        props: { name: 'live_tool', done: true, status: 'success' },
      },
    ]);

    const previousSessionTimeline = messages.find((message) => message.id === 'timeline-widget-message-r0');
    const roundOneTimeline = messages.find((message) => message.id === 'timeline-widget-message-r1');

    expect(previousSessionTimeline).toBeTruthy();
    expect(roundOneTimeline).toBeTruthy();
    expect(
      previousSessionTimeline?.content?.[0].kind === 'widget' ? previousSessionTimeline.content[0].widget.label : '',
    ).toBe('Run Timeline (Previous Session)');
    expect(roundOneTimeline?.content?.[0].kind === 'widget' ? roundOneTimeline.content[0].widget.label : '').toBe(
      'Run Timeline (round 1)',
    );
  });
});
