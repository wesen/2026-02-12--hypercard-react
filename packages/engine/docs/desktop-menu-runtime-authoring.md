# Desktop Menu Runtime Authoring Guide

This guide covers how app modules should integrate with the desktop shell menu runtime in `@hypercard/engine`.

## Goals

- Keep static app-level menu contributions declarative.
- Allow focused windows to contribute dynamic menu sections at runtime.
- Route all menu and context-menu actions through the same command router with invocation metadata.

## Core Data Shapes

Use `DesktopActionSection` and `DesktopActionEntry` for menu and context actions.

```ts
type DesktopActionEntry =
  | {
      id: string;
      label: string;
      commandId: string;
      shortcut?: string;
      disabled?: boolean;
      checked?: boolean;
      payload?: Record<string, unknown>;
    }
  | { separator: true };

type DesktopActionSection = {
  id: string;
  label: string;
  merge?: 'append' | 'replace';
  items: DesktopActionEntry[];
};
```

Legacy `DesktopMenuSection` / `DesktopMenuEntry` aliases remain supported and map to the same shape.

## Static Contributions (Module Level)

Use `DesktopContribution.menus` and `DesktopContribution.commands` for static application commands:

```ts
const contribution: DesktopContribution = {
  id: 'inventory.launcher',
  menus: [
    {
      id: 'file',
      label: 'File',
      items: [{ id: 'new-chat', label: 'New Chat', commandId: 'inventory.chat.new' }],
    },
  ],
  commands: [
    {
      id: 'inventory.chat.new',
      matches: (commandId) => commandId === 'inventory.chat.new',
      run: (_commandId, ctx) => {
        ctx.dispatch(openWindow(...));
        return 'handled';
      },
    },
  ],
};
```

## Focused Dynamic Menu Sections (Window Level)

Use `useRegisterWindowMenuSections` inside a rendered app window component.

```tsx
function InventoryChatWindow({ convId }: { convId: string }) {
  const sections = useMemo<DesktopActionSection[]>(
    () => [
      {
        id: 'chat',
        label: 'Chat',
        merge: 'replace',
        items: [{ id: `chat-${convId}`, label: 'Event Viewer', commandId: `inventory.chat.${convId}.debug.event-viewer` }],
      },
      {
        id: 'profile',
        label: 'Profile',
        merge: 'replace',
        items: [...],
      },
    ],
    [convId],
  );

  useRegisterWindowMenuSections(sections);
  return <div>...</div>;
}
```

Notes:

- Registration is scoped to the hosting `windowId`.
- Only the focused window's runtime sections are merged into the top menubar.
- Use `merge: 'replace'` to deterministically override an existing section id.

## Title-Bar Context Actions (Window Level)

Use `useRegisterWindowContextActions` for right-click title-bar/surface actions:

```tsx
function InventoryChatWindow({ convId }: { convId: string }) {
  useRegisterWindowContextActions([
    {
      id: `event-viewer-${convId}`,
      label: 'Open Event Viewer',
      commandId: `inventory.chat.${convId}.debug.event-viewer`,
    },
    {
      id: `timeline-debug-${convId}`,
      label: 'Open Timeline Debug',
      commandId: `inventory.chat.${convId}.debug.timeline-debug`,
    },
  ]);

  return <div>...</div>;
}
```

The shell composes these ahead of default window actions (`Close Window`, `Tile Windows`, `Cascade Windows`).

## Invocation Metadata

Commands receive optional metadata via `DesktopCommandInvocation`:

```ts
type DesktopCommandInvocation = {
  source: 'menu' | 'context-menu' | 'icon' | 'programmatic';
  menuId?: string;
  windowId?: string | null;
  widgetId?: string;
  payload?: Record<string, unknown>;
};
```

When a context-menu action is clicked, metadata includes:

- `source: 'context-menu'`
- `menuId: 'window-context'`
- `windowId: <focused-window-id>`
- `widgetId: 'title-bar'` when opened from title bar
- `payload` from the selected action entry

## Profile-Scoped Menu Patterns

For per-conversation profile menus, pass a scope key through chat runtime hooks:

- `useCurrentProfile(scopeKey?)`
- `useSetProfile(basePrefix, { scopeKey? })`
- `useProfiles(basePrefix, registry, { enabled, scopeKey })`
- `useConversation(convId, basePrefix, scopeKey?)`

Use a deterministic key format such as `conv:<conversationId>`.

## Testing Checklist

Minimum recommended coverage for apps that adopt runtime menus:

- Runtime menu sections appear only when the owning window is focused.
- Focus switches recompose top menubar sections correctly.
- Context-menu actions route through the command system and preserve invocation metadata.
- Non-adopting apps retain default menu/context behavior.
- Legacy contribution shapes still compose and route correctly.

## Storybook Checklist

Add stories for:

- focused runtime menu sections,
- title-bar context-menu actions,
- payload-driven widget-target actions in `ContextMenu`.

These scenarios are implemented in:

- `DesktopShell.stories.tsx`
- `ContextMenu.stories.tsx`
