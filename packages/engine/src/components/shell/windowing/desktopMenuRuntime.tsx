import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react';
import { normalizeContextTargetRef } from './contextActionRegistry';
import type { DesktopActionEntry, DesktopActionSection } from './types';
import type { DesktopContextTargetRef } from './types';

export interface DesktopWindowMenuRuntime {
  registerWindowMenuSections: (windowId: string, sections: DesktopActionSection[]) => void;
  unregisterWindowMenuSections: (windowId: string) => void;
  registerContextActions: (target: DesktopContextTargetRef, actions: DesktopActionEntry[]) => void;
  unregisterContextActions: (target: DesktopContextTargetRef) => void;
  registerWindowContextActions: (windowId: string, actions: DesktopActionEntry[]) => void;
  unregisterWindowContextActions: (windowId: string) => void;
}

const DesktopWindowMenuRuntimeContext = createContext<DesktopWindowMenuRuntime | null>(null);
const DesktopWindowScopeContext = createContext<string | null>(null);

export interface DesktopWindowMenuRuntimeProviderProps extends DesktopWindowMenuRuntime {
  children: ReactNode;
}

export function DesktopWindowMenuRuntimeProvider({
  children,
  registerWindowMenuSections,
  unregisterWindowMenuSections,
  registerContextActions,
  unregisterContextActions,
  registerWindowContextActions,
  unregisterWindowContextActions,
}: DesktopWindowMenuRuntimeProviderProps) {
  const runtime = useMemo(
    () => ({
      registerWindowMenuSections,
      unregisterWindowMenuSections,
      registerContextActions,
      unregisterContextActions,
      registerWindowContextActions,
      unregisterWindowContextActions,
    }),
    [
      registerWindowMenuSections,
      unregisterWindowMenuSections,
      registerContextActions,
      unregisterContextActions,
      registerWindowContextActions,
      unregisterWindowContextActions,
    ]
  );

  return (
    <DesktopWindowMenuRuntimeContext.Provider value={runtime}>
      {children}
    </DesktopWindowMenuRuntimeContext.Provider>
  );
}

export interface DesktopWindowScopeProviderProps {
  windowId: string;
  children: ReactNode;
}

export function DesktopWindowScopeProvider({ windowId, children }: DesktopWindowScopeProviderProps) {
  return <DesktopWindowScopeContext.Provider value={windowId}>{children}</DesktopWindowScopeContext.Provider>;
}

export function useDesktopWindowId(): string | null {
  return useContext(DesktopWindowScopeContext);
}

export function useRegisterWindowMenuSections(sections: DesktopActionSection[] | null | undefined): void {
  const runtime = useContext(DesktopWindowMenuRuntimeContext);
  const windowId = useDesktopWindowId();

  useEffect(() => {
    if (!runtime || !windowId || !sections || sections.length === 0) {
      return;
    }
    runtime.registerWindowMenuSections(windowId, sections);
    return () => {
      runtime.unregisterWindowMenuSections(windowId);
    };
  }, [runtime, sections, windowId]);
}

export function useRegisterWindowContextActions(actions: DesktopActionEntry[] | null | undefined): void {
  const runtime = useContext(DesktopWindowMenuRuntimeContext);
  const windowId = useDesktopWindowId();

  useEffect(() => {
    if (!runtime || !windowId || !actions || actions.length === 0) {
      return;
    }
    const target = { kind: 'window', windowId } as const;
    runtime.registerContextActions(target, actions);
    return () => {
      runtime.unregisterContextActions(target);
    };
  }, [actions, runtime, windowId]);
}

export function useRegisterContextActions(
  target: DesktopContextTargetRef | null | undefined,
  actions: DesktopActionEntry[] | null | undefined
): void {
  const runtime = useContext(DesktopWindowMenuRuntimeContext);
  const normalizedTarget = useMemo(
    () => (target ? normalizeContextTargetRef(target) : null),
    [target]
  );

  useEffect(() => {
    if (!runtime || !normalizedTarget || !actions || actions.length === 0) {
      return;
    }
    runtime.registerContextActions(normalizedTarget, actions);
    return () => {
      runtime.unregisterContextActions(normalizedTarget);
    };
  }, [actions, normalizedTarget, runtime]);
}

export function useRegisterIconContextActions(
  iconId: string | null | undefined,
  actions: DesktopActionEntry[] | null | undefined
): void {
  const windowId = useDesktopWindowId();
  const target = useMemo(() => {
    const normalizedIconId = String(iconId ?? '').trim();
    if (!normalizedIconId) return null;
    return {
      kind: 'icon' as const,
      iconId: normalizedIconId,
      windowId: windowId ?? undefined,
    };
  }, [iconId, windowId]);
  useRegisterContextActions(target, actions);
}

export function useRegisterWidgetContextActions(
  widgetId: string | null | undefined,
  actions: DesktopActionEntry[] | null | undefined
): void {
  const windowId = useDesktopWindowId();
  const target = useMemo(() => {
    const normalizedWidgetId = String(widgetId ?? '').trim();
    if (!normalizedWidgetId) return null;
    return {
      kind: 'widget' as const,
      widgetId: normalizedWidgetId,
      windowId: windowId ?? undefined,
    };
  }, [widgetId, windowId]);
  useRegisterContextActions(target, actions);
}

export function useRegisterConversationContextActions(
  conversationId: string | null | undefined,
  actions: DesktopActionEntry[] | null | undefined
): void {
  const windowId = useDesktopWindowId();
  const target = useMemo(() => {
    const normalizedConversationId = String(conversationId ?? '').trim();
    if (!normalizedConversationId) return null;
    return {
      kind: 'conversation' as const,
      conversationId: normalizedConversationId,
      windowId: windowId ?? undefined,
    };
  }, [conversationId, windowId]);
  useRegisterContextActions(target, actions);
}

export function useRegisterMessageContextActions(
  conversationId: string | null | undefined,
  messageId: string | null | undefined,
  actions: DesktopActionEntry[] | null | undefined
): void {
  const windowId = useDesktopWindowId();
  const target = useMemo(() => {
    const normalizedConversationId = String(conversationId ?? '').trim();
    const normalizedMessageId = String(messageId ?? '').trim();
    if (!normalizedConversationId || !normalizedMessageId) return null;
    return {
      kind: 'message' as const,
      conversationId: normalizedConversationId,
      messageId: normalizedMessageId,
      windowId: windowId ?? undefined,
    };
  }, [conversationId, messageId, windowId]);
  useRegisterContextActions(target, actions);
}
