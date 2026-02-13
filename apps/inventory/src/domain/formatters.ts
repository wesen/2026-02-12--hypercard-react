export function formatCurrency(value: unknown): string {
  return `$${Number(value).toFixed(2)}`;
}

export function qtyState(threshold: number) {
  return (value: unknown): string | undefined => {
    const qty = Number(value);
    if (qty === 0) return 'error';
    if (qty <= threshold) return 'warning';
    return undefined;
  };
}
