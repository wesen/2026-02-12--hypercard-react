import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react';
import type { DesktopActionEntry, DesktopActionSection } from './types';

export interface DesktopWindowMenuRuntime {
  registerWindowMenuSections: (windowId: string, sections: DesktopActionSection[]) => void;
  unregisterWindowMenuSections: (windowId: string) => void;
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
  registerWindowContextActions,
  unregisterWindowContextActions,
}: DesktopWindowMenuRuntimeProviderProps) {
  const runtime = useMemo(
    () => ({
      registerWindowMenuSections,
      unregisterWindowMenuSections,
      registerWindowContextActions,
      unregisterWindowContextActions,
    }),
    [
      registerWindowMenuSections,
      unregisterWindowMenuSections,
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
    runtime.registerWindowContextActions(windowId, actions);
    return () => {
      runtime.unregisterWindowContextActions(windowId);
    };
  }, [actions, runtime, windowId]);
}
