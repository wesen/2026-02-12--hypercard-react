import { describe, expect, it } from 'vitest';
import { BUILTIN_DEMO_REPL_DRIVER, executeReplCommand, getCompletions } from './replCommands';

const baseContext = {
  lines: [],
  historyStack: ['help'],
  envVars: {
    USER: 'macuser',
    HOME: '/Users/macuser',
    SHELL: '/bin/msh',
  },
  aliases: {},
  uptimeMs: 1250,
};

describe('replCommands', () => {
  it('returns generic completion items with details', () => {
    expect(getCompletions('he', {})).toEqual([
      { value: 'help', detail: 'Show available commands and usage' },
    ]);
  });

  it('marks clear as a transcript-clearing result', () => {
    expect(executeReplCommand('clear', baseContext)).toEqual({
      lines: [],
      clearTranscript: true,
    });
  });

  it('exposes built-in help through the demo driver', () => {
    expect(BUILTIN_DEMO_REPL_DRIVER.getHelp?.('help', baseContext)).toEqual([
      {
        title: 'help',
        detail: 'Show available commands and usage',
        usage: 'help [command]',
      },
    ]);
  });
});
