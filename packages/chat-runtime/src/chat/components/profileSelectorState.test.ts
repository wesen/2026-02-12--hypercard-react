import { describe, expect, it } from 'vitest';
import {
  resolveProfileSelectionChange,
  resolveProfileSelectorValue,
} from './profileSelectorState';

describe('profileSelectorState', () => {
  const profiles = [
    { slug: 'default', is_default: true },
    { slug: 'inventory', is_default: false },
    { slug: 'planner', is_default: false },
  ];

  it('supports switching inventory -> default -> inventory', () => {
    let selected = resolveProfileSelectorValue(profiles, 'inventory');
    expect(selected).toBe('inventory');

    selected = resolveProfileSelectionChange('default', 'default') ?? '';
    expect(selected).toBe('default');
    expect(resolveProfileSelectorValue(profiles, selected)).toBe('default');

    selected = resolveProfileSelectionChange('inventory', 'default') ?? '';
    expect(selected).toBe('inventory');
    expect(resolveProfileSelectorValue(profiles, selected)).toBe('inventory');
  });

  it('allows selecting a profile before first message send', () => {
    const initial = resolveProfileSelectorValue(profiles, null);
    expect(initial).toBe('default');

    const selectedBeforeSend = resolveProfileSelectionChange('planner', 'default');
    expect(selectedBeforeSend).toBe('planner');
    expect(resolveProfileSelectorValue(profiles, selectedBeforeSend)).toBe('planner');
  });

  it('falls back to default when current profile is stale', () => {
    expect(resolveProfileSelectorValue(profiles, 'unknown-old-profile')).toBe('default');
  });
});
