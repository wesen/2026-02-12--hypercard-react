export interface DesktopActionItem {
  id: string;
  label: string;
  commandId: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  payload?: Record<string, unknown>;
}

export interface DesktopActionSeparator {
  separator: true;
}

export type DesktopActionEntry = DesktopActionItem | DesktopActionSeparator;

export type DesktopSectionMergeMode = 'append' | 'replace';

export interface DesktopActionSection {
  id: string;
  label: string;
  /** Merge behavior when another section with the same id is encountered. */
  merge?: DesktopSectionMergeMode;
  items: DesktopActionEntry[];
}

export type DesktopCommandSource = 'menu' | 'context-menu' | 'icon' | 'programmatic';

export interface DesktopCommandInvocation {
  source: DesktopCommandSource;
  menuId?: string;
  windowId?: string | null;
  widgetId?: string;
  payload?: Record<string, unknown>;
}

// Backward-compatible menu aliases used throughout existing callers.
export type DesktopMenuItem = DesktopActionItem;
export type DesktopMenuSeparator = DesktopActionSeparator;
export type DesktopMenuEntry = DesktopActionEntry;
export type DesktopMenuSection = DesktopActionSection;

export interface DesktopIconDef {
  id: string;
  label: string;
  icon: string;
  /** Explicit horizontal position. When omitted, icons auto-flow in a grid. */
  x?: number;
  /** Explicit vertical position. When omitted, icons auto-flow in a grid. */
  y?: number;
}

export interface DesktopWindowDef {
  id: string;
  title: string;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  focused?: boolean;
  isDialog?: boolean;
  isResizable?: boolean;
}
