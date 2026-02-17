export interface DesktopCommandRouteContext {
  homeCardId: string;
  focusedWindowId: string | null;
  openCardWindow: (cardId: string) => void;
  closeWindow: (windowId: string) => void;
  tileWindows: () => void;
  cascadeWindows: () => void;
}

/**
 * Routes built-in desktop commands and returns true when handled.
 * Unknown commands are intentionally passed through to host handlers.
 */
export function routeDesktopCommand(commandId: string, ctx: DesktopCommandRouteContext): boolean {
  if (commandId === 'window.open.home') {
    ctx.openCardWindow(ctx.homeCardId);
    return true;
  }

  if (commandId === 'window.close-focused' && ctx.focusedWindowId) {
    ctx.closeWindow(ctx.focusedWindowId);
    return true;
  }

  if (commandId.startsWith('window.open.card.')) {
    const cardId = commandId.replace('window.open.card.', '');
    ctx.openCardWindow(cardId);
    return true;
  }

  if (commandId === 'window.tile') {
    ctx.tileWindows();
    return true;
  }

  if (commandId === 'window.cascade') {
    ctx.cascadeWindows();
    return true;
  }

  return false;
}
