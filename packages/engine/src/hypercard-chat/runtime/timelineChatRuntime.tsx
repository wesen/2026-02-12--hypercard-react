import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { useEffect, useMemo } from 'react';
import type { SemRegistry } from '../sem/registry';
import type { SemEnvelope } from '../sem/types';
import type { TimelineEntity } from '../timeline/types';
import type { TimelineWidgetItem } from '../types';
import {
  type HypercardWidgetPackRenderContext,
  registerHypercardWidgetPack,
} from '../widgets/hypercardWidgetPack';
import type { ProjectionPipelineAdapter } from './projectionPipeline';
import { TimelineChatWindow, type TimelineChatWindowProps } from './TimelineChatWindow';
import {
  type ProjectedChatClientFactory,
  useProjectedChatConnection,
} from './useProjectedChatConnection';

export interface TimelineChatRuntimeHostActions {
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
  onEditCard?: (item: TimelineWidgetItem) => void;
  onEmitRawEnvelope?: (envelope: SemEnvelope) => void;
  onConnectionStatus?: (status: string) => void;
  onConnectionError?: (message: string) => void;
}

export type TimelineProjectionMode = 'all-events' | 'timeline-upsert-only';

export interface TimelineChatRuntimeWindowProps
  extends Omit<
    TimelineChatWindowProps,
    'isStreaming' | 'widgetNamespace' | 'widgetRenderContext' | 'timelineEntities' | 'debug'
  > {
  conversationId: string;
  dispatch: Dispatch<UnknownAction>;
  timelineEntities: TimelineEntity[];
  semRegistry: SemRegistry;
  createClient: ProjectedChatClientFactory;
  adapters?: ProjectionPipelineAdapter[];
  hostActions?: TimelineChatRuntimeHostActions;
  projectionMode?: TimelineProjectionMode;
  shouldProjectEnvelope?: (envelope: SemEnvelope) => boolean;
  widgetNamespace?: string;
  debug?: boolean;
}

function normalizeWidgetNamespace(widgetNamespace: string | undefined): string {
  const normalized = String(widgetNamespace ?? '').trim();
  if (normalized.length > 0) {
    return normalized;
  }
  return 'hypercard';
}

function isTimelineUpsertEnvelope(envelope: SemEnvelope): boolean {
  return envelope.event?.type === 'timeline.upsert';
}

export function TimelineChatRuntimeWindow({
  conversationId,
  dispatch,
  timelineEntities,
  semRegistry,
  createClient,
  adapters = [],
  hostActions,
  projectionMode = 'timeline-upsert-only',
  shouldProjectEnvelope,
  widgetNamespace,
  debug = false,
  onSend,
  title,
  subtitle,
  placeholder,
  suggestions,
  showSuggestionsAlways,
  headerActions,
  footer,
}: TimelineChatRuntimeWindowProps) {
  const namespace = useMemo(() => normalizeWidgetNamespace(widgetNamespace), [widgetNamespace]);

  useEffect(() => {
    // HC-56 hard cutover: widget/card renderer ownership is explicit and host-triggered.
    const registration = registerHypercardWidgetPack({ namespace });
    return () => {
      registration.unregister();
    };
  }, [namespace]);

  const effectiveShouldProjectEnvelope = useMemo(() => {
    return (envelope: SemEnvelope): boolean => {
      if (projectionMode === 'timeline-upsert-only' && !isTimelineUpsertEnvelope(envelope)) {
        return false;
      }
      if (shouldProjectEnvelope) {
        return shouldProjectEnvelope(envelope);
      }
      return true;
    };
  }, [projectionMode, shouldProjectEnvelope]);

  useProjectedChatConnection({
    conversationId,
    dispatch,
    semRegistry,
    adapters,
    createClient,
    onRawEnvelope: hostActions?.onEmitRawEnvelope,
    onStatus: hostActions?.onConnectionStatus,
    onError: hostActions?.onConnectionError,
    shouldProjectEnvelope: effectiveShouldProjectEnvelope,
  });

  const isStreaming = useMemo(
    () => timelineEntities.some((entity) => entity.kind === 'message' && entity.props.streaming === true),
    [timelineEntities],
  );

  const widgetRenderContext = useMemo<HypercardWidgetPackRenderContext>(
    () => ({
      debug,
      onOpenArtifact: hostActions?.onOpenArtifact,
      onEditCard: hostActions?.onEditCard,
    }),
    [debug, hostActions?.onEditCard, hostActions?.onOpenArtifact],
  );

  return (
    <TimelineChatWindow
      timelineEntities={timelineEntities}
      isStreaming={isStreaming}
      onSend={onSend}
      title={title}
      subtitle={subtitle}
      placeholder={placeholder}
      suggestions={suggestions}
      showSuggestionsAlways={showSuggestionsAlways}
      headerActions={headerActions}
      footer={footer}
      widgetNamespace={namespace}
      widgetRenderContext={widgetRenderContext}
      debug={debug}
    />
  );
}
