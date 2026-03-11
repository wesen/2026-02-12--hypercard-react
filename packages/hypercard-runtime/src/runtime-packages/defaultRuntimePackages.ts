import uiPackagePrelude from './ui.package.vm.js?raw';
import kanbanPackagePrelude from './kanban.package.vm.js?raw';
import type { RuntimePackageDefinition } from './runtimePackageRegistry';
import { registerRuntimePackage } from './runtimePackageRegistry';

export const UI_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'ui',
  version: '1.0.0',
  summary: 'Base UI DSL package providing ui.* node constructors.',
  installPrelude: uiPackagePrelude,
  surfaceTypes: ['ui.card.v1'],
};

export const KANBAN_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'kanban',
  version: '1.0.0',
  summary: 'Kanban widget DSL package providing widgets.kanban.* constructors.',
  installPrelude: kanbanPackagePrelude,
  surfaceTypes: ['kanban.v1'],
  dependencies: ['ui'],
};

export function registerBuiltInRuntimePackages(): void {
  registerRuntimePackage(UI_RUNTIME_PACKAGE);
  registerRuntimePackage(KANBAN_RUNTIME_PACKAGE);
}
