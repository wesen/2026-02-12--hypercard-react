import { describe, expect, it } from 'vitest';
import { resolveInitialDocBrowserScreen } from './DocBrowserWindow';

describe('resolveInitialDocBrowserScreen', () => {
  it('prefers explicit screen when provided', () => {
    const screen = resolveInitialDocBrowserScreen({
      screen: 'search',
      initialModuleId: 'inventory',
      initialSlug: 'overview',
    });

    expect(screen).toBe('search');
  });

  it('uses reader when module and slug are provided', () => {
    const screen = resolveInitialDocBrowserScreen({
      initialModuleId: 'inventory',
      initialSlug: 'overview',
    });

    expect(screen).toBe('reader');
  });

  it('uses module-docs when only module is provided', () => {
    const screen = resolveInitialDocBrowserScreen({
      initialModuleId: 'inventory',
    });

    expect(screen).toBe('module-docs');
  });

  it('falls back to home when no params are provided', () => {
    const screen = resolveInitialDocBrowserScreen({});

    expect(screen).toBe('home');
  });
});
