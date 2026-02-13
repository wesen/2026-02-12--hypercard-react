import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

export function Btn({ children, active, variant, style, ...rest }: BtnProps) {
  return (
    <button
      data-part="btn"
      data-state={active ? 'active' : undefined}
      data-variant={variant !== 'default' ? variant : undefined}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}
