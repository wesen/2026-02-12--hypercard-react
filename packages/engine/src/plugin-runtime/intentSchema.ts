import type { RuntimeIntent } from './contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateRuntimeIntent(value: unknown): RuntimeIntent {
  if (!isRecord(value)) {
    throw new Error('Runtime intent must be an object');
  }

  if (value.scope !== 'card' && value.scope !== 'session' && value.scope !== 'domain' && value.scope !== 'system') {
    throw new Error("Runtime intent scope must be one of: 'card', 'session', 'domain', 'system'");
  }

  if (value.scope === 'domain') {
    if (typeof value.domain !== 'string' || value.domain.length === 0) {
      throw new Error('Domain runtime intent must have a non-empty domain');
    }

    if (typeof value.actionType !== 'string' || value.actionType.length === 0) {
      throw new Error('Domain runtime intent actionType must be a non-empty string');
    }

    return {
      scope: 'domain',
      domain: value.domain,
      actionType: value.actionType,
      payload: value.payload,
    };
  }

  if (value.scope === 'system') {
    if (typeof value.command !== 'string' || value.command.length === 0) {
      throw new Error('System runtime intent command must be a non-empty string');
    }

    return {
      scope: 'system',
      command: value.command,
      payload: value.payload,
    };
  }

  if (typeof value.actionType !== 'string' || value.actionType.length === 0) {
    throw new Error('Card/session runtime intent actionType must be a non-empty string');
  }

  return {
    scope: value.scope,
    actionType: value.actionType,
    payload: value.payload,
  };
}

export function validateRuntimeIntents(value: unknown): RuntimeIntent[] {
  if (!Array.isArray(value)) {
    throw new Error('Runtime intents result must be an array');
  }

  return value.map((intent) => validateRuntimeIntent(intent));
}
