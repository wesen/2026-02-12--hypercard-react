import type { DesktopIconDef } from '@hypercard/engine/desktop-react';
import type { AppRegistry } from '../registry/createAppRegistry';

export function buildLauncherIcons(registry: AppRegistry): DesktopIconDef[] {
  const byId = new Set<string>();
  const icons: DesktopIconDef[] = [];

  for (const module of registry.list()) {
    const iconId = module.manifest.desktop?.id ?? module.manifest.id;
    if (byId.has(iconId)) {
      throw new Error(`Duplicate launcher icon id "${iconId}".`);
    }
    byId.add(iconId);
    icons.push({
      id: iconId,
      label: module.manifest.name,
      icon: module.manifest.icon,
      x: module.manifest.desktop?.x,
      y: module.manifest.desktop?.y,
    });
  }

  return icons;
}
