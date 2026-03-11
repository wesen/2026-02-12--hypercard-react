import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearRuntimePackages,
  getRuntimePackageOrThrow,
  listRuntimePackages,
  resolveRuntimePackageInstallOrder,
} from './runtimePackageRegistry';
import { registerBuiltInRuntimePackages } from './defaultRuntimePackages';
import { resetBuiltInHypercardRuntimeRegistrationForTest } from '../runtimeDefaults';

describe('runtimePackageRegistry', () => {
  beforeEach(() => {
    clearRuntimePackages();
    resetBuiltInHypercardRuntimeRegistrationForTest();
  });

  it('can stay empty until packages are registered explicitly', () => {
    expect(listRuntimePackages()).toEqual([]);
    expect(() => getRuntimePackageOrThrow('ui')).toThrow(/unknown runtime package/i);
  });

  it('registers built-in ui and kanban packages explicitly', () => {
    registerBuiltInRuntimePackages();

    expect(listRuntimePackages()).toEqual(expect.arrayContaining(['ui', 'kanban']));
    expect(getRuntimePackageOrThrow('ui').surfaceTypes).toEqual(['ui.card.v1']);
    expect(getRuntimePackageOrThrow('kanban').surfaceTypes).toEqual(['kanban.v1']);
  });

  it('orders package installation by dependency', () => {
    registerBuiltInRuntimePackages();
    expect(resolveRuntimePackageInstallOrder(['kanban', 'ui'])).toEqual(['ui', 'kanban']);
  });

  it('throws for unknown runtime packages', () => {
    expect(() => resolveRuntimePackageInstallOrder(['missing-package'])).toThrow(/unknown runtime package/i);
  });
});
