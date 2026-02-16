export interface BackendAction {
  label: string;
  action: Record<string, unknown>;
}

export interface BackendArtifact {
  kind: 'widget' | 'card-proposal';
  id: string;
  widgetType?: string;
  label?: string;
  props?: Record<string, unknown>;
  cardId?: string;
  title?: string;
  icon?: string;
  code?: string;
  dedupeKey?: string;
  version?: number;
  policy?: Record<string, unknown>;
}

export interface BackendMessageSnapshot {
  role: string;
  content: string;
  streaming: boolean;
  metadata?: Record<string, string>;
  artifacts?: BackendArtifact[];
  actions?: BackendAction[];
}

export interface BackendToolResultSnapshot {
  resultRaw: string;
  customKind?: string;
  toolCallId?: string;
}

export interface BackendTimelineEntity {
  id: string;
  kind: string;
  createdAt: number;
  updatedAt?: number;
  version?: number;
  message?: BackendMessageSnapshot;
  toolResult?: BackendToolResultSnapshot;
}

export interface BackendTimelineResponse {
  conversationId: string;
  version: number;
  entities: BackendTimelineEntity[];
}

export interface StartChatRequest {
  conversationId: string;
  prompt: string;
  overrides?: Record<string, unknown>;
}

export interface StartChatResponse {
  conversationId: string;
  status: string;
  sessionId?: string;
  turnId?: string;
  inferenceId?: string;
}

interface SEMEnvelope {
  sem: true;
  event: {
    type: string;
    id: string;
    seq?: number;
    data?: Record<string, unknown>;
  };
}

export interface StreamHandlers {
  onUpsert: (entity: BackendTimelineEntity) => void;
  onError: (error: string) => void;
}

export async function startChatTurn(
  request: StartChatRequest,
  baseUrl: string,
): Promise<StartChatResponse> {
  const res = await fetch(`${baseUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conv_id: request.conversationId,
      prompt: request.prompt,
      overrides: request.overrides,
    }),
  });

  if (!res.ok) {
    throw new Error(`Chat backend returned ${res.status} ${res.statusText}`);
  }

  const raw = (await res.json()) as unknown;
  if (!isRecord(raw)) {
    throw new Error('Chat response is not an object');
  }
  const conversationId =
    typeof raw.conv_id === 'string'
      ? raw.conv_id
      : typeof raw.conversationId === 'string'
        ? raw.conversationId
        : request.conversationId;
  const status = typeof raw.status === 'string' ? raw.status : 'started';
  return {
    conversationId,
    status,
    sessionId: typeof raw.session_id === 'string' ? raw.session_id : undefined,
    turnId: typeof raw.turn_id === 'string' ? raw.turn_id : undefined,
    inferenceId: typeof raw.inference_id === 'string' ? raw.inference_id : undefined,
  };
}

export async function fetchTimeline(
  conversationId: string,
  baseUrl: string,
): Promise<BackendTimelineResponse> {
  const url = new URL(`${baseUrl}/api/timeline`);
  url.searchParams.set('conv_id', conversationId || 'default');

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Timeline endpoint returned ${res.status} ${res.statusText}`);
  }

  const raw = (await res.json()) as unknown;
  return normalizeTimelineResponse(raw, conversationId || 'default');
}

export function connectConversationStream(
  conversationId: string,
  baseUrl: string,
  handlers: StreamHandlers,
): () => void {
  const wsUrl = buildWSURL(baseUrl, conversationId || 'default');
  const ws = new WebSocket(wsUrl);
  let opened = false;
  let reportedError = false;

  ws.onopen = () => {
    opened = true;
  };

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(String(event.data)) as unknown;
      if (!isSEMEnvelope(parsed)) {
        return;
      }
      if (parsed.event.type !== 'timeline.upsert') {
        return;
      }
      const data = parsed.event.data;
      if (!isRecord(data) || !isRecord(data.entity)) {
        return;
      }
      const entity = toTimelineEntity(data.entity, toNumber(data.version));
      if (!entity) {
        return;
      }
      handlers.onUpsert(entity);
    } catch {
      handlers.onError('Malformed stream frame from backend');
    }
  };

  ws.onerror = () => {
    if (!reportedError) {
      reportedError = true;
      handlers.onError('WebSocket connection error');
    }
  };

  ws.onclose = (event) => {
    if (!opened && !reportedError) {
      reportedError = true;
      handlers.onError(`WebSocket closed before open (${event.code})`);
    }
  };

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}

function normalizeTimelineResponse(raw: unknown, fallbackConversationId: string): BackendTimelineResponse {
  if (!isRecord(raw)) {
    throw new Error('Timeline response is not an object');
  }

  const conversationId =
    typeof raw.convId === 'string'
      ? raw.convId
      : typeof raw.conv_id === 'string'
        ? raw.conv_id
        : fallbackConversationId;
  const version = toNumber(raw.version) ?? 0;
  const entities = Array.isArray(raw.entities)
    ? raw.entities.map((entity) => toTimelineEntity(entity, version)).filter((v): v is BackendTimelineEntity => v !== null)
    : [];

  return {
    conversationId,
    version,
    entities,
  };
}

function toTimelineEntity(raw: unknown, version?: number): BackendTimelineEntity | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.kind !== 'string') {
    return null;
  }
  const message = toMessageSnapshot(raw.message);
  const toolResult = toToolResultSnapshot(raw.toolResult);

  return {
    id: raw.id,
    kind: raw.kind,
    createdAt: toNumber(raw.createdAtMs) ?? Date.now(),
    updatedAt: toNumber(raw.updatedAtMs) ?? undefined,
    version,
    message,
    toolResult,
  };
}

function toMessageSnapshot(raw: unknown): BackendMessageSnapshot | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const metadata = toStringMap(raw.metadata);
  return {
    role: typeof raw.role === 'string' ? raw.role : 'assistant',
    content: typeof raw.content === 'string' ? raw.content : '',
    streaming: raw.streaming === true,
    metadata,
    artifacts: parseArtifactsFromMetadata(metadata),
    actions: parseActionsFromMetadata(metadata),
  };
}

function toToolResultSnapshot(raw: unknown): BackendToolResultSnapshot | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  let resultRaw = typeof raw.resultRaw === 'string' ? raw.resultRaw : '';
  if (!resultRaw && isRecord(raw.result) && typeof raw.result.raw === 'string') {
    resultRaw = raw.result.raw;
  }
  return {
    resultRaw,
    customKind: typeof raw.customKind === 'string' ? raw.customKind : undefined,
    toolCallId: typeof raw.toolCallId === 'string' ? raw.toolCallId : undefined,
  };
}

function parseArtifactsFromMetadata(metadata: Record<string, string> | undefined): BackendArtifact[] | undefined {
  if (!metadata) {
    return undefined;
  }
  const raw =
    metadata.hypercard_artifacts ??
    metadata.hypercardArtifacts ??
    metadata.artifacts ??
    metadata.artifacts_json;
  if (!raw) {
    return undefined;
  }
  const parsed = safeJSONParse(raw);
  if (!Array.isArray(parsed)) {
    return undefined;
  }
  const artifacts = parsed.map(toArtifact).filter((v): v is BackendArtifact => v !== null);
  return artifacts.length > 0 ? artifacts : undefined;
}

function parseActionsFromMetadata(metadata: Record<string, string> | undefined): BackendAction[] | undefined {
  if (!metadata) {
    return undefined;
  }
  const raw =
    metadata.hypercard_actions ??
    metadata.hypercardActions ??
    metadata.actions ??
    metadata.actions_json;
  if (!raw) {
    return undefined;
  }
  const parsed = safeJSONParse(raw);
  if (!Array.isArray(parsed)) {
    return undefined;
  }
  const actions = parsed.map(toAction).filter((v): v is BackendAction => v !== null);
  return actions.length > 0 ? actions : undefined;
}

export function parseToolPayload(rawJSON: string): {
  summary: string;
  artifacts: BackendArtifact[];
  actions: BackendAction[];
} | null {
  const parsed = safeJSONParse(rawJSON);
  if (!isRecord(parsed)) {
    return null;
  }
  const summary = typeof parsed.summary === 'string' ? parsed.summary : '';
  const artifacts = Array.isArray(parsed.artifacts)
    ? parsed.artifacts.map(toArtifact).filter((v): v is BackendArtifact => v !== null)
    : [];
  const actions = Array.isArray(parsed.actions)
    ? parsed.actions.map(toAction).filter((v): v is BackendAction => v !== null)
    : [];
  if (!summary && artifacts.length === 0 && actions.length === 0) {
    return null;
  }
  return { summary, artifacts, actions };
}

function toAction(raw: unknown): BackendAction | null {
  if (!isRecord(raw) || typeof raw.label !== 'string' || !isRecord(raw.action)) {
    return null;
  }
  return {
    label: raw.label,
    action: raw.action,
  };
}

function toArtifact(raw: unknown): BackendArtifact | null {
  if (!isRecord(raw) || typeof raw.kind !== 'string' || typeof raw.id !== 'string') {
    return null;
  }
  if (raw.kind !== 'widget' && raw.kind !== 'card-proposal') {
    return null;
  }

  return {
    kind: raw.kind,
    id: raw.id,
    widgetType: typeof raw.widgetType === 'string' ? raw.widgetType : undefined,
    label: typeof raw.label === 'string' ? raw.label : undefined,
    props: isRecord(raw.props) ? raw.props : undefined,
    cardId: typeof raw.cardId === 'string' ? raw.cardId : undefined,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    icon: typeof raw.icon === 'string' ? raw.icon : undefined,
    code: typeof raw.code === 'string' ? raw.code : undefined,
    dedupeKey: typeof raw.dedupeKey === 'string' ? raw.dedupeKey : undefined,
    version: typeof raw.version === 'number' ? raw.version : undefined,
    policy: isRecord(raw.policy) ? raw.policy : undefined,
  };
}

function toStringMap(raw: unknown): Record<string, string> | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function buildWSURL(baseUrl: string, conversationId: string): string {
  const url = new URL(baseUrl);
  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsURL = new URL(`${wsProtocol}//${url.host}/ws`);
  wsURL.searchParams.set('conv_id', conversationId);
  return wsURL.toString();
}

function toNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    const n = Number(raw);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
}

function safeJSONParse(raw: string): unknown {
  if (!raw.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isSEMEnvelope(raw: unknown): raw is SEMEnvelope {
  return (
    isRecord(raw) &&
    raw.sem === true &&
    isRecord(raw.event) &&
    typeof raw.event.type === 'string' &&
    typeof raw.event.id === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
