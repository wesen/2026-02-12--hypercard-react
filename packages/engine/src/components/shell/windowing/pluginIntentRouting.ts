import { showToast } from '../../../features/notifications/notificationsSlice';
import { authorizeDomainIntent, authorizeSystemIntent } from '../../../features/pluginCardRuntime';
import { ingestRuntimeIntent } from '../../../features/pluginCardRuntime';
import { closeWindow, sessionNavBack, sessionNavGo } from '../../../desktop/core/state/windowingSlice';
import type { RuntimeIntent, SystemIntent } from '../../../plugin-runtime/contracts';
import type { CapabilityPolicy } from '../../../features/pluginCardRuntime';

interface DispatchLike {
  (action: unknown): unknown;
}

interface IntentDispatchContext {
  dispatch: DispatchLike;
  getState?: () => unknown;
  sessionId: string;
  cardId: string;
  windowId: string;
}

interface RuntimeStateLike {
  pluginCardRuntime?: {
    sessions?: Record<string, { capabilities?: CapabilityPolicy }>;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toSystemAction(intent: SystemIntent, context: IntentDispatchContext): unknown | null {
  if (intent.command === 'nav.back') {
    return sessionNavBack({ sessionId: context.sessionId });
  }

  if (intent.command === 'nav.go') {
    if (!isRecord(intent.payload)) {
      return null;
    }

    const card = intent.payload.cardId;
    if (typeof card !== 'string' || card.length === 0) {
      return null;
    }

    const param = typeof intent.payload.param === 'string' ? intent.payload.param : undefined;
    return sessionNavGo({ sessionId: context.sessionId, card, param });
  }

  if (intent.command === 'notify') {
    if (!isRecord(intent.payload)) {
      return null;
    }

    const message = intent.payload.message;
    if (typeof message !== 'string' || message.length === 0) {
      return null;
    }

    return showToast(message);
  }

  if (intent.command === 'window.close') {
    return closeWindow(context.windowId);
  }

  return null;
}

function toDomainAction(intent: Extract<RuntimeIntent, { scope: 'domain' }>, context: IntentDispatchContext) {
  return {
    type: `${intent.domain}/${intent.actionType}`,
    payload: intent.payload,
    meta: {
      source: 'plugin-runtime',
      sessionId: context.sessionId,
      cardId: context.cardId,
    },
  };
}

export function dispatchRuntimeIntent(intent: RuntimeIntent, context: IntentDispatchContext) {
  context.dispatch(
    ingestRuntimeIntent({
      sessionId: context.sessionId,
      cardId: context.cardId,
      intent,
    })
  );

  const runtimeSession = (context.getState?.() as RuntimeStateLike | undefined)?.pluginCardRuntime?.sessions?.[
    context.sessionId
  ];

  if (intent.scope === 'domain' && runtimeSession?.capabilities) {
    const decision = authorizeDomainIntent(runtimeSession.capabilities, intent.domain);
    if (!decision.allowed) {
      return;
    }
  }

  if (intent.scope === 'system' && runtimeSession?.capabilities) {
    const decision = authorizeSystemIntent(runtimeSession.capabilities, intent.command);
    if (!decision.allowed) {
      return;
    }
  }

  if (intent.scope === 'domain') {
    context.dispatch(toDomainAction(intent, context));
    return;
  }

  if (intent.scope === 'system') {
    const action = toSystemAction(intent, context);
    if (action) {
      context.dispatch(action);
    }
  }
}
