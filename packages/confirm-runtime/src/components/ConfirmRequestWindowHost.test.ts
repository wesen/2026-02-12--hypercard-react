import { describe, expect, it } from 'vitest';
import { resolveSelectedTableRows } from './ConfirmRequestWindowHost';

describe('ConfirmRequestWindowHost table selection helpers', () => {
  it('keeps no-id rows distinct by index when rowKey is not provided', () => {
    const rows = [
      { env: 'staging', status: 'ok' },
      { env: 'prod', status: 'degraded' },
    ];

    const selected = resolveSelectedTableRows(rows, ['0', '1']);
    expect(selected).toEqual(rows);
  });

  it('respects explicit rowKey when provided', () => {
    const rows = [
      { key: 'srv-1', env: 'staging' },
      { key: 'srv-2', env: 'prod' },
    ];

    const selected = resolveSelectedTableRows(rows, ['srv-2'], 'key');
    expect(selected).toEqual([{ key: 'srv-2', env: 'prod' }]);
  });
});
