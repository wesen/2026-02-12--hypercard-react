export interface DesktopMenuItem {
  id: string;
  label: string;
  commandId: string;
  shortcut?: string;
  disabled?: boolean;
}

export interface DesktopMenuSeparator {
  separator: true;
}

export type DesktopMenuEntry = DesktopMenuItem | DesktopMenuSeparator;

export interface DesktopMenuSection {
  id: string;
  label: string;
  items: DesktopMenuEntry[];
}

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
