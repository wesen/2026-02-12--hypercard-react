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

const current = { price: 10, cost: 7, qty: 2 };

const expr = {
  title: 'Detail',
  computed: [
    {
      id: 'margin',
      label: 'Margin',
      compute: (r) => `${Math.round(((r.price - r.cost) / r.price) * 100)}%`,
    },
  ],
};

const resolved = resolveValueExpr(expr, {
  state: {},
  params: {},
  selectors: () => undefined,
});

assert(Array.isArray(resolved.computed), 'computed remains an array after resolution');
assert(typeof resolved.computed[0].compute === 'function', 'computed[0].compute remains a function');
assert(resolved.computed[0].compute(current) === '30%', 'compute function remains callable with expected result');

const dateExpr = { stamp: new Date('2026-02-13T00:00:00.000Z') };
const resolvedDate = resolveValueExpr(dateExpr, {
  state: {},
  params: {},
  selectors: () => undefined,
});
assert(resolvedDate.stamp instanceof Date, 'non-plain objects are preserved');

if (process.exitCode !== 1) {
  console.log('\nresolveValueExpr function pass-through regression checks passed.');
}
