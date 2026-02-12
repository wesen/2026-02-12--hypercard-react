import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { ChatMessage } from '../../types';
import { Btn } from './Btn';
import { Chip } from './Chip';

export interface ChatViewProps {
  messages: ChatMessage[];
  suggestions?: string[];
  onSend: (text: string) => void;
  onAction: (action: unknown) => void;
  renderResults?: (results: unknown[]) => ReactNode;
  placeholder?: string;
}

export function ChatView({
  messages,
  suggestions,
  onSend,
  onAction,
  renderResults,
  placeholder,
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(text: string) {
    if (!text.trim()) return;
    onSend(text.trim());
    setInput('');
  }

  return (
    <div data-part="chat-view" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div data-part="chat-timeline" style={{ flex: 1, overflow: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} data-part="chat-message" data-role={m.role} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 'bold' }}>
              {m.role === 'user' ? 'You:' : 'AI:'}
            </div>
            <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{m.text}</div>
            {m.results && m.results.length > 0 && renderResults && (
              <div style={{ marginTop: 3 }}>{renderResults(m.results)}</div>
            )}
            {m.actions && (
              <div style={{ marginTop: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {m.actions.map((a, j) => (
                  <Chip key={j} onClick={() => onAction(a.action)}>
                    {a.label}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {messages.length <= 1 && suggestions && (
        <div data-part="chat-suggestions">
          {suggestions.map((s) => (
            <Chip key={s} onClick={() => send(s)}>{s}</Chip>
          ))}
        </div>
      )}
      <div data-part="chat-composer">
        <input
          data-part="field-input"
          style={{ flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder={placeholder ?? 'Type a message…'}
        />
        <Btn onClick={() => send(input)}>Send</Btn>
      </div>
    </div>
  );
}
