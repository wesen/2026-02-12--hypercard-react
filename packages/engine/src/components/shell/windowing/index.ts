export { DesktopIconLayer, type DesktopIconLayerProps } from './DesktopIconLayer';
export { DesktopMenuBar, type DesktopMenuBarProps } from './DesktopMenuBar';
export { DesktopShell, type DesktopShellProps } from './DesktopShell';
export { DesktopShellView, type DesktopShellViewProps } from './DesktopShellView';
export {
  composeDesktopContributions,
  routeContributionCommand,
  type ComposedDesktopContributions,
  type DesktopCommandContext,
  type DesktopCommandHandler,
  type DesktopContribution,
  type StartupWindowContext,
  type StartupWindowFactory,
} from './desktopContributions';
export {
  createAppWindowContentAdapter,
  createFallbackWindowContentAdapter,
  createHypercardCardContentAdapter,
} from './defaultWindowContentAdapters';
export {
  routeDesktopCommand,
  type DesktopCommandRouteContext,
} from './desktopCommandRouter';
export {
  useDesktopShellController,
  type DesktopShellControllerResult,
} from './useDesktopShellController';
export {
  renderWindowContentWithAdapters,
  type WindowAdapterContext,
  type WindowContentAdapter,
} from './windowContentAdapter';
export { PluginCardRenderer, type PluginCardRendererProps } from './PluginCardRenderer';
export { dispatchRuntimeIntent } from './pluginIntentRouting';
export { PluginCardSessionHost, type PluginCardSessionHostProps } from './PluginCardSessionHost';
export type {
  DesktopIconDef,
  DesktopMenuEntry,
  DesktopMenuItem,
  DesktopMenuSection,
  DesktopMenuSeparator,
  DesktopWindowDef,
} from './types';
export {
  useWindowInteractionController,
  type WindowInteractionConstraints,
  type WindowInteractionControllerOptions,
} from './useWindowInteractionController';
export {
  WindowLayer,
  type WindowLayerProps,
} from './WindowLayer';
export { WindowResizeHandle, type WindowResizeHandleProps } from './WindowResizeHandle';
export { WindowSurface, type WindowSurfaceProps } from './WindowSurface';
export { WindowTitleBar, type WindowTitleBarProps } from './WindowTitleBar';
