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

// ── DSL ──
export * from './dsl/types';
export { resolveValue, matchFilter, interpolateTemplate, type ResolveContext } from './dsl/resolver';

// ── Widgets ──
export * from './components/widgets';

// ── Shell ──
export * from './components/shell';

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

// ── App ──
export {
  dispatchDSLAction,
  type DomainActionHandler,
} from './app/dispatchDSLAction';

// ── Registry APIs ──
export * from './api';
