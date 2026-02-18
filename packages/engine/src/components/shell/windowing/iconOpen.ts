export interface OpenDesktopIconOptions {
  iconId: string;
  isCardIcon: (iconId: string) => boolean;
  selectIcon?: (iconId: string) => void;
  openCardWindow: (cardId: string) => void;
  routeCommand: (commandId: string) => void;
}

/**
 * Desktop icon activation policy:
 * - card icons open card windows directly
 * - non-card icons route through command handling (contributions + defaults)
 */
export function openDesktopIcon({
  iconId,
  isCardIcon,
  selectIcon,
  openCardWindow,
  routeCommand,
}: OpenDesktopIconOptions): void {
  selectIcon?.(iconId);
  if (isCardIcon(iconId)) {
    openCardWindow(iconId);
    return;
  }
  routeCommand(`icon.open.${iconId}`);
}
