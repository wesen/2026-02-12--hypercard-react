import { fromJson } from '@bufbuild/protobuf';
import { type TimelineSnapshotV2, TimelineSnapshotV2Schema } from '../sem/pb/proto/sem/timeline/transport_pb';
import { handleSem, registerDefaultSemHandlers, type SemContext } from '../sem/semRegistry';
import { timelineEntityFromProto } from '../sem/timelineMapper';
import { chatSessionSlice, type ChatConnectionStatus } from '../state/chatSessionSlice';
import type { TimelineEntity } from '../state/timelineSlice';
import { timelineSlice } from '../state/timelineSlice';
import { isRecord } from '../utils/guards';

export interface ConnectArgs {
  convId: string;
  dispatch: SemContext['dispatch'];
  basePrefix?: string;
  onStatus?: (status: ChatConnectionStatus) => void;
  hydrate?: boolean;
  wsFactory?: (url: string) => WebSocket;
  fetchImpl?: typeof fetch;
  location?: { protocol: string; host: string };
}

type RawSemEnvelope = unknown;

function seqFromEnvelope(envelope: RawSemEnvelope): number | null {
  if (!isRecord(envelope) || !isRecord(envelope.event)) return null;
  const seq = envelope.event.seq;
  if (typeof seq === 'number' && Number.isFinite(seq)) return seq;
  return null;
}

function resolveBasePrefix(basePrefix?: string): string {
  return typeof basePrefix === 'string' ? basePrefix.replace(/\/$/, '') : '';
}

function resolveWsUrl(convId: string, basePrefix?: string, location?: { protocol: string; host: string }) {
  const fallbackLocation =
    typeof window !== 'undefined' && window.location
      ? { protocol: window.location.protocol, host: window.location.host }
      : { protocol: 'http:', host: 'localhost' };
  const source = location ?? fallbackLocation;
  const protocol = source.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${source.host}${resolveBasePrefix(basePrefix)}/ws?conv_id=${encodeURIComponent(convId)}`;
}

function timelineApiUrl(convId: string, basePrefix?: string) {
  return `${resolveBasePrefix(basePrefix)}/api/timeline?conv_id=${encodeURIComponent(convId)}`;
}

function applyTimelineSnapshot(
  convId: string,
  snapshot: TimelineSnapshotV2,
  dispatch: SemContext['dispatch']
) {
  const entities = snapshot.entities
    .map((entity) => timelineEntityFromProto(entity, snapshot.version))
    .filter((entity): entity is TimelineEntity => entity !== null);
  dispatch(timelineSlice.actions.applySnapshot({ convId, entities }));
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

class WsManager {
  private ws: WebSocket | null = null;
  private convId = '';
  private connectNonce = 0;
  private hydrated = false;
  private buffered: RawSemEnvelope[] = [];
  private lastOnStatus: ((status: ChatConnectionStatus) => void) | null = null;
  private lastDispatch: SemContext['dispatch'] | null = null;

  async connect(args: ConnectArgs) {
    if (this.ws && this.convId === args.convId) {
      if (args.hydrate !== false) {
        await this.ensureHydrated(args);
      }
      return;
    }

    this.disconnect();
    this.connectNonce += 1;
    const nonce = this.connectNonce;

    this.convId = args.convId;
    this.hydrated = false;
    this.buffered = [];
    this.lastOnStatus = args.onStatus ?? null;
    this.lastDispatch = args.dispatch;

    registerDefaultSemHandlers();
    args.dispatch(
      chatSessionSlice.actions.setConnectionStatus({
        convId: args.convId,
        status: 'connecting',
      })
    );
    args.onStatus?.('connecting');

    const wsFactory = args.wsFactory ?? ((url: string) => new WebSocket(url));
    const ws = wsFactory(resolveWsUrl(args.convId, args.basePrefix, args.location));
    this.ws = ws;

    let settleOpen: (() => void) | null = null;
    const openPromise = new Promise<void>((resolve) => {
      let settled = false;
      settleOpen = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      setTimeout(() => settleOpen?.(), 1500);
    });

    ws.onopen = () => {
      settleOpen?.();
      if (nonce !== this.connectNonce) return;
      args.dispatch(
        chatSessionSlice.actions.setConnectionStatus({
          convId: args.convId,
          status: 'connected',
        })
      );
      args.onStatus?.('connected');
    };

    ws.onclose = () => {
      settleOpen?.();
      if (nonce !== this.connectNonce) return;
      args.dispatch(
        chatSessionSlice.actions.setConnectionStatus({
          convId: args.convId,
          status: 'closed',
        })
      );
      args.onStatus?.('closed');
    };

    ws.onerror = () => {
      settleOpen?.();
      if (nonce !== this.connectNonce) return;
      args.dispatch(
        chatSessionSlice.actions.setConnectionStatus({
          convId: args.convId,
          status: 'error',
        })
      );
      args.dispatch(
        chatSessionSlice.actions.setStreamError({
          convId: args.convId,
          error: 'websocket error',
        })
      );
      args.onStatus?.('error');
    };

    ws.onmessage = (message) => {
      if (nonce !== this.connectNonce) return;

      try {
        const payload = JSON.parse(String(message.data));
        if (!this.hydrated) {
          this.buffered.push(payload);
          return;
        }

        handleSem(payload, {
          dispatch: args.dispatch,
          convId: args.convId,
        });
      } catch (error) {
        args.dispatch(
          chatSessionSlice.actions.setStreamError({
            convId: args.convId,
            error: toErrorMessage(error, 'malformed websocket frame'),
          })
        );
      }
    };

    await openPromise;
    if (nonce !== this.connectNonce) return;

    if (args.hydrate === false) {
      this.hydrated = true;
      return;
    }

    await this.hydrate(args, nonce);
  }

  disconnect() {
    this.connectNonce += 1;

    if (this.convId && this.lastDispatch) {
      this.lastDispatch(
        chatSessionSlice.actions.setConnectionStatus({
          convId: this.convId,
          status: 'closed',
        })
      );
    }

    this.lastOnStatus?.('closed');

    try {
      this.ws?.close();
    } catch {
      // no-op
    }

    this.ws = null;
    this.convId = '';
    this.hydrated = false;
    this.buffered = [];
    this.lastOnStatus = null;
    this.lastDispatch = null;
  }

  async ensureHydrated(args: ConnectArgs) {
    if (!args.convId) return;
    if (!this.ws || this.convId !== args.convId) return;
    if (this.hydrated) return;

    await this.hydrate(args, this.connectNonce);
  }

  private async hydrate(args: ConnectArgs, nonce: number) {
    if (this.hydrated) return;
    if (nonce !== this.connectNonce) return;

    args.dispatch(timelineSlice.actions.clearConversation({ convId: args.convId }));

    const fetchImpl = args.fetchImpl ?? fetch;
    try {
      const response = await fetchImpl(timelineApiUrl(args.convId, args.basePrefix));
      if (response.ok) {
        const parsed = await response.json();
        if (nonce !== this.connectNonce) return;
        if (isRecord(parsed)) {
          const snapshot = fromJson(TimelineSnapshotV2Schema, parsed as any, {
            ignoreUnknownFields: true,
          });
          applyTimelineSnapshot(args.convId, snapshot, args.dispatch);
        }
      } else {
        args.dispatch(
          chatSessionSlice.actions.setStreamError({
            convId: args.convId,
            error: `timeline request failed (${response.status})`,
          })
        );
      }
    } catch (error) {
      args.dispatch(
        chatSessionSlice.actions.setStreamError({
          convId: args.convId,
          error: toErrorMessage(error, 'timeline hydrate failed'),
        })
      );
    }

    if (nonce !== this.connectNonce) return;

    this.hydrated = true;
    const buffered = this.buffered;
    this.buffered = [];

    buffered.sort((a, b) => (seqFromEnvelope(a) ?? 0) - (seqFromEnvelope(b) ?? 0));
    let lastSeq = 0;
    for (const frame of buffered) {
      const seq = seqFromEnvelope(frame);
      if (seq && lastSeq && seq <= lastSeq) continue;
      if (seq) {
        lastSeq = seq;
      }
      handleSem(frame, {
        dispatch: args.dispatch,
        convId: args.convId,
      });
    }
  }
}

export { WsManager };
export const wsManager = new WsManager();
