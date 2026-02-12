import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Chip({ children, ...props }: ChipProps) {
  return (
    <button data-part="chip" {...props}>
      {children}
    </button>
  );
}
