// @hypercard/engine — barrel exports
//
// USAGE:
//   import { DesktopShell, DataTable, windowingReducer, ... } from '@hypercard/engine';
//   import '@hypercard/engine/src/theme/base.css';      // load base tokens
//   import '@hypercard/engine/src/theme/modern.css';     // optional theme
//

// ── App utilities ──
export * from './app';
// ── Card DSL ──
export * from './cards';
// ── Plugin Runtime ──
export * from './plugin-runtime';
// ── Chat ──
export * from './chat';
// ── Shell ──
export * from './components/shell';

// ── Widgets ──
export * from './components/widgets';
// ── Debug utilities ──
export * from './debug';
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
// ── Windowing ──
export * from './features/windowing';
export * from './parts';
// ── Theme ──
export { HyperCardTheme, type HyperCardThemeProps } from './theme/HyperCardTheme';
// ── Types ──
export * from './types';
