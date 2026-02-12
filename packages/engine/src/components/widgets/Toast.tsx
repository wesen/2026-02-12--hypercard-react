import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  duration?: number;
  onDone: () => void;
}

export function Toast({ message, duration = 2200, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return <div data-part="toast">{message}</div>;
}
