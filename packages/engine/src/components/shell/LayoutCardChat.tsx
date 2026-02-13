import type { ReactNode } from 'react';

export interface LayoutCardChatProps {
  main: ReactNode;
}

export function LayoutCardChat({ main }: LayoutCardChatProps) {
  return <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>{main}</div>;
}
