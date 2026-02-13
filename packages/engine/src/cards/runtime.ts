import {
  patchScopedState,
  resetScopedState,
  selectMergedScopedState,
  selectScopedState,
  setScopedState,
  type HypercardRuntimeStateSlice,
} from './runtimeStateSlice';
import type {
  ActionDescriptor,
  CardContext,
  CardDefinition,
  CardStackDefinition,
  LocalScope,
  SelectorScope,
  SharedActionRegistry,
  SharedSelectorRegistry,
  ValueExpr,
} from './types';

interface RuntimeLookup {
  cardDef: CardDefinition<any>;
  stackDef: CardStackDefinition<any>;
  backgroundDef?: CardStackDefinition['backgrounds'] extends infer T
    ? T extends Record<string, infer B>
      ? B
      : never
    : never;
  cardTypeDef?: CardStackDefinition['cardTypes'] extends infer T
    ? T extends Record<string, infer C>
      ? C
      : never
    : never;
}

function deepGet(obj: unknown, path: string): unknown {
  const parts = String(path).split('.').filter(Boolean);
  let cur: unknown = obj;
  for (const part of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function selectorFromScope(
  scope: LocalScope,
  name: string,
  rootState: unknown,
  args: unknown,
  ctx: CardContext,
  lookup: RuntimeLookup,
): { found: boolean; value: unknown } {
  const registry: Record<string, ((state: unknown, a: unknown, c: CardContext) => unknown) | undefined> = {};

  if (scope === 'card') Object.assign(registry, lookup.cardDef.selectors ?? {});
  if (scope === 'cardType') Object.assign(registry, lookup.cardTypeDef?.selectors ?? {});
  if (scope === 'background') Object.assign(registry, lookup.backgroundDef?.selectors ?? {});
  if (scope === 'stack') Object.assign(registry, lookup.stackDef.stack?.selectors ?? {});
  if (scope === 'global') Object.assign(registry, lookup.stackDef.global?.selectors ?? {});

  const fn = registry[name];
  if (fn) return { found: true, value: fn(rootState, args, ctx) };

  // local-state convenience fallback
  const scoped = ctx.getScopedState(scope);
  if (name.startsWith('state.')) {
    return { found: true, value: deepGet(scoped, name.slice(6)) };
  }
  if (Object.prototype.hasOwnProperty.call(scoped, name)) {
    return { found: true, value: scoped[name] };
  }

  return { found: false, value: undefined };
}

export function createSelectorResolver(
  rootState: unknown,
  ctx: CardContext,
  lookup: RuntimeLookup,
  sharedSelectors: SharedSelectorRegistry,
) {
  return (name: string, from: SelectorScope | undefined, args: unknown): unknown => {
    if (from === 'shared') {
      return sharedSelectors[name]?.(rootState, args, ctx);
    }

    if (from && from !== 'auto') {
      const result = selectorFromScope(from, name, rootState, args, ctx, lookup);
      return result.value;
    }

    for (const scope of ['card', 'cardType', 'background', 'stack', 'global'] as const) {
      const result = selectorFromScope(scope, name, rootState, args, ctx, lookup);
      if (result.found) return result.value;
    }

    return sharedSelectors[name]?.(rootState, args, ctx);
  };
}

export function resolveValueExpr(
  expr: ValueExpr | unknown,
  context: {
    state: unknown;
    params: Record<string, string>;
    event?: { name: string; payload: unknown };
    selectors: (name: string, from: SelectorScope | undefined, args: unknown) => unknown;
  },
): unknown {
  if (
    expr == null ||
    typeof expr === 'string' ||
    typeof expr === 'number' ||
    typeof expr === 'boolean'
  ) {
    return expr;
  }

  if (Array.isArray(expr)) {
    return expr.map((item) => resolveValueExpr(item, context));
  }

  if (!isPlainObject(expr)) return undefined;

  if (!('$' in expr)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(expr)) {
      out[k] = resolveValueExpr(v, context);
    }
    return out;
  }

  if (expr.$ === 'param') {
    return context.params[String(expr.name ?? '')];
  }

  if (expr.$ === 'event') {
    return deepGet(context.event?.payload, String(expr.name ?? ''));
  }

  if (expr.$ === 'sel') {
    const resolvedArgs = resolveValueExpr(expr.args, context);
    return context.selectors(String(expr.name ?? ''), expr.from as SelectorScope | undefined, resolvedArgs);
  }

  return undefined;
}

export function createCardContext<TRootState>(
  root: HypercardRuntimeStateSlice,
  opts: {
    stackId: string;
    cardId: string;
    cardType: string;
    backgroundId?: string;
    mode: 'interactive' | 'preview';
    params: Record<string, string>;
    getState: () => TRootState;
    dispatch: (action: unknown) => unknown;
    nav: { go: (card: string, param?: string) => void; back: () => void };
  },
): CardContext<TRootState> {
  const lookup = {
    stackId: opts.stackId,
    cardId: opts.cardId,
    cardType: opts.cardType,
    backgroundId: opts.backgroundId,
  };

  return {
    stackId: opts.stackId,
    cardId: opts.cardId,
    cardType: opts.cardType,
    backgroundId: opts.backgroundId,
    mode: opts.mode,
    params: opts.params,
    getState: opts.getState,
    dispatch: opts.dispatch,
    nav: opts.nav,
    getScopedState: (scope) => selectScopedState(root, { ...lookup, scope }),
    getMergedScopedState: () => selectMergedScopedState(root, lookup),
    setScopedState: (scope, path, value) => {
      opts.dispatch(setScopedState({ ...lookup, scope, path, value }));
    },
    patchScopedState: (scope, patch) => {
      opts.dispatch(patchScopedState({ ...lookup, scope, patch }));
    },
    resetScopedState: (scope) => {
      opts.dispatch(resetScopedState({ ...lookup, scope }));
    },
  };
}

function resolveActionHandler(
  type: string,
  lookup: RuntimeLookup,
): ((ctx: CardContext, args: unknown) => void | Promise<void>) | undefined {
  const card = lookup.cardDef.actions?.[type];
  if (card) return card;

  const cardType = lookup.cardTypeDef?.actions?.[type];
  if (cardType) return cardType;

  const background = lookup.backgroundDef?.actions?.[type];
  if (background) return background;

  const stack = lookup.stackDef.stack?.actions?.[type];
  if (stack) return stack;

  return lookup.stackDef.global?.actions?.[type];
}

export function executeActionDescriptor(
  descriptor: ActionDescriptor,
  args: unknown,
  ctx: CardContext,
  lookup: RuntimeLookup,
  sharedActions: SharedActionRegistry,
  deps: {
    showToast: (message: string) => void;
  },
) {
  const actionType = descriptor.type;

  // Built-in navigation compatibility.
  if (actionType === 'nav.go' || actionType === 'navigate') {
    const data = args as Record<string, unknown>;
    const card = String(data.card ?? '');
    const param = data.param ? String(data.param) : data.paramValue ? String(data.paramValue) : undefined;
    if (card) ctx.nav.go(card, param);
    return;
  }

  if (actionType === 'nav.back' || actionType === 'back') {
    ctx.nav.back();
    return;
  }

  if (actionType === 'toast.show' || actionType === 'toast') {
    const data = args as Record<string, unknown>;
    const msg = String(data.message ?? '');
    if (msg) deps.showToast(msg);
    return;
  }

  // Built-in scoped state mutation commands.
  if (actionType === 'state.set') {
    const data = args as Record<string, unknown>;
    const scope = (data.scope as LocalScope | undefined) ?? 'card';
    const path = String(data.path ?? '');
    if (!path) return;
    ctx.setScopedState(scope, path, data.value);
    return;
  }

  if (actionType === 'state.patch') {
    const data = args as Record<string, unknown>;
    const scope = (data.scope as LocalScope | undefined) ?? 'card';
    const patch = (data.patch ?? {}) as Record<string, unknown>;
    ctx.patchScopedState(scope, patch);
    return;
  }

  if (actionType === 'state.reset') {
    const data = args as Record<string, unknown>;
    const scope = (data.scope as LocalScope | undefined) ?? 'card';
    ctx.resetScopedState(scope);
    return;
  }

  const localHandler = resolveActionHandler(actionType, lookup);
  if (localHandler) {
    void localHandler(ctx, args);
    return;
  }

  const shared = sharedActions[actionType];
  if (shared) {
    void shared(ctx, args);
  }
}

export interface ExecuteCommandInput {
  command: ActionDescriptor;
  event?: { name: string; payload: unknown };
}

export function executeCommand(
  input: ExecuteCommandInput,
  rootState: unknown,
  ctx: CardContext,
  lookup: RuntimeLookup,
  sharedSelectors: SharedSelectorRegistry,
  sharedActions: SharedActionRegistry,
  deps: {
    showToast: (message: string) => void;
  },
) {
  const selectors = createSelectorResolver(rootState, ctx, lookup, sharedSelectors);
  const resolvedArgs = resolveValueExpr(input.command.args, {
    state: rootState,
    params: ctx.params,
    event: input.event,
    selectors,
  });

  executeActionDescriptor(input.command, resolvedArgs, ctx, lookup, sharedActions, deps);
}

export type { RuntimeLookup };
