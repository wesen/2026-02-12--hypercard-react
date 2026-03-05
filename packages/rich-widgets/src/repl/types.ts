export type LineType = 'input' | 'output' | 'error' | 'system';

export interface TerminalLine {
  type: LineType;
  text: string;
}

export interface CommandInfo {
  desc: string;
  usage: string;
}
