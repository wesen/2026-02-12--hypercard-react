import { useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('yaml', yaml);

export interface SyntaxHighlightProps {
  code: string;
  language: 'javascript' | 'yaml';
  maxLines?: number;
  variant?: 'light' | 'dark';
  style?: React.CSSProperties;
}

export function SyntaxHighlight({ code, language, maxLines = 0, variant = 'light', style }: SyntaxHighlightProps) {
  const [expanded, setExpanded] = useState(false);

  const lines = code.split('\n');
  const shouldTruncate = maxLines > 0 && !expanded && lines.length > maxLines;
  const displayCode = shouldTruncate
    ? lines.slice(0, maxLines).join('\n') + '\n…'
    : code;

  const html = useMemo(
    () => hljs.highlight(displayCode, { language }).value,
    [displayCode, language],
  );

  return (
    <div data-part="syntax-highlight" data-variant={variant}>
      <pre
        style={{
          margin: '4px 0',
          padding: '6px 8px',
          background: variant === 'dark' ? '#0d0d1a' : '#f6f8fa',
          color: variant === 'dark' ? '#c8d6e5' : undefined,
          borderRadius: 4,
          fontSize: 11,
          lineHeight: 1.5,
          overflow: 'auto',
          maxHeight: expanded ? 600 : maxLines > 0 ? undefined : 240,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {maxLines > 0 && lines.length > maxLines && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            fontSize: 11,
            background: 'none',
            border: 'none',
            color: '#1a6dcc',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {expanded ? '▲ collapse' : `▼ show all ${lines.length} lines`}
        </button>
      )}
    </div>
  );
}
