import type { ReactNode } from 'react';
import { PARTS } from '../../parts';

export interface TabControlProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
  children: ReactNode;
}

export function TabControl({ tabs, activeTab, onTabChange, children }: TabControlProps) {
  return (
    <div data-part={PARTS.tabControl}>
      <div data-part={PARTS.tabBar} role="tablist">
        {tabs.map((tab, i) => (
          <div
            key={`${tab}-${i}`}
            data-part={PARTS.tab}
            data-state={activeTab === i ? 'active' : undefined}
            role="tab"
            aria-selected={activeTab === i}
            onClick={() => onTabChange(i)}
          >
            {tab}
          </div>
        ))}
      </div>
      <div data-part="content-area" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
