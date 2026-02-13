export type LocalScope = 'card' | 'cardType' | 'background' | 'stack' | 'global';
export type SelectorScope = LocalScope | 'shared' | 'auto';
export type ActionScope = LocalScope | 'shared' | 'auto';

export type PrimitiveExpr = null | boolean | number | string;

export type ValueExpr = PrimitiveExpr | ValueExpr[] | { [k: string]: ValueExpr } | SelExpr | ParamExpr | EvExpr;

export interface SelExpr {
  $: 'sel';
  name: string;
  args?: ValueExpr;
  from?: SelectorScope;
}

export interface ParamExpr {
  $: 'param';
  name: string;
}

export interface EvExpr {
  $: 'event';
  name: string;
}

export interface ActionDescriptor {
  $: 'act';
  type: string;
  args?: ValueExpr;
  to?: ActionScope;
}

export interface UINode {
  t: string;
  key?: string;
  children?: UINode[];
  [prop: string]: unknown;
}

export type CardBindings = Record<string, Record<string, ActionDescriptor>>;

export interface CardScopedState {
  global?: Record<string, unknown>;
  stack?: Record<string, unknown>;
  background?: Record<string, unknown>;
  cardType?: Record<string, unknown>;
  card?: Record<string, unknown>;
}

export interface CardContext<TRootState = unknown> {
  stackId: string;
  cardId: string;
  cardType: string;
  backgroundId?: string;
  mode: 'interactive' | 'preview';
  params: Record<string, string>;
  getState: () => TRootState;
  dispatch: (action: unknown) => unknown;
  nav: {
    go: (card: string, param?: string) => void;
    back: () => void;
  };
  getScopedState: (scope: LocalScope) => Record<string, unknown>;
  getMergedScopedState: () => Record<string, unknown>;
  setScopedState: (scope: LocalScope, path: string, value: unknown) => void;
  patchScopedState: (scope: LocalScope, patch: Record<string, unknown>) => void;
  resetScopedState: (scope: LocalScope) => void;
}

export type CardSelectorFn<TRootState = unknown> = (
  state: TRootState,
  args: unknown,
  ctx: CardContext<TRootState>,
) => unknown;

export type CardActionHandler<TRootState = unknown> = (
  ctx: CardContext<TRootState>,
  args: unknown,
) => void | Promise<void>;

export type ScopeSelectorRegistry<TRootState = unknown> = Partial<
  Record<LocalScope, Record<string, CardSelectorFn<TRootState>>>
>;

export type ScopeActionRegistry<TRootState = unknown> = Partial<
  Record<LocalScope, Record<string, CardActionHandler<TRootState>>>
>;

export type SharedSelectorRegistry<TRootState = unknown> = Record<string, CardSelectorFn<TRootState>>;

export type SharedActionRegistry<TRootState = unknown> = Record<string, CardActionHandler<TRootState>>;

export interface CardDefinition<TRootState = unknown> {
  id: string;
  type: string;
  title?: string;
  icon?: string;
  backgroundId?: string;
  state?: {
    initial?: Record<string, unknown>;
  };
  ui: UINode;
  bindings?: CardBindings;
  selectors?: Record<string, CardSelectorFn<TRootState>>;
  actions?: Record<string, CardActionHandler<TRootState>>;
  meta?: Record<string, unknown>;
}

export interface BackgroundDefinition<TRootState = unknown> {
  id: string;
  state?: Record<string, unknown>;
  selectors?: Record<string, CardSelectorFn<TRootState>>;
  actions?: Record<string, CardActionHandler<TRootState>>;
}

export interface CardTypeDefinition<TRootState = unknown> {
  type: string;
  state?: Record<string, unknown>;
  selectors?: Record<string, CardSelectorFn<TRootState>>;
  actions?: Record<string, CardActionHandler<TRootState>>;
}

export interface CardStackDefinition<TRootState = unknown> {
  id: string;
  name: string;
  icon: string;
  homeCard: string;
  global?: {
    state?: Record<string, unknown>;
    selectors?: Record<string, CardSelectorFn<TRootState>>;
    actions?: Record<string, CardActionHandler<TRootState>>;
  };
  stack?: {
    state?: Record<string, unknown>;
    selectors?: Record<string, CardSelectorFn<TRootState>>;
    actions?: Record<string, CardActionHandler<TRootState>>;
  };
  backgrounds?: Record<string, BackgroundDefinition<TRootState>>;
  cardTypes?: Record<string, CardTypeDefinition<TRootState>>;
  cards: Record<string, CardDefinition<TRootState>>;
}

export interface ResolveValueContext<TRootState = unknown> {
  state: TRootState;
  params: Record<string, string>;
  event?: {
    name: string;
    payload: unknown;
  };
  selectors: {
    resolve: (name: string, from: SelectorScope | undefined, args: unknown) => unknown;
  };
}
