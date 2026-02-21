import type { CardStackDefinition } from '../../../cards';
import type { OpenWindowPayload } from '../../../desktop/core/state/types';
import type { DesktopIconDef, DesktopMenuSection } from './types';
import type { WindowContentAdapter } from './windowContentAdapter';

export interface DesktopCommandContext {
  dispatch: (action: any) => unknown;
  getState?: () => unknown;
  focusedWindowId: string | null;
  openCardWindow: (cardId: string) => void;
  closeWindow: (windowId: string) => void;
}

export interface DesktopCommandHandler {
  id: string;
  priority?: number;
  matches: (commandId: string) => boolean;
  run: (commandId: string, ctx: DesktopCommandContext) => 'handled' | 'pass';
}

export interface StartupWindowContext {
  stack: CardStackDefinition;
  homeParam?: string;
}

export interface StartupWindowFactory {
  id: string;
  create: (ctx: StartupWindowContext) => OpenWindowPayload | null;
}

export interface DesktopContribution {
  id: string;
  menus?: DesktopMenuSection[];
  icons?: DesktopIconDef[];
  commands?: DesktopCommandHandler[];
  windowContentAdapters?: WindowContentAdapter[];
  startupWindows?: StartupWindowFactory[];
}

export interface ComposedDesktopContributions {
  menus: DesktopMenuSection[];
  icons: DesktopIconDef[];
  commandHandlers: DesktopCommandHandler[];
  windowContentAdapters: WindowContentAdapter[];
  startupWindows: StartupWindowFactory[];
}

export interface ComposeDesktopContributionsOptions {
  onIconCollision?: 'throw' | 'warn';
}

function mergeMenus(menus: DesktopMenuSection[]): DesktopMenuSection[] {
  const byId = new Map<string, DesktopMenuSection>();
  const order: string[] = [];

  for (const section of menus) {
    const existing = byId.get(section.id);
    if (!existing) {
      byId.set(section.id, { ...section, items: [...section.items] });
      order.push(section.id);
      continue;
    }
    existing.items = [...existing.items, ...section.items];
  }

  return order.map((id) => byId.get(id) as DesktopMenuSection);
}

function mergeIcons(icons: DesktopIconDef[], options: ComposeDesktopContributionsOptions): DesktopIconDef[] {
  const byId = new Map<string, DesktopIconDef>();
  const merged: DesktopIconDef[] = [];

  for (const icon of icons) {
    if (!byId.has(icon.id)) {
      byId.set(icon.id, icon);
      merged.push(icon);
      continue;
    }

    const msg = `Desktop contribution icon collision: ${icon.id}`;
    if (options.onIconCollision === 'warn') {
      console.warn(msg);
      continue;
    }
    throw new Error(msg);
  }

  return merged;
}

function sortCommandHandlers(handlers: DesktopCommandHandler[]): DesktopCommandHandler[] {
  return handlers
    .map((handler, idx) => ({ handler, idx }))
    .sort((a, b) => (b.handler.priority ?? 0) - (a.handler.priority ?? 0) || a.idx - b.idx)
    .map((entry) => entry.handler);
}

export function composeDesktopContributions(
  items: DesktopContribution[] | undefined,
  options: ComposeDesktopContributionsOptions = {},
): ComposedDesktopContributions {
  const list = items ?? [];
  return {
    menus: mergeMenus(list.flatMap((c) => c.menus ?? [])),
    icons: mergeIcons(list.flatMap((c) => c.icons ?? []), options),
    commandHandlers: sortCommandHandlers(list.flatMap((c) => c.commands ?? [])),
    windowContentAdapters: list.flatMap((c) => c.windowContentAdapters ?? []),
    startupWindows: list.flatMap((c) => c.startupWindows ?? []),
  };
}

export function routeContributionCommand(
  commandId: string,
  handlers: DesktopCommandHandler[],
  ctx: DesktopCommandContext,
): boolean {
  for (const handler of handlers) {
    if (!handler.matches(commandId)) continue;
    if (handler.run(commandId, ctx) === 'handled') return true;
  }
  return false;
}
