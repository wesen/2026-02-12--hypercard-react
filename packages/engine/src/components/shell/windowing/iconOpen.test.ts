import { describe, expect, it, vi } from 'vitest';
import { openDesktopIcon } from './iconOpen';

describe('openDesktopIcon', () => {
  it('opens card windows directly for card icons', () => {
    const selectIcon = vi.fn();
    const openCardWindow = vi.fn();
    const routeCommand = vi.fn();

    openDesktopIcon({
      iconId: 'receive',
      isCardIcon: (iconId) => iconId === 'receive',
      selectIcon,
      openCardWindow,
      routeCommand,
    });

    expect(selectIcon).toHaveBeenCalledWith('receive');
    expect(openCardWindow).toHaveBeenCalledWith('receive');
    expect(routeCommand).not.toHaveBeenCalled();
  });

  it('routes non-card icon opens through command routing', () => {
    const selectIcon = vi.fn();
    const openCardWindow = vi.fn();
    const routeCommand = vi.fn();

    openDesktopIcon({
      iconId: 'new-chat',
      isCardIcon: () => false,
      selectIcon,
      openCardWindow,
      routeCommand,
    });

    expect(selectIcon).toHaveBeenCalledWith('new-chat');
    expect(openCardWindow).not.toHaveBeenCalled();
    expect(routeCommand).toHaveBeenCalledWith('icon.open.new-chat');
  });
});
