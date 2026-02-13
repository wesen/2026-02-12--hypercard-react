// ── Chat API types ──

export interface ChatCompletionRequest {
  conversationId: string;
  messages: Array<{ role: string; text: string }>;
  model?: string;
}

export interface ChatCompletionResponse {
  conversationId: string;
  messageId: string;
  streamUrl: string;
}

export interface StreamToken {
  type: 'token' | 'done' | 'error';
  content?: string;
  error?: string;
  actions?: Array<{ label: string; action: unknown }>;
}

// ── API client ──

const DEFAULT_BASE = '';

export async function startCompletion(
  request: ChatCompletionRequest,
  baseUrl = DEFAULT_BASE,
): Promise<ChatCompletionResponse> {
  const res = await fetch(`${baseUrl}/api/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export type StreamHandlers = {
  onToken: (token: string) => void;
  onDone: (data: { actions?: StreamToken['actions'] }) => void;
  onError: (error: string) => void;
};

/**
 * Connect to a streaming WebSocket and dispatch tokens.
 * Returns a cleanup function to close the connection.
 */
export function connectStream(streamUrl: string, handlers: StreamHandlers): () => void {
  const ws = new WebSocket(streamUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as StreamToken;
      switch (data.type) {
        case 'token':
          if (data.content) handlers.onToken(data.content);
          break;
        case 'done':
          handlers.onDone({ actions: data.actions });
          ws.close();
          break;
        case 'error':
          handlers.onError(data.error ?? 'Unknown stream error');
          ws.close();
          break;
      }
    } catch {
      // ignore malformed frames
    }
  };

  ws.onerror = () => {
    handlers.onError('WebSocket connection error');
  };

  ws.onclose = () => {
    // natural close, no action needed
  };

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}
