import { createContext, type ReactNode, useContext, useEffect } from 'react';
import type { DesktopActionSection } from './types';

export interface DesktopWindowMenuRuntime {
  registerWindowMenuSections: (windowId: string, sections: DesktopActionSection[]) => void;
  unregisterWindowMenuSections: (windowId: string) => void;
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
}: DesktopWindowMenuRuntimeProviderProps) {
  return (
    <DesktopWindowMenuRuntimeContext.Provider value={{ registerWindowMenuSections, unregisterWindowMenuSections }}>
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
