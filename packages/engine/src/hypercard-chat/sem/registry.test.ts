import { describe, expect, it } from 'vitest';
import { createSemRegistry } from './registry';

describe('SemRegistry default handlers', () => {
  it('projects timeline.upsert into timeline entity upsert op', () => {
    const registry = createSemRegistry();
    const result = registry.handle(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'e1',
          data: {
            version: '100',
            entity: {
              id: 'm1',
              kind: 'message',
              createdAtMs: '1000',
              message: { role: 'assistant', content: 'hi', streaming: false },
            },
          },
        },
      },
      { convId: 'c1', now: () => 1234 },
    );

    expect(result.ops).toHaveLength(1);
    expect(result.ops[0].type).toBe('upsertEntity');
    if (result.ops[0].type === 'upsertEntity') {
      expect(result.ops[0].entity.id).toBe('m1');
      expect(result.ops[0].entity.version).toBe('100');
      expect(result.ops[0].entity.props.content).toBe('hi');
    }
  });

  it('projects llm delta and final into message upserts', () => {
    const registry = createSemRegistry();

    const delta = registry.handle(
      {
        sem: true,
        event: {
          type: 'llm.delta',
          id: 'msg-1',
          data: { cumulative: 'hello' },
        },
      },
      { convId: 'c1', now: () => 1234 },
    );

    const final = registry.handle(
      {
        sem: true,
        event: {
          type: 'llm.final',
          id: 'msg-1',
          data: { text: 'hello world' },
        },
      },
      { convId: 'c1', now: () => 1235 },
    );

    expect(delta.ops[0].type).toBe('upsertEntity');
    expect(final.ops[0].type).toBe('upsertEntity');
    if (delta.ops[0].type === 'upsertEntity') {
      expect(delta.ops[0].entity.props.content).toBe('hello');
    }
    if (final.ops[0].type === 'upsertEntity') {
      expect(final.ops[0].entity.props.streaming).toBe(false);
      expect(final.ops[0].entity.props.content).toBe('hello world');
    }
  });

  it('projects llm.thinking.summary as non-streaming update', () => {
    const registry = createSemRegistry();

    const summary = registry.handle(
      {
        sem: true,
        event: {
          type: 'llm.thinking.summary',
          id: 'think-1',
          data: { text: 'condensed reasoning summary' },
        },
      },
      { convId: 'c1', now: () => 1236 },
    );

    expect(summary.ops[0].type).toBe('upsertEntity');
    if (summary.ops[0].type === 'upsertEntity') {
      expect(summary.ops[0].entity.id).toBe('think-1');
      expect(summary.ops[0].entity.props.role).toBe('thinking');
      expect(summary.ops[0].entity.props.streaming).toBe(false);
      expect(summary.ops[0].entity.props.content).toBe('condensed reasoning summary');
    }
  });

  it('projects hypercard.widget.update as status and hypercard.widget.v1 as summarized result', () => {
    const registry = createSemRegistry({ enableTimelineUpsert: false });

    const status = registry.handle(
      {
        sem: true,
        event: {
          type: 'hypercard.widget.update',
          id: 'w-1',
          data: { title: 'Low stock table' },
        },
      },
      { convId: 'c1', now: () => 2000 },
    );

    expect(status.ops[0].type).toBe('upsertEntity');
    if (status.ops[0].type === 'upsertEntity') {
      expect(status.ops[0].entity.kind).toBe('status');
      expect(status.ops[0].entity.props.text).toBe('Updating widget: Low stock table');
    }

    const ready = registry.handle(
      {
        sem: true,
        event: {
          type: 'hypercard.widget.v1',
          id: 'w-1',
          data: {
            title: 'Low stock table',
            widgetType: 'table',
            data: { artifact: { id: 'low-stock-items', data: { rows: [] } } },
          },
        },
      },
      { convId: 'c1', now: () => 2001 },
    );

    expect(ready.ops[0].type).toBe('upsertEntity');
    if (ready.ops[0].type === 'upsertEntity') {
      expect(ready.ops[0].entity.kind).toBe('tool_result');
      expect(ready.ops[0].entity.props.customKind).toBe('hypercard.widget.v1');
      expect(ready.ops[0].entity.props.resultText).toBe(
        'Widget ready: Low stock table (table, artifact=low-stock-items)',
      );
    }
  });

  it('can ignore timeline.upsert registration when configured', () => {
    const registry = createSemRegistry({ enableTimelineUpsert: false });
    const result = registry.handle(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'ignored',
          data: {
            version: '1',
            entity: {
              id: 'm1',
              kind: 'message',
              createdAtMs: '1',
              message: { role: 'assistant', content: 'hello', streaming: false },
            },
          },
        },
      },
      { convId: 'c1', now: () => 1 },
    );

    expect(result.ops).toHaveLength(0);
  });
});
