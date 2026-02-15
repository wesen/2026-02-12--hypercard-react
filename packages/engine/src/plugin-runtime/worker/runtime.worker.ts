/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from '../contracts';
import { QuickJSCardRuntimeService, toRuntimeError } from '../runtimeService';

const runtimeService = new QuickJSCardRuntimeService();

async function handleRequest(request: WorkerRequest) {
  switch (request.type) {
    case 'loadStackBundle':
      return {
        bundle: await runtimeService.loadStackBundle(request.stackId, request.sessionId, request.code),
      };

    case 'renderCard':
      return {
        tree: runtimeService.renderCard(
          request.sessionId,
          request.cardId,
          request.cardState,
          request.sessionState,
          request.globalState
        ),
      };

    case 'eventCard':
      return {
        intents: runtimeService.eventCard(
          request.sessionId,
          request.cardId,
          request.handler,
          request.args,
          request.cardState,
          request.sessionState,
          request.globalState
        ),
      };

    case 'defineCard':
      return {
        bundle: runtimeService.defineCard(request.sessionId, request.cardId, request.code),
      };

    case 'defineCardRender':
      return {
        bundle: runtimeService.defineCardRender(request.sessionId, request.cardId, request.code),
      };

    case 'defineCardHandler':
      return {
        bundle: runtimeService.defineCardHandler(request.sessionId, request.cardId, request.handler, request.code),
      };

    case 'disposeSession':
      return { disposed: runtimeService.disposeSession(request.sessionId) };

    case 'health':
      return runtimeService.health();

    default:
      throw new Error(`Unknown request type: ${(request as { type?: string }).type ?? 'unknown'}`);
  }
}

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    const result = await handleRequest(request);
    const response: WorkerResponse = {
      id: request.id,
      ok: true,
      result,
    };
    workerScope.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id: request.id,
      ok: false,
      error: toRuntimeError(error),
    };
    workerScope.postMessage(response);
  }
};

export {};
