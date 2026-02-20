import { describe, expect, it } from 'vitest';
import {
  addEntity,
  clearConversation,
  rekeyEntity,
  timelineReducer,
  upsertEntity,
} from './timelineSlice';
import { compareVersions } from './version';

function reduce(actions: Parameters<typeof timelineReducer>[1][]) {
  let state = timelineReducer(undefined, { type: '__test__/init' });
  for (const action of actions) {
    state = timelineReducer(state, action);
  }
  return state;
}

describe('timelineSlice', () => {
  it('keeps conversations isolated', () => {
    const state = reduce([
      addEntity({
        convId: 'a',
        entity: { id: 'm1', kind: 'message', createdAt: 1, props: { text: 'a' } },
      }),
      addEntity({
        convId: 'b',
        entity: { id: 'm1', kind: 'message', createdAt: 1, props: { text: 'b' } },
      }),
    ]);

    expect(state.conversations.a.byId.m1.props.text).toBe('a');
    expect(state.conversations.b.byId.m1.props.text).toBe('b');
  });

  it('ignores stale versioned upserts', () => {
    const state = reduce([
      upsertEntity({
        convId: 'a',
        entity: {
          id: 'x',
          kind: 'status',
          createdAt: 1,
          version: '100',
          props: { text: 'new' },
        },
      }),
      upsertEntity({
        convId: 'a',
        entity: {
          id: 'x',
          kind: 'status',
          createdAt: 1,
          version: '99',
          props: { text: 'old' },
        },
      }),
    ]);

    expect(state.conversations.a.byId.x.props.text).toBe('new');
  });

  it('merges versionless patches into versioned entities without dropping version', () => {
    const state = reduce([
      upsertEntity({
        convId: 'a',
        entity: {
          id: 'x',
          kind: 'status',
          createdAt: 1,
          updatedAt: 1,
          version: '100',
          props: { text: 'baseline', done: false },
        },
      }),
      upsertEntity({
        convId: 'a',
        entity: {
          id: 'x',
          kind: 'status',
          createdAt: 1,
          updatedAt: 2,
          props: { done: true, extra: 'patched' },
        },
      }),
    ]);

    expect(state.conversations.a.byId.x.version).toBe('100');
    expect(state.conversations.a.byId.x.updatedAt).toBe(2);
    expect(state.conversations.a.byId.x.props).toEqual({
      text: 'baseline',
      done: true,
      extra: 'patched',
    });
  });

  it('rekeys entity ids', () => {
    const state = reduce([
      addEntity({
        convId: 'a',
        entity: { id: 'tmp', kind: 'message', createdAt: 1, props: {} },
      }),
      rekeyEntity({ convId: 'a', fromId: 'tmp', toId: 'm1' }),
    ]);

    expect(state.conversations.a.byId.tmp).toBeUndefined();
    expect(state.conversations.a.byId.m1).toBeTruthy();
    expect(state.conversations.a.order).toEqual(['m1']);
  });

  it('clears one conversation only', () => {
    const state = reduce([
      addEntity({
        convId: 'a',
        entity: { id: 'x', kind: 'message', createdAt: 1, props: {} },
      }),
      addEntity({
        convId: 'b',
        entity: { id: 'y', kind: 'message', createdAt: 1, props: {} },
      }),
      clearConversation({ convId: 'a' }),
    ]);

    expect(state.conversations.a).toBeUndefined();
    expect(state.conversations.b.byId.y).toBeTruthy();
  });
});

describe('version compare', () => {
  it('handles big integer versions as strings', () => {
    expect(compareVersions('9223372036854775808', '9223372036854775807')).toBe(1);
  });
});
