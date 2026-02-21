import { PARTS } from '../../../parts';
import { HyperCardTheme } from '../../../theme/HyperCardTheme';
import { Toast } from '../../widgets/Toast';
import { DesktopIconLayer } from './DesktopIconLayer';
import { DesktopMenuBar } from './DesktopMenuBar';
import { WindowLayer } from './WindowLayer';
import type { DesktopShellControllerResult } from './useDesktopShellController';

export interface DesktopShellViewProps extends DesktopShellControllerResult {}

export function DesktopShellView({
  themeClass,
  menus,
  icons,
  activeMenuId,
  selectedIconId,
  windows,
  toast,
  onDesktopBackgroundClick,
  onActiveMenuChange,
  onCommand,
  onSelectIcon,
  onOpenIcon,
  onFocusWindow,
  onCloseWindow,
  onWindowDragStart,
  onWindowResizeStart,
  renderWindowBody,
  onToastDone,
}: DesktopShellViewProps) {
  return (
    <HyperCardTheme theme={themeClass}>
      <div data-part={PARTS.windowingDesktopShell} onClick={onDesktopBackgroundClick}>
        <DesktopMenuBar
          sections={menus}
          activeMenuId={activeMenuId}
          onActiveMenuChange={onActiveMenuChange}
          onCommand={onCommand}
        />
        <DesktopIconLayer
          icons={icons}
          selectedIconId={selectedIconId}
          onSelectIcon={onSelectIcon}
          onOpenIcon={onOpenIcon}
        />
        <WindowLayer
          windows={windows}
          onFocusWindow={onFocusWindow}
          onCloseWindow={onCloseWindow}
          onWindowDragStart={onWindowDragStart}
          onWindowResizeStart={onWindowResizeStart}
          renderWindowBody={renderWindowBody}
        />
        {toast && <Toast message={toast} onDone={onToastDone} />}
      </div>
    </HyperCardTheme>
  );
}
