import type { TerminalLine } from '../types';

export interface ReplCompletionItem {
  value: string;
  detail?: string;
}

export interface ReplHelpEntry {
  title: string;
  detail: string;
  usage?: string;
}

export interface ReplEffect {
  type: string;
  payload?: unknown;
}

export interface ReplDriverContext {
  lines: TerminalLine[];
  historyStack: string[];
  envVars: Record<string, string>;
  aliases: Record<string, string>;
  uptimeMs: number;
}

export interface ReplExecutionResult {
  lines: TerminalLine[];
  envVars?: Record<string, string>;
  aliases?: Record<string, string>;
  effects?: ReplEffect[];
  clearTranscript?: boolean;
}

export interface ReplDriver {
  execute(raw: string, context: ReplDriverContext): ReplExecutionResult;
  getCompletions?(input: string, context: ReplDriverContext): ReplCompletionItem[];
  getHelp?(topic: string | null, context: ReplDriverContext): ReplHelpEntry[] | null;
}
