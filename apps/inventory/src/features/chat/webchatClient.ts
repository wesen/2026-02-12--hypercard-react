export interface SemEventEnvelope {
  sem?: boolean;
  event?: {
    type?: string;
    id?: string;
    data?: Record<string, unknown>;
  };
}

export interface InventoryWebChatClientHandlers {
  onEnvelope: (envelope: SemEventEnvelope) => void;
  onStatus?: (status: 'connecting' | 'connected' | 'closed' | 'error') => void;
  onError?: (error: string) => void;
}

const CONVERSATION_STORAGE_KEY = 'inventory.webchat.conv_id';

function normalizeRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
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

export class InventoryWebChatClient {
  private readonly conversationId: string;
  private readonly handlers: InventoryWebChatClientHandlers;
  private ws: WebSocket | null = null;

  constructor(conversationId: string, handlers: InventoryWebChatClientHandlers) {
    this.conversationId = conversationId;
    this.handlers = handlers;
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
        const parsed = JSON.parse(String(event.data));
        const envelope = normalizeRecord(parsed) as SemEventEnvelope;
        if (envelope.event) {
          envelope.event = normalizeRecord(envelope.event) as {
            type?: string;
            id?: string;
            data?: Record<string, unknown>;
          };
          envelope.event.data = normalizeRecord(envelope.event.data);
        }
        this.handlers.onEnvelope(envelope);
      } catch {
        this.handlers.onError?.('malformed websocket frame');
      }
    };
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
