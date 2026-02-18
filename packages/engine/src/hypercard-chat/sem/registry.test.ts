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
});
