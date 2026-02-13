// @hypercard/engine — barrel exports
//
// USAGE:
//   import { HyperCardShell, DataTable, navigationReducer, ... } from '@hypercard/engine';
//   import '@hypercard/engine/src/theme/base.css';      // load base tokens
//   import '@hypercard/engine/src/theme/modern.css';     // optional theme
//

// ── App utilities ──
export * from './app';
// ── Card DSL ──
export * from './cards';
// ── Chat ──
export * from './chat';
// ── Shell ──
export * from './components/shell';

// ── Widgets ──
export * from './components/widgets';
// ── Debug utilities ──
export * from './debug';
// ── State ──
export {
  goBack,
  type LayoutMode,
  type NavEntry,
  navigate,
  navigationReducer,
  setLayout,
} from './features/navigation/navigationSlice';
export * from './features/navigation/selectors';
export {
  clearToast,
  notificationsReducer,
  showToast,
} from './features/notifications/notificationsSlice';
export * from './features/notifications/selectors';
export * from './parts';
// ── Theme ──
export { HyperCardTheme, type HyperCardThemeProps } from './theme/HyperCardTheme';
// ── Types ──
export * from './types';
