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

export interface RuntimeDebugEvent {
  id: number;
  ts: string;
  kind: string;
  stackId: string;
  cardId: string;
  cardType: string;
  nodeKey?: string;
  eventName?: string;
  actionType?: string;
  selectorName?: string;
  scope?: LocalScope | 'shared';
  durationMs?: number;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

export interface RuntimeDebugHooks {
  onEvent?: (event: RuntimeDebugEvent) => void;
  shouldCapture?: (event: Omit<RuntimeDebugEvent, 'id' | 'ts'>) => boolean;
  sanitize?: (payload: unknown, context: { kind: string }) => unknown;
}

export interface RuntimeDebugContext {
  stackId: string;
  cardId: string;
  cardType: string;
}

export type RuntimeDebugEventInput = Omit<RuntimeDebugEvent, 'id' | 'ts' | 'stackId' | 'cardId' | 'cardType'> & Partial<Pick<RuntimeDebugEvent, 'stackId' | 'cardId' | 'cardType'>>;

let runtimeDebugEventId = 0;

function nextRuntimeDebugEventId(): number {
  runtimeDebugEventId += 1;
  return runtimeDebugEventId;
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return !!value && typeof value === 'object' && typeof (value as { then?: unknown }).then === 'function';
}

export function emitRuntimeDebugEvent(
  hooks: RuntimeDebugHooks | undefined,
  context: RuntimeDebugContext,
  event: RuntimeDebugEventInput,
) {
  if (!hooks?.onEvent) return;
  const eventWithoutStamp: Omit<RuntimeDebugEvent, 'id' | 'ts'> = {
    ...event,
    stackId: event.stackId ?? context.stackId,
    cardId: event.cardId ?? context.cardId,
    cardType: event.cardType ?? context.cardType,
  };
  if (hooks.shouldCapture && !hooks.shouldCapture(eventWithoutStamp)) return;

  const payload = hooks.sanitize
    ? hooks.sanitize(eventWithoutStamp.payload, { kind: eventWithoutStamp.kind })
    : eventWithoutStamp.payload;

  hooks.onEvent({
    ...eventWithoutStamp,
    payload,
    id: nextRuntimeDebugEventId(),
    ts: new Date().toISOString(),
  });
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
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
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
  debugHooks?: RuntimeDebugHooks,
) {
  return (name: string, from: SelectorScope | undefined, args: unknown): unknown => {
    const startedAt = Date.now();

    if (from === 'shared') {
      const hasSharedSelector = Object.prototype.hasOwnProperty.call(sharedSelectors, name);
      const selector = hasSharedSelector ? sharedSelectors[name] : undefined;
      const value = selector?.(rootState, args, ctx);
      emitRuntimeDebugEvent(debugHooks, ctx, {
        kind: 'selector.resolve',
        selectorName: name,
        scope: 'shared',
        durationMs: Date.now() - startedAt,
        payload: { from, args, found: hasSharedSelector, value },
      });
      return value;
    }

    if (from && from !== 'auto') {
      const result = selectorFromScope(from, name, rootState, args, ctx, lookup);
      emitRuntimeDebugEvent(debugHooks, ctx, {
        kind: 'selector.resolve',
        selectorName: name,
        scope: from,
        durationMs: Date.now() - startedAt,
        payload: { from, args, found: result.found, value: result.value },
      });
      return result.value;
    }

    let resolvedScope: LocalScope | 'shared' | undefined;
    let resolvedFound = false;

    for (const scope of ['card', 'cardType', 'background', 'stack', 'global'] as const) {
      const result = selectorFromScope(scope, name, rootState, args, ctx, lookup);
      if (result.found) {
        resolvedScope = scope;
        resolvedFound = true;
        emitRuntimeDebugEvent(debugHooks, ctx, {
          kind: 'selector.resolve',
          selectorName: name,
          scope,
          durationMs: Date.now() - startedAt,
          payload: { from: 'auto', args, found: result.found, value: result.value },
        });
        return result.value;
      }
    }

    const hasSharedSelector = Object.prototype.hasOwnProperty.call(sharedSelectors, name);
    const sharedSelector = hasSharedSelector ? sharedSelectors[name] : undefined;
    const sharedValue = sharedSelector?.(rootState, args, ctx);
    if (hasSharedSelector) {
      resolvedScope = 'shared';
      resolvedFound = true;
    }

    emitRuntimeDebugEvent(debugHooks, ctx, {
      kind: 'selector.resolve',
      selectorName: name,
      scope: resolvedScope,
      durationMs: Date.now() - startedAt,
      payload: {
        from: from ?? 'auto',
        args,
        found: resolvedFound,
        value: sharedValue,
      },
    });

    return sharedValue;
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
  if (typeof expr === 'function') {
    return expr;
  }

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

  // Pass through non-plain objects (Date, class instances, React-ish values) unchanged.
  if (!isPlainObject(expr)) return expr;

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

  // Keep non-value-expression tagged objects (e.g. {$:'act', ...}) intact.
  return expr;
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
  debugHooks?: RuntimeDebugHooks,
) {
  const actionType = descriptor.type;
  const startedAt = Date.now();
  const finalize = (target: string, meta?: Record<string, unknown>) => {
    emitRuntimeDebugEvent(debugHooks, ctx, {
      kind: 'action.execute',
      actionType,
      durationMs: Date.now() - startedAt,
      payload: { args },
      meta: { target, ...(meta ?? {}) },
    });
  };

  emitRuntimeDebugEvent(debugHooks, ctx, {
    kind: 'action.execute.start',
    actionType,
    payload: { args },
  });

  // Built-in navigation compatibility.
  if (actionType === 'nav.go' || actionType === 'navigate') {
    const data = args as Record<string, unknown>;
    const card = String(data.card ?? '');
    const param = data.param ? String(data.param) : data.paramValue ? String(data.paramValue) : undefined;
    if (card) ctx.nav.go(card, param);
    finalize('builtin');
    return;
  }

  if (actionType === 'nav.back' || actionType === 'back') {
    ctx.nav.back();
    finalize('builtin');
    return;
  }

  if (actionType === 'toast.show' || actionType === 'toast') {
    const data = args as Record<string, unknown>;
    const msg = String(data.message ?? '');
    if (msg) deps.showToast(msg);
    finalize('builtin');
    return;
  }

  // Built-in scoped state mutation commands.
  if (actionType === 'state.set') {
    const data = args as Record<string, unknown>;
    const scope = (data.scope as LocalScope | undefined) ?? 'card';
    const path = String(data.path ?? '');
    if (!path) return;
    emitRuntimeDebugEvent(debugHooks, ctx, {
      kind: 'state.mutation',
      actionType,
      scope,
      payload: { path, value: data.value },
    });
    ctx.setScopedState(scope, path, data.value);
    finalize('builtin');
    return;
  }

  if (actionType === 'state.setField') {
    const data = args as Record<string, unknown>;
    const scope = (data.scope as LocalScope | undefined) ?? 'card';
    const key = String(data.key ?? '');
    const path = String(data.path ?? '');
    if (!key) return;
    const fullPath = path ? `${path}.${key}` : key;
    emitRuntimeDebugEvent(debugHooks, ctx, {
      kind: 'state.mutation',
      actionType,
      scope,
      payload: { path: fullPath, value: data.value },
    });
    ctx.setScopedState(scope, fullPath, data.value);
    finalize('builtin');
    return;
  }

  if (actionType === 'state.patch') {
    const data = args as Record<string, unknown>;
    const scope = (data.scope as LocalScope | undefined) ?? 'card';
    const patch = (data.patch ?? {}) as Record<string, unknown>;
    emitRuntimeDebugEvent(debugHooks, ctx, {
      kind: 'state.mutation',
      actionType,
      scope,
      payload: { patch },
    });
    ctx.patchScopedState(scope, patch);
    finalize('builtin');
    return;
  }

  if (actionType === 'state.reset') {
    const data = args as Record<string, unknown>;
    const scope = (data.scope as LocalScope | undefined) ?? 'card';
    emitRuntimeDebugEvent(debugHooks, ctx, {
      kind: 'state.mutation',
      actionType,
      scope,
    });
    ctx.resetScopedState(scope);
    finalize('builtin');
    return;
  }

  const localHandler = resolveActionHandler(actionType, lookup);
  if (localHandler) {
    const result = localHandler(ctx, args);
    if (isPromiseLike(result)) {
      void result
        .then(() => finalize('local'))
        .catch((error) => {
          emitRuntimeDebugEvent(debugHooks, ctx, {
            kind: 'action.execute.error',
            actionType,
            payload: { args, error: String(error) },
          });
          finalize('local', { status: 'error' });
        });
      return;
    }
    finalize('local');
    return;
  }

  const hasSharedAction = Object.prototype.hasOwnProperty.call(sharedActions, actionType);
  const shared = hasSharedAction ? sharedActions[actionType] : undefined;
  if (shared) {
    const result = shared(ctx, args);
    if (isPromiseLike(result)) {
      void result
        .then(() => finalize('shared'))
        .catch((error) => {
          emitRuntimeDebugEvent(debugHooks, ctx, {
            kind: 'action.execute.error',
            actionType,
            payload: { args, error: String(error) },
          });
          finalize('shared', { status: 'error' });
        });
      return;
    }
    finalize('shared');
    return;
  }

  finalize('unhandled');
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
  debugHooks?: RuntimeDebugHooks,
) {
  const selectors = createSelectorResolver(rootState, ctx, lookup, sharedSelectors, debugHooks);
  emitRuntimeDebugEvent(debugHooks, ctx, {
    kind: 'command.resolveArgs.start',
    actionType: input.command.type,
    payload: { event: input.event },
  });
  const startedAt = Date.now();
  const resolvedArgs = resolveValueExpr(input.command.args, {
    state: rootState,
    params: ctx.params,
    event: input.event,
    selectors,
  });
  emitRuntimeDebugEvent(debugHooks, ctx, {
    kind: 'command.resolveArgs',
    actionType: input.command.type,
    durationMs: Date.now() - startedAt,
    payload: { resolvedArgs, event: input.event },
  });

  executeActionDescriptor(input.command, resolvedArgs, ctx, lookup, sharedActions, deps, debugHooks);
}

export type { RuntimeLookup };
