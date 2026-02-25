import { describe, expect, it } from 'vitest';
import { resolveSelectionAfterProfileRefresh } from './useProfiles';

describe('resolveSelectionAfterProfileRefresh', () => {
  it('prefers persisted server profile when redux selection is empty', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', is_default: true },
        { slug: 'analyst' },
      ],
      {},
      'default',
      'analyst'
    );

    expect(next).toEqual({ profile: 'analyst', registry: 'default' });
  });

  it('selects default profile when no profile is currently selected', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', is_default: true },
        { slug: 'analyst' },
      ],
      {},
      'default',
      undefined
    );

    expect(next).toEqual({ profile: 'inventory', registry: 'default' });
  });

  it('keeps current selection when it still exists after refresh', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', is_default: true },
        { slug: 'analyst' },
      ],
      { profile: 'analyst', registry: 'default' },
      'default',
      undefined
    );

    expect(next).toBeNull();
  });

  it('falls back to new default when selected profile was removed by CRUD', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [
        { slug: 'inventory', is_default: false },
        { slug: 'planner', is_default: true },
      ],
      { profile: 'analyst', registry: 'default' },
      'default',
      undefined
    );

    expect(next).toEqual({ profile: 'planner', registry: 'default' });
  });

  it('clears selected profile when registry is empty', () => {
    const next = resolveSelectionAfterProfileRefresh(
      [],
      { profile: 'analyst', registry: 'default' },
      'default',
      undefined
    );
    expect(next).toEqual({ profile: null, registry: 'default' });
  });
});
