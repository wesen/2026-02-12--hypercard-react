import type { ConfirmRealtimeEvent } from '../types';
import { mapRealtimeEventFromProto } from '../proto/confirmProtoAdapter';

export interface ConfirmWsManagerOptions {
  wsUrl: string;
  onEvent: (event: ConfirmRealtimeEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  websocketFactory?: (url: string) => WebSocket;
}

export class ConfirmWsManager {
  private readonly options: ConfirmWsManagerOptions;
  private socket: WebSocket | null = null;

  constructor(options: ConfirmWsManagerOptions) {
    this.options = options;
  }

  connect() {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
      return;
    }

    const factory = this.options.websocketFactory ?? ((url) => new WebSocket(url));
    const socket = factory(this.options.wsUrl);

    socket.onopen = () => this.options.onOpen?.();
    socket.onclose = () => this.options.onClose?.();
    socket.onerror = () => this.options.onError?.(new Error('confirm-ws: socket error'));
    socket.onmessage = (message) => {
      try {
        const parsed = mapRealtimeEventFromProto(JSON.parse(String(message.data)));
        if (!parsed) {
          this.options.onError?.(new Error('confirm-ws: invalid realtime event payload'));
          return;
        }
        this.options.onEvent(parsed);
      } catch (error) {
        this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    this.socket = socket;
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }
}
