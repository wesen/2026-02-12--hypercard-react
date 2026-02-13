#!/usr/bin/env node

import { resolveValueExpr } from '../../../../../../packages/engine/src/cards/runtime.ts';

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${msg}`);
  }
}

const expr = {
  buttons: [
    { label: 'Browse', action: { $: 'act', type: 'nav.go', args: { card: 'browse' } } },
    { label: 'Toast', action: { $: 'act', type: 'toast.show', args: { message: 'ok' } } },
  ],
};

const resolved = resolveValueExpr(expr, {
  state: {},
  params: {},
  selectors: () => undefined,
});

assert(Array.isArray(resolved.buttons), 'buttons array survives resolution');
assert(resolved.buttons[0].action?.$ === 'act', 'first action descriptor keeps $=act');
assert(resolved.buttons[0].action?.type === 'nav.go', 'first action descriptor keeps type');
assert(resolved.buttons[1].action?.args?.message === 'ok', 'action args survive resolution');

if (process.exitCode !== 1) {
  console.log('\nresolveValueExpr action-descriptor pass-through checks passed.');
}
