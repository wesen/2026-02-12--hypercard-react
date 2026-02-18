export interface SemEventEnvelope {
  sem?: boolean;
  event?: {
    type?: string;
    id?: string;
    data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    seq?: number | string;
    stream_id?: string;
  };
}

export interface TimelineEntityRecord {
  id?: string;
  kind?: string;
  createdAtMs?: string;
  updatedAtMs?: string;
  [key: string]: unknown;
}

export interface TimelineSnapshot {
  convId?: string;
  version?: string;
  serverTimeMs?: string;
  entities: TimelineEntityRecord[];
}

export interface InventoryWebChatClientHandlers {
  onRawEnvelope?: (envelope: SemEventEnvelope) => void;
  onEnvelope: (envelope: SemEventEnvelope) => void;
  onSnapshot?: (snapshot: TimelineSnapshot) => void;
  onStatus?: (status: 'connecting' | 'connected' | 'closed' | 'error') => void;
  onError?: (error: string) => void;
}

export interface InventoryWebChatClientOptions {
  hydrate?: boolean;
}

const CONVERSATION_STORAGE_KEY = 'inventory.webchat.conv_id';

function normalizeRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeArray<T>(value: unknown, mapItem: (item: unknown) => T | undefined): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: T[] = [];
  for (const item of value) {
    const mapped = mapItem(item);
    if (mapped !== undefined) {
      out.push(mapped);
    }
  }
  return out;
}

export function getOrCreateConversationId(): string {
  const fallback = `inv-${Date.now()}`;

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const fromStorage = window.localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (typeof fromStorage === 'string' && fromStorage.trim().length > 0) {
      return fromStorage;
    }
  } catch {
    // Ignore storage errors and continue with a generated ID.
  }

  const generated = typeof window.crypto?.randomUUID === 'function' ? window.crypto.randomUUID() : fallback;

  try {
    window.localStorage.setItem(CONVERSATION_STORAGE_KEY, generated);
  } catch {
    // Ignore storage errors.
  }

  return generated;
}

function websocketUrlForConversation(conversationId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const encoded = encodeURIComponent(conversationId);
  return `${protocol}://${window.location.host}/ws?conv_id=${encoded}`;
}

function eventSeq(envelope: SemEventEnvelope): bigint | undefined {
  const raw = envelope.event?.seq;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return BigInt(Math.trunc(raw));
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return BigInt(raw);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function eventStreamId(envelope: SemEventEnvelope): string | undefined {
  const streamId = envelope.event?.stream_id;
  return typeof streamId === 'string' && streamId.trim() ? streamId : undefined;
}

function compareBufferedOrder(a: SemEventEnvelope, b: SemEventEnvelope): number {
  const as = eventStreamId(a);
  const bs = eventStreamId(b);
  if (as && bs) {
    if (as < bs) return -1;
    if (as > bs) return 1;
  }

  const aq = eventSeq(a);
  const bq = eventSeq(b);
  if (aq !== undefined && bq !== undefined) {
    if (aq < bq) return -1;
    if (aq > bq) return 1;
  }
  if (aq !== undefined && bq === undefined) return -1;
  if (aq === undefined && bq !== undefined) return 1;
  return 0;
}

export function sortBufferedEnvelopes(envelopes: SemEventEnvelope[]): SemEventEnvelope[] {
  return [...envelopes].sort(compareBufferedOrder);
}

function normalizeEnvelope(raw: unknown): SemEventEnvelope {
  const envelope = normalizeRecord(raw) as SemEventEnvelope;
  const event = normalizeRecord(envelope.event);
  const seq = event.seq;
  const streamId = event.stream_id;

  envelope.event = {
    type: typeof event.type === 'string' ? event.type : undefined,
    id: typeof event.id === 'string' ? event.id : undefined,
    data: normalizeRecord(event.data),
    metadata: normalizeRecord(event.metadata),
    seq: typeof seq === 'number' || typeof seq === 'string' ? seq : undefined,
    stream_id: typeof streamId === 'string' ? streamId : undefined,
  };

  return envelope;
}

export class InventoryWebChatClient {
  private readonly conversationId: string;
  private readonly handlers: InventoryWebChatClientHandlers;
  private readonly options: InventoryWebChatClientOptions;
  private ws: WebSocket | null = null;
  private hydrated: boolean;
  private hydrationStarted = false;
  private buffered: SemEventEnvelope[] = [];

  constructor(
    conversationId: string,
    handlers: InventoryWebChatClientHandlers,
    options: InventoryWebChatClientOptions = {},
  ) {
    this.conversationId = conversationId;
    this.handlers = handlers;
    this.options = options;
    this.hydrated = options.hydrate === false;
  }

  connect() {
    if (this.ws) {
      return;
    }

    this.handlers.onStatus?.('connecting');

    const ws = new WebSocket(websocketUrlForConversation(this.conversationId));
    this.ws = ws;

    ws.onopen = () => {
      this.handlers.onStatus?.('connected');
      if (!this.hydrated) {
        void this.hydrateAndReplay();
      }
    };

    ws.onclose = () => {
      this.handlers.onStatus?.('closed');
      this.ws = null;
    };

    ws.onerror = () => {
      this.handlers.onStatus?.('error');
      this.handlers.onError?.('websocket error');
    };

    ws.onmessage = (event) => {
      try {
        const envelope = normalizeEnvelope(JSON.parse(String(event.data)));
        this.handlers.onRawEnvelope?.(envelope);

        if (!this.hydrated) {
          this.buffered.push(envelope);
          return;
        }

        this.handlers.onEnvelope(envelope);
      } catch {
        this.handlers.onError?.('malformed websocket frame');
      }
    };
  }

  private async hydrateAndReplay(): Promise<void> {
    if (this.hydrationStarted) {
      return;
    }
    this.hydrationStarted = true;

    try {
      const snapshot = await fetchTimelineSnapshot(this.conversationId);
      this.handlers.onSnapshot?.(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'timeline bootstrap failed';
      this.handlers.onError?.(message);
    }

    this.hydrated = true;

    const replay = sortBufferedEnvelopes(this.buffered);
    this.buffered = [];
    for (const envelope of replay) {
      this.handlers.onEnvelope(envelope);
    }
  }

  close() {
    if (!this.ws) {
      return;
    }

    const socket = this.ws;
    this.ws = null;

    try {
      socket.close();
    } catch {
      // Ignore close failures.
    }
  }
}

export async function submitPrompt(prompt: string, conversationId: string): Promise<void> {
  const response = await fetch('/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      conv_id: conversationId,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `chat request failed (${response.status})`);
  }
}

export async function fetchTimelineSnapshot(conversationId: string): Promise<TimelineSnapshot> {
  const encoded = encodeURIComponent(conversationId);
  const response = await fetch(`/api/timeline?conv_id=${encoded}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `timeline request failed (${response.status})`);
  }

  const raw = normalizeRecord(await response.json());
  return {
    convId: typeof raw.convId === 'string' ? raw.convId : undefined,
    version: typeof raw.version === 'string' ? raw.version : undefined,
    serverTimeMs: typeof raw.serverTimeMs === 'string' ? raw.serverTimeMs : undefined,
    entities: normalizeArray(raw.entities, (item) => {
      const record = normalizeRecord(item);
      return {
        ...record,
        id: typeof record.id === 'string' ? record.id : undefined,
        kind: typeof record.kind === 'string' ? record.kind : undefined,
        createdAtMs: typeof record.createdAtMs === 'string' ? record.createdAtMs : undefined,
        updatedAtMs: typeof record.updatedAtMs === 'string' ? record.updatedAtMs : undefined,
      } as TimelineEntityRecord;
    }),
  };
}
