import type { DSLAction } from '../dsl/types';
import { showToast } from '../features/notifications/notificationsSlice';
import type { DomainActionHandler } from '../app/dispatchDSLAction';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDispatch = (action: any) => any;

export interface ActionRegistryContext<TPayload> {
  dispatch: AnyDispatch;
  action: DSLAction;
  payload: TPayload;
}

export interface ActionRegistryEntry<TPayload> {
  actionCreator: (payload: TPayload) => unknown;
  mapPayload?: (action: DSLAction) => TPayload;
  toast?: string | ((payload: TPayload, action: DSLAction) => string | undefined);
  effect?: (ctx: ActionRegistryContext<TPayload>) => void;
}

export type ActionRegistry = Record<string, ActionRegistryEntry<unknown>>;

export function defineActionRegistry<T extends ActionRegistry>(registry: T): T {
  return registry;
}

export function createDomainActionHandler<T extends ActionRegistry>(registry: T): DomainActionHandler {
  const handler: DomainActionHandler = (action, dispatch) => {
    const entry = registry[action.type];
    if (!entry) return false;

    const payload = entry.mapPayload
      ? entry.mapPayload(action)
      : (action as unknown);

    dispatch(entry.actionCreator(payload));

    if (entry.effect) {
      entry.effect({ dispatch, action, payload });
    }

    const toastMsg =
      typeof entry.toast === 'function'
        ? entry.toast(payload, action)
        : entry.toast;

    if (toastMsg) {
      dispatch(showToast(toastMsg));
    }

    return true;
  };

  return handler;
}
