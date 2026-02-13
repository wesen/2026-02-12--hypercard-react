// @hypercard/engine — barrel exports
//
// USAGE:
//   import { HyperCardShell, DataTable, navigationReducer, ... } from '@hypercard/engine';
//   import '@hypercard/engine/src/theme/base.css';      // load base tokens
//   import '@hypercard/engine/src/theme/modern.css';     // optional theme
//

// ── Types ──
export * from './types';
export * from './parts';

// ── Theme ──
export { HyperCardTheme, type HyperCardThemeProps } from './theme/HyperCardTheme';

// ── Card DSL ──
export * from './cards';

// ── Widgets ──
export * from './components/widgets';

// ── Shell ──
export * from './components/shell';

// ── Debug utilities ──
export * from './debug';

// ── App utilities ──
export * from './app';

// ── State ──
export {
  navigationReducer,
  navigate,
  goBack,
  setLayout,
  type LayoutMode,
  type NavEntry,
} from './features/navigation/navigationSlice';
export * from './features/navigation/selectors';

export {
  notificationsReducer,
  showToast,
  clearToast,
} from './features/notifications/notificationsSlice';
export * from './features/notifications/selectors';
