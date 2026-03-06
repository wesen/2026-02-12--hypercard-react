import { BUILT_IN_COMMANDS } from './sampleData';
import { RICH_PARTS as P } from '../parts';

export function ReplInputLine({
  prompt,
  input,
  suggestion,
  showCompletion,
  completions,
  completionIdx,
  inputRef,
  onChange,
  onKeyDown,
  onPickCompletion,
}: {
  prompt: string;
  input: string;
  suggestion: string;
  showCompletion: boolean;
  completions: string[];
  completionIdx: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPickCompletion: (completion: string) => void;
}) {
  return (
    <div data-part={P.replInputLine}>
      <span data-part={P.replPrompt}>{prompt}</span>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          data-part={P.replInput}
          type="text"
          value={input}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
        {suggestion && (
          <span data-part={P.replGhost} style={{ left: `${input.length * 7.2}px` }}>
            {suggestion}
          </span>
        )}
        {showCompletion && completions.length > 1 && (
          <div data-part={P.replCompletionPopup}>
            {completions.map((completion, index) => (
              <div
                key={completion}
                data-part={P.replCompletionItem}
                data-state={index === completionIdx ? 'active' : undefined}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPickCompletion(completion);
                  inputRef.current?.focus();
                }}
              >
                <span>{completion}</span>
                <span style={{ opacity: 0.5, marginLeft: 8 }}>
                  {BUILT_IN_COMMANDS[completion as keyof typeof BUILT_IN_COMMANDS]?.desc?.slice(0, 30) || 'alias'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
