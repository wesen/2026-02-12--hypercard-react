// @hypercard/engine — barrel exports
//
// USAGE:
//   import { DataTable, createAppStore, ... } from '@hypercard/engine';
//   import { DesktopShell } from '@hypercard/engine/desktop-react';
//   import { openWindow } from '@hypercard/engine/desktop-core';
//   import '@hypercard/engine/theme';                    // load default desktop/widget css packs
//   import '@hypercard/engine/theme/modern.css';         // optional theme layer
//

// ── App utilities ──
export * from './app';
// ── Card DSL ──
export * from './cards';
// ── Plugin Runtime ──
export * from './plugin-runtime';
// ── HyperCard Chat Tooling ──
export * from './hypercard-chat';

// ── Widgets ──
export * from './components/widgets';
// ── Diagnostics (Redux perf / FPS) ──
export * from './diagnostics';
// ── State ──
export {
  clearToast,
  notificationsReducer,
  showToast,
} from './features/notifications/notificationsSlice';
export * from './features/notifications/selectors';
export * from './features/pluginCardRuntime';
export * from './parts';
// ── Theme ──
export { HyperCardTheme, type HyperCardThemeProps } from './theme/HyperCardTheme';
// ── Types ──
export * from './types';
