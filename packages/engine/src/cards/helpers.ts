import type {
  ActionDescriptor,
  ActionScope,
  CardStackDefinition,
  EvExpr,
  ParamExpr,
  SelExpr,
  SelectorScope,
  UINode,
  ValueExpr,
} from './types';

export function Sel(name: string, args?: ValueExpr, options?: { from?: SelectorScope }): SelExpr {
  return { $: 'sel', name, args, from: options?.from };
}

export function Param(name: string): ParamExpr {
  return { $: 'param', name };
}

export function Ev(name: string): EvExpr {
  return { $: 'event', name };
}

export function Act(type: string, args?: ValueExpr, options?: { to?: ActionScope }): ActionDescriptor {
  return { $: 'act', type, args, to: options?.to };
}

function node(t: string, props: Record<string, unknown> = {}): UINode {
  return { t, ...props };
}

export const ui = {
  node,
  screen: (props: Record<string, unknown>) => node('screen', props),
  toolbar: (props: Record<string, unknown>) => node('toolbar', props),
  row: (...children: UINode[]) => node('row', { children }),
  text: (value: ValueExpr, props: Record<string, unknown> = {}) => node('text', { value, ...props }),
  spacer: () => node('spacer'),
  button: (props: Record<string, unknown>) => node('button', props),
  iconButton: (props: Record<string, unknown>) => node('iconButton', props),
  select: (props: Record<string, unknown>) => node('select', props),
  input: (props: Record<string, unknown>) => node('input', props),
  table: (props: Record<string, unknown>) => node('table', props),
  kvTable: (props: Record<string, unknown>) => node('kvTable', props),
  form: (props: Record<string, unknown>) => node('form', props),
  field: (props: Record<string, unknown>) => node('field', props),
  money: (value: ValueExpr, props: Record<string, unknown> = {}) => node('money', { value, ...props }),

  // Higher-level convenience nodes for current examples during migration.
  menu: (props: Record<string, unknown>) => node('menu', props),
  list: (props: Record<string, unknown>) => node('list', props),
  detail: (props: Record<string, unknown>) => node('detail', props),
  report: (props: Record<string, unknown>) => node('report', props),
  chat: (props: Record<string, unknown>) => node('chat', props),
};

export function defineCardStack<TState>(stack: CardStackDefinition<TState>): CardStackDefinition<TState> {
  return stack;
}
