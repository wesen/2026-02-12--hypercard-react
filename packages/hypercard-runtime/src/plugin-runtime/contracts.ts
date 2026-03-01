import type { UINode } from './uiTypes';

export type StackId = string;
export type SessionId = string;
export type CardId = string;

export interface RuntimeErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface CardIntent {
  scope: 'card';
  actionType: string;
  payload?: unknown;
}

export interface SessionIntent {
  scope: 'session';
  actionType: string;
  payload?: unknown;
}

export interface DomainIntent {
  scope: 'domain';
  domain: string;
  actionType: string;
  payload?: unknown;
}

export interface SystemIntent {
  scope: 'system';
  command: string;
  payload?: unknown;
}

export type RuntimeIntent = CardIntent | SessionIntent | DomainIntent | SystemIntent;

export interface LoadedStackBundle {
  stackId: StackId;
  sessionId: SessionId;
  declaredId?: string;
  title: string;
  description?: string;
  initialSessionState?: unknown;
  initialCardState?: Record<string, unknown>;
  cards: string[];
}

export interface LoadStackBundleRequest {
  id: number;
  type: 'loadStackBundle';
  stackId: StackId;
  sessionId: SessionId;
  code: string;
}

export interface RenderCardRequest {
  id: number;
  type: 'renderCard';
  sessionId: SessionId;
  cardId: CardId;
  cardState: unknown;
  sessionState: unknown;
  globalState: unknown;
}

export interface EventCardRequest {
  id: number;
  type: 'eventCard';
  sessionId: SessionId;
  cardId: CardId;
  handler: string;
  args?: unknown;
  cardState: unknown;
  sessionState: unknown;
  globalState: unknown;
}

export interface DefineCardRequest {
  id: number;
  type: 'defineCard';
  sessionId: SessionId;
  cardId: CardId;
  code: string;
}

export interface DefineCardRenderRequest {
  id: number;
  type: 'defineCardRender';
  sessionId: SessionId;
  cardId: CardId;
  code: string;
}

export interface DefineCardHandlerRequest {
  id: number;
  type: 'defineCardHandler';
  sessionId: SessionId;
  cardId: CardId;
  handler: string;
  code: string;
}

export interface DisposeSessionRequest {
  id: number;
  type: 'disposeSession';
  sessionId: SessionId;
}

export interface HealthRequest {
  id: number;
  type: 'health';
}

export type WorkerRequest =
  | LoadStackBundleRequest
  | RenderCardRequest
  | EventCardRequest
  | DefineCardRequest
  | DefineCardRenderRequest
  | DefineCardHandlerRequest
  | DisposeSessionRequest
  | HealthRequest;

export interface LoadStackBundleResult {
  bundle: LoadedStackBundle;
}

export interface RenderCardResult {
  tree: UINode;
}

export interface EventCardResult {
  intents: RuntimeIntent[];
}

export interface DefineCardResult {
  bundle: LoadedStackBundle;
}

export interface DisposeSessionResult {
  disposed: boolean;
}

export interface HealthResult {
  ready: true;
  sessions: string[];
}

export type WorkerResult =
  | LoadStackBundleResult
  | RenderCardResult
  | EventCardResult
  | DefineCardResult
  | DisposeSessionResult
  | HealthResult;

export interface WorkerSuccessResponse {
  id: number;
  ok: true;
  result: WorkerResult;
}

export interface WorkerErrorResponse {
  id: number;
  ok: false;
  error: RuntimeErrorPayload;
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;
