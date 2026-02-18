function normalizeBigIntInput(value?: string): bigint | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

export function normalizeVersion(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed;
  }
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value).toString();
  }
  if (typeof value === 'bigint' && value >= 0n) {
    return value.toString();
  }
  return undefined;
}

export function compareVersions(a?: string, b?: string): number {
  const av = normalizeBigIntInput(a);
  const bv = normalizeBigIntInput(b);

  if (av !== null && bv !== null) {
    if (av > bv) return 1;
    if (av < bv) return -1;
    return 0;
  }

  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;

  // Fallback lexical compare for malformed-but-present versions.
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

export function isVersionNewer(incoming?: string, existing?: string): boolean {
  return compareVersions(incoming, existing) > 0;
}
