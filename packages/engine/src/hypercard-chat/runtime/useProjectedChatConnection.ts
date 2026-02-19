import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { useEffect, useRef } from 'react';
import type { SemRegistry } from '../sem/registry';
import type { SemEnvelope } from '../sem/types';
import { type ProjectionPipelineAdapter, projectSemEnvelope } from './projectionPipeline';

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
  adapters = [],
  createClient,
  onRawEnvelope,
  onStatus,
  onError,
}: UseProjectedChatConnectionInput): void {
  const clientRef = useRef<ProjectedChatClient | null>(null);
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
    const client = createClient({
      onRawEnvelope: (envelope) => {
        callbacksRef.current.onRawEnvelope?.(envelope);
      },
      onEnvelope: (envelope) => {
        projectSemEnvelope({
          conversationId,
          dispatch,
          semRegistry,
          envelope,
          adapters: callbacksRef.current.adapters,
        });
      },
      onStatus: (status) => {
        callbacksRef.current.onStatus?.(status);
      },
      onError: (error) => {
        callbacksRef.current.onError?.(error);
      },
    });
    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [
    conversationId,
    createClient,
    dispatch,
    semRegistry,
  ]);
}
