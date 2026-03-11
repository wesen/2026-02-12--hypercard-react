import { describe, expect, it } from 'vitest';
import {
  getRuntimePackageOrThrow,
  listRuntimePackages,
  resolveRuntimePackageInstallOrder,
} from './runtimePackageRegistry';

describe('runtimePackageRegistry', () => {
  it('registers built-in ui and kanban packages', () => {
    expect(listRuntimePackages()).toEqual(expect.arrayContaining(['ui', 'kanban']));
    expect(getRuntimePackageOrThrow('ui').surfaceTypes).toEqual(['ui.card.v1']);
    expect(getRuntimePackageOrThrow('kanban').surfaceTypes).toEqual(['kanban.v1']);
  });

  it('orders package installation by dependency', () => {
    expect(resolveRuntimePackageInstallOrder(['kanban', 'ui'])).toEqual(['ui', 'kanban']);
  });

  it('throws for unknown runtime packages', () => {
    expect(() => resolveRuntimePackageInstallOrder(['missing-package'])).toThrow(/unknown runtime package/i);
  });
});
