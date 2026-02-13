import type { ReactNode } from 'react';

export interface WindowChromeProps {
  title: string;
  icon?: string;
  children: ReactNode;
  className?: string;
}

export function WindowChrome({ title, icon, children, className }: WindowChromeProps) {
  return (
    <div data-part="window-frame" className={className}>
      <div data-part="title-bar">
        <div data-part="close-box" />
        <div data-part="title-text">
          {icon} {title}
        </div>
      </div>
      {children}
    </div>
  );
}
