// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MacRepl } from './MacRepl';
import type { ReplDriver } from './types';

const roots: Root[] = [];
const containers: HTMLElement[] = [];

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

describe('MacRepl', () => {
  it('echoes submitted commands into the transcript when the driver does not', async () => {
    const driver: ReplDriver = {
      execute(raw) {
        return {
          lines: [{ type: 'output', text: `result:${raw}` }],
        };
      },
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(<MacRepl driver={driver} prompt="js>" />);
    });

    const input = container.querySelector('input');
    expect(input).not.toBeNull();

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      valueSetter?.call(input, '1 + 2');
      input!.dispatchEvent(new Event('input', { bubbles: true }));
      input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    const text = container.textContent ?? '';
    expect(text).toContain('1 + 2');
    expect(text).toContain('result:1 + 2');
  });
});
