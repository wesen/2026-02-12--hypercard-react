export type DomainDataSelector<TState, TValue extends unknown[] = unknown[]> =
  (state: TState) => TValue;

export type SelectorRegistry<TState> = Record<string, DomainDataSelector<TState, unknown[]>>;

export type DomainDataFromRegistry<TRegistry extends SelectorRegistry<any>> = {
  [K in keyof TRegistry]: ReturnType<TRegistry[K]>;
};

export function defineSelectorRegistry<TState, TRegistry extends SelectorRegistry<TState>>(
  registry: TRegistry,
): TRegistry {
  return registry;
}

export function selectDomainData<TState, TRegistry extends SelectorRegistry<TState>>(
  state: TState,
  registry: TRegistry,
): DomainDataFromRegistry<TRegistry> {
  const out = {} as DomainDataFromRegistry<TRegistry>;

  for (const key of Object.keys(registry) as Array<keyof TRegistry>) {
    out[key] = registry[key](state) as ReturnType<TRegistry[typeof key]>;
  }

  return out;
}
