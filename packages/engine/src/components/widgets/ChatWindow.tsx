import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../types';
import { Btn } from './Btn';
import { Chip } from './Chip';

/* ── Inline-widget descriptor ────────────────────────────────────────── */

/**
 * A typed descriptor for a widget that should be rendered inline within
 * a chat message. The `type` field selects the widget component and
 * `props` are forwarded verbatim to that component.
 */
export interface InlineWidget {
  /** Unique id (used as React key) */
  id: string;
  /** Widget kind – the host decides which component to mount */
  type: string;
  /** Arbitrary props forwarded to the widget component */
  props: Record<string, unknown>;
  /** Optional label rendered above the widget */
  label?: string;
}

/* ── Content block ───────────────────────────────────────────────────── */

/**
 * A single piece of content inside a message.
 * Messages can mix free text with embedded widgets.
 */
export type ChatContentBlock =
  | { kind: 'text'; text: string }
  | { kind: 'widget'; widget: InlineWidget };

/* ── Extended message ────────────────────────────────────────────────── */

/**
 * Extends the base ChatMessage with optional structured content blocks.
 * When `content` is provided the renderer uses it instead of `text`.
 */
export interface ChatWindowMessage extends ChatMessage {
  content?: ChatContentBlock[];
}

/* ── Component props ─────────────────────────────────────────────────── */

export interface ChatWindowProps {
  messages: ChatWindowMessage[];
  isStreaming: boolean;
  onSend: (text: string) => void;
  onCancel?: () => void;
  onAction?: (action: unknown) => void;
  suggestions?: string[];
  title?: string;
  subtitle?: string;
  placeholder?: string;
  /** Render an inline widget descriptor into a React tree */
  renderWidget?: (widget: InlineWidget) => ReactNode;
  /** Shown when the conversation is empty */
  welcomeContent?: ReactNode;
  /** Sticky footer below the composer */
  footer?: ReactNode;
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function StreamingCursor() {
  return (
    <span
      data-part="chat-window-cursor"
      style={{
        display: 'inline-block',
        width: 8,
        height: 14,
        background: 'var(--hc-color-link, #2e78ff)',
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        animation: 'hc-blink 0.8s step-end infinite',
      }}
    />
  );
}

function ThinkingDots() {
  return (
    <div data-part="chat-window-thinking">
      <span style={{ animation: 'hc-pulse 1.5s ease-in-out infinite' }}>Thinking…</span>
    </div>
  );
}

function WelcomeScreen({ children }: { children?: ReactNode }) {
  return (
    <div data-part="chat-window-welcome">
      {children ?? (
        <>
          <div data-part="chat-window-welcome-icon">💬</div>
          <div data-part="chat-window-welcome-title">How can I help?</div>
          <div data-part="chat-window-welcome-hint">
            Ask a question, request data, or try one of the suggestions below.
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

export function ChatWindow({
  messages,
  isStreaming,
  onSend,
  onCancel,
  onAction,
  suggestions,
  title = 'Chat',
  subtitle,
  placeholder,
  renderWidget,
  welcomeContent,
  footer,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages / streaming updates
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(text: string) {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setInput('');
  }

  const isEmpty = messages.length === 0;
  const showThinking =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].status === 'streaming' &&
    messages[messages.length - 1].text === '' &&
    !messages[messages.length - 1].content;

  /* ── Render a single content block ── */
  function renderBlock(block: ChatContentBlock, idx: number) {
    if (block.kind === 'text') {
      return (
        <div key={idx} style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
          {block.text}
        </div>
      );
    }
    // widget block
    const rendered = renderWidget?.(block.widget);
    if (!rendered) return null;
    return (
      <div key={block.widget.id} data-part="chat-window-widget-block">
        {block.widget.label && (
          <div data-part="chat-window-widget-label">{block.widget.label}</div>
        )}
        <div data-part="chat-window-widget-content">{rendered}</div>
      </div>
    );
  }

  /* ── Render message body ── */
  function renderBody(m: ChatWindowMessage) {
    // If structured content blocks exist, use those
    if (m.content && m.content.length > 0) {
      return (
        <>
          {m.content.map((block, idx) => renderBlock(block, idx))}
          {m.status === 'streaming' && m.text !== '' && <StreamingCursor />}
        </>
      );
    }
    // Fallback: plain text rendering (matches ChatView)
    return (
      <>
        <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
          {m.text}
          {m.status === 'streaming' && m.text !== '' && <StreamingCursor />}
        </div>
      </>
    );
  }

  /* ── Role label (matches ChatView) ── */
  function roleLabel(role: string) {
    if (role === 'user') return 'You:';
    if (role === 'system') return 'System:';
    return 'AI:';
  }

  /* ── Render a message ── */
  function renderMessage(m: ChatWindowMessage, i: number) {
    // Show thinking indicator for empty streaming message
    if (m.status === 'streaming' && m.text === '' && !m.content && showThinking) {
      return (
        <div key={m.id ?? i} data-part="chat-message" data-role="ai">
          <div data-part="chat-role">AI:</div>
          <ThinkingDots />
        </div>
      );
    }

    return (
      <div key={m.id ?? i} data-part="chat-message" data-role={m.role}>
        <div data-part="chat-role">{roleLabel(m.role)}</div>
        {renderBody(m)}
        {m.status === 'error' && (
          <div data-part="chat-window-error">⚠️ An error occurred</div>
        )}
        {m.actions && m.status !== 'streaming' && (
          <div style={{ marginTop: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {m.actions.map((a, j) => (
              <Chip key={j} onClick={() => onAction?.(a.action)}>
                {a.label}
              </Chip>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-part="chat-window">
      {/* ── Header ── */}
      <div data-part="chat-window-header">
        <div data-part="chat-window-header-left">
          <span data-part="chat-window-title">💬 {title}</span>
          {subtitle && (
            <span data-part="chat-window-subtitle">{subtitle}</span>
          )}
        </div>
        <div data-part="chat-window-header-right">
          <span data-part="chat-window-msg-count">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          {isStreaming && onCancel && (
            <Btn onClick={onCancel}>⏹ Stop</Btn>
          )}
        </div>
      </div>

      {/* ── Timeline (reuses chat-timeline styling) ── */}
      <div data-part="chat-timeline" ref={timelineRef}>
        {isEmpty && <WelcomeScreen>{welcomeContent}</WelcomeScreen>}
        {messages.map((m, i) => renderMessage(m, i))}
        <div ref={endRef} />
      </div>

      {/* ── Suggestions ── */}
      {(isEmpty || messages.length <= 1) && suggestions && !isStreaming && (
        <div data-part="chat-suggestions">
          {suggestions.map((s) => (
            <Chip key={s} onClick={() => send(s)}>
              {s}
            </Chip>
          ))}
        </div>
      )}

      {/* ── Composer ── */}
      <div data-part="chat-composer">
        <input
          data-part="field-input"
          style={{ flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder={
            isStreaming
              ? 'Waiting for response…'
              : (placeholder ?? 'Type a message…')
          }
          disabled={isStreaming}
        />
        {isStreaming ? (
          onCancel ? (
            <Btn onClick={onCancel}>⏹ Stop</Btn>
          ) : null
        ) : (
          <Btn onClick={() => send(input)}>Send</Btn>
        )}
      </div>

      {/* ── Footer ── */}
      {footer && <div data-part="chat-window-footer">{footer}</div>}
    </div>
  );
}
