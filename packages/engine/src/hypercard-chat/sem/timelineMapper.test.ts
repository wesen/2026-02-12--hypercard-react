import { afterEach, describe, expect, it } from 'vitest';
import { clearRegisteredTimelinePropsNormalizers, registerTimelinePropsNormalizer } from './timelinePropsRegistry';
import { mapTimelineEntityFromUpsert } from './timelineMapper';

describe('timelineMapper', () => {
  afterEach(() => {
    clearRegisteredTimelinePropsNormalizers();
  });

  it('maps unknown timeline kinds from entity.props', () => {
    const mapped = mapTimelineEntityFromUpsert(
      {
        entity: {
          id: 'w-1:widget',
          kind: 'hypercard_widget',
          createdAtMs: '1000',
          props: {
            itemId: 'w-1',
            phase: 'ready',
            title: 'Low stock',
          },
        },
      },
      5000,
    );

    expect(mapped?.id).toBe('w-1:widget');
    expect(mapped?.kind).toBe('hypercard_widget');
    expect(mapped?.props.itemId).toBe('w-1');
    expect(mapped?.props.phase).toBe('ready');
  });

  it('applies registered kind normalizers during timeline mapping', () => {
    registerTimelinePropsNormalizer('hypercard_widget', (props) => ({
      ...props,
      normalized: true,
    }));

    const mapped = mapTimelineEntityFromUpsert(
      {
        entity: {
          id: 'w-2:widget',
          kind: 'hypercard_widget',
          createdAtMs: '1001',
          props: {
            itemId: 'w-2',
            phase: 'update',
          },
        },
      },
      5000,
    );

    expect(mapped?.props.normalized).toBe(true);
  });
});
