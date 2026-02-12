import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  active?: boolean;
  children: ReactNode;
}

export function Btn({ children, active, variant = 'default', ...props }: BtnProps) {
  return (
    <button
      data-part="btn"
      data-state={active ? 'active' : undefined}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  );
}
