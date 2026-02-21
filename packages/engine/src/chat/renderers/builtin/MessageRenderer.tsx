import type { RenderEntity } from '../types';

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

function roleLabel(role: string) {
  if (role === 'user') return 'You:';
  if (role === 'system') return 'System:';
  if (role === 'thinking') return 'AI Thinking:';
  return 'AI:';
}

export function MessageRenderer({ e }: { e: RenderEntity }) {
  const role = String(e.props.role ?? 'assistant');
  const content = String(e.props.content ?? '');
  const streaming = e.props.streaming === true;

  if (streaming && content.length === 0) {
    return (
      <div data-part="chat-message" data-role={role}>
        <div data-part="chat-role">{roleLabel(role)}</div>
        <ThinkingDots />
      </div>
    );
  }

  return (
    <div data-part="chat-message" data-role={role}>
      <div data-part="chat-role">{roleLabel(role)}</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        {content}
        {streaming && content.length > 0 && <StreamingCursor />}
      </div>
    </div>
  );
}
