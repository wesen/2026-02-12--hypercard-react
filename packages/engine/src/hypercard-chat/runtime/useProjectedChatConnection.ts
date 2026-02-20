import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { useEffect, useRef } from 'react';
import { createConversationRuntime } from '../conversation/runtime';
import type { ConversationRuntime } from '../conversation/types';
import type { SemRegistry } from '../sem/registry';
import type { SemEnvelope } from '../sem/types';
import { type ProjectionPipelineAdapter } from './projectionPipeline';

export interface ProjectedChatConnectionStatus {
  status: string;
}

export interface ProjectedChatClientHandlers {
  onRawEnvelope?: (envelope: SemEnvelope) => void;
  onEnvelope: (envelope: SemEnvelope) => void;
  onStatus?: (status: string) => void;
  onError?: (error: string) => void;
}

export interface ProjectedChatClient {
  connect: () => void;
  close: () => void;
}

export type ProjectedChatClientFactory = (handlers: ProjectedChatClientHandlers) => ProjectedChatClient;

export interface UseProjectedChatConnectionInput {
  conversationId: string;
  dispatch: Dispatch<UnknownAction>;
  semRegistry: SemRegistry;
  runtime?: ConversationRuntime;
  adapters?: ProjectionPipelineAdapter[];
  createClient: ProjectedChatClientFactory;
  onRawEnvelope?: (envelope: SemEnvelope) => void;
  onStatus?: (status: string) => void;
  onError?: (error: string) => void;
}

export function useProjectedChatConnection({
  conversationId,
  dispatch,
  semRegistry,
  runtime: providedRuntime,
  adapters = [],
  createClient,
  onRawEnvelope,
  onStatus,
  onError,
}: UseProjectedChatConnectionInput): void {
  const runtimeRef = useRef<ConversationRuntime | null>(null);
  const callbacksRef = useRef<{
    adapters: ProjectionPipelineAdapter[];
    onRawEnvelope?: (envelope: SemEnvelope) => void;
    onStatus?: (status: string) => void;
    onError?: (error: string) => void;
  }>({
    adapters,
    onRawEnvelope,
    onStatus,
    onError,
  });

  // Keep the latest callbacks without forcing socket teardown/reconnect
  // on every render when handler identities change.
  callbacksRef.current = {
    adapters,
    onRawEnvelope,
    onStatus,
    onError,
  };

  useEffect(() => {
    const ownsRuntime = !providedRuntime;
    const runtime =
      providedRuntime ??
      createConversationRuntime({
        conversationId,
        semRegistry,
        dispatch,
        createClient,
        getAdapters: () => callbacksRef.current.adapters,
        onRawEnvelope: (envelope) => {
          callbacksRef.current.onRawEnvelope?.(envelope);
        },
        onStatus: (status) => {
          callbacksRef.current.onStatus?.(status);
        },
        onError: (error) => {
          callbacksRef.current.onError?.(error);
        },
      });
    runtimeRef.current = runtime;
    const releaseConnection = runtime.claimConnection();

    return () => {
      releaseConnection();
      if (ownsRuntime) {
        runtime.dispose();
      }
      if (runtimeRef.current === runtime) {
        runtimeRef.current = null;
      }
    };
  }, [
    conversationId,
    createClient,
    dispatch,
    providedRuntime,
    semRegistry,
  ]);
}
