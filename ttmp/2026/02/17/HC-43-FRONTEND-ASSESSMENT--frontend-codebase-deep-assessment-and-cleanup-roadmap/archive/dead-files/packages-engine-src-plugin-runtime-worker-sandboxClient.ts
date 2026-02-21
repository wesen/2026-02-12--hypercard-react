import type { UINode } from '../uiTypes';
import type {
  CardId,
  DefineCardHandlerRequest,
  DefineCardRenderRequest,
  DefineCardRequest,
  EventCardRequest,
  HealthRequest,
  HealthResult,
  LoadStackBundleRequest,
  LoadedStackBundle,
  RenderCardRequest,
  RuntimeErrorPayload,
  RuntimeIntent,
  SessionId,
  StackId,
  WorkerResponse,
} from '../contracts';
import type { DisposeSessionRequest } from '../contracts';

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: unknown) => void;
};

type RequestWithoutId =
  | Omit<LoadStackBundleRequest, 'id'>
  | Omit<RenderCardRequest, 'id'>
  | Omit<EventCardRequest, 'id'>
  | Omit<DefineCardRequest, 'id'>
  | Omit<DefineCardRenderRequest, 'id'>
  | Omit<DefineCardHandlerRequest, 'id'>
  | Omit<DisposeSessionRequest, 'id'>
  | Omit<HealthRequest, 'id'>;

function toError(error: RuntimeErrorPayload): Error {
  const prefixedCode = error.code ? `[${error.code}] ` : '';
  return new Error(`${prefixedCode}${error.message}`);
}

export class QuickJSCardSandboxClient {
  private worker: Worker;

  private nextId = 1;

  private readonly pending = new Map<number, PendingRequest>();

  constructor() {
    this.worker = new Worker(new URL('./runtime.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = this.handleWorkerMessage;
    this.worker.onerror = (event) => {
      const error = new Error(`QuickJS worker error: ${event.message}`);
      this.pending.forEach((pending) => pending.reject(error));
      this.pending.clear();
    };
  }

  private handleWorkerMessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const pending = this.pending.get(response.id);

    if (!pending) {
      return;
    }

    this.pending.delete(response.id);

    if (response.ok) {
      pending.resolve(response.result);
      return;
    }

    pending.reject(toError(response.error));
  };

  private postRequest<TResponse>(request: RequestWithoutId): Promise<TResponse> {
    const id = this.nextId++;
    const requestWithId = { id, ...request };

    return new Promise<TResponse>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(requestWithId);
    });
  }

  async loadStackBundle(stackId: StackId, sessionId: SessionId, code: string): Promise<LoadedStackBundle> {
    const result = await this.postRequest<{ bundle: LoadedStackBundle }>(
      {
        type: 'loadStackBundle',
        stackId,
        sessionId,
        code,
      } satisfies Omit<LoadStackBundleRequest, 'id'>
    );

    return result.bundle;
  }

  async renderCard(
    sessionId: SessionId,
    cardId: CardId,
    cardState: unknown,
    sessionState: unknown,
    globalState: unknown
  ): Promise<UINode> {
    const result = await this.postRequest<{ tree: UINode }>(
      {
        type: 'renderCard',
        sessionId,
        cardId,
        cardState,
        sessionState,
        globalState,
      } satisfies Omit<RenderCardRequest, 'id'>
    );

    return result.tree;
  }

  async eventCard(
    sessionId: SessionId,
    cardId: CardId,
    handler: string,
    args: unknown,
    cardState: unknown,
    sessionState: unknown,
    globalState: unknown
  ): Promise<RuntimeIntent[]> {
    const result = await this.postRequest<{ intents: RuntimeIntent[] }>(
      {
        type: 'eventCard',
        sessionId,
        cardId,
        handler,
        args,
        cardState,
        sessionState,
        globalState,
      } satisfies Omit<EventCardRequest, 'id'>
    );

    return result.intents;
  }

  async defineCard(sessionId: SessionId, cardId: CardId, code: string): Promise<LoadedStackBundle> {
    const result = await this.postRequest<{ bundle: LoadedStackBundle }>(
      {
        type: 'defineCard',
        sessionId,
        cardId,
        code,
      } satisfies Omit<DefineCardRequest, 'id'>
    );

    return result.bundle;
  }

  async defineCardRender(sessionId: SessionId, cardId: CardId, code: string): Promise<LoadedStackBundle> {
    const result = await this.postRequest<{ bundle: LoadedStackBundle }>(
      {
        type: 'defineCardRender',
        sessionId,
        cardId,
        code,
      } satisfies Omit<DefineCardRenderRequest, 'id'>
    );

    return result.bundle;
  }

  async defineCardHandler(
    sessionId: SessionId,
    cardId: CardId,
    handler: string,
    code: string
  ): Promise<LoadedStackBundle> {
    const result = await this.postRequest<{ bundle: LoadedStackBundle }>(
      {
        type: 'defineCardHandler',
        sessionId,
        cardId,
        handler,
        code,
      } satisfies Omit<DefineCardHandlerRequest, 'id'>
    );

    return result.bundle;
  }

  async disposeSession(sessionId: SessionId): Promise<boolean> {
    const result = await this.postRequest<{ disposed: boolean }>(
      {
        type: 'disposeSession',
        sessionId,
      } satisfies Omit<DisposeSessionRequest, 'id'>
    );

    return result.disposed;
  }

  async health(): Promise<HealthResult> {
    return this.postRequest<HealthResult>({ type: 'health' } satisfies Omit<HealthRequest, 'id'>);
  }

  terminate() {
    const error = new Error('QuickJS worker terminated');
    this.pending.forEach((pending) => pending.reject(error));
    this.pending.clear();
    this.worker.terminate();
  }
}

export const quickjsCardSandboxClient = new QuickJSCardSandboxClient();
