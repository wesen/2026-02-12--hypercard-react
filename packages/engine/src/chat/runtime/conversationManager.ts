import type { ChatConnectionStatus } from '../state/chatSessionSlice';
import { fetchTimelineSnapshot, submitPrompt } from './http';
import { WsManager } from '../ws/wsManager';

export interface ConversationConnectArgs {
  convId: string;
  dispatch: (action: unknown) => unknown;
  basePrefix?: string;
  onStatus?: (status: ChatConnectionStatus) => void;
  hydrate?: boolean;
}

interface ConversationSession {
  refs: number;
  ws: WsManager;
  args: ConversationConnectArgs;
}

export class ConversationManager {
  private readonly sessions = new Map<string, ConversationSession>();

  async connect(args: ConversationConnectArgs): Promise<void> {
    const existing = this.sessions.get(args.convId);
    if (existing) {
      existing.refs += 1;
      existing.args = args;
      await existing.ws.connect({
        convId: args.convId,
        dispatch: args.dispatch,
        basePrefix: args.basePrefix,
        onStatus: args.onStatus,
        hydrate: args.hydrate,
      });
      return;
    }

    const ws = new WsManager();
    this.sessions.set(args.convId, {
      refs: 1,
      ws,
      args,
    });

    await ws.connect({
      convId: args.convId,
      dispatch: args.dispatch,
      basePrefix: args.basePrefix,
      onStatus: args.onStatus,
      hydrate: args.hydrate,
    });
  }

  disconnect(convId: string): void {
    const session = this.sessions.get(convId);
    if (!session) return;

    session.refs -= 1;
    if (session.refs > 0) return;

    session.ws.disconnect();
    this.sessions.delete(convId);
  }

  async send(prompt: string, convId: string, basePrefix = ''): Promise<void> {
    await submitPrompt(prompt, convId, basePrefix);
  }

  async fetchSnapshot(convId: string, basePrefix = ''): Promise<unknown> {
    return fetchTimelineSnapshot(convId, basePrefix);
  }

  getActiveConversationIds(): string[] {
    return Array.from(this.sessions.keys());
  }
}

export const conversationManager = new ConversationManager();
