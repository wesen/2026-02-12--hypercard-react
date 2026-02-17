import type { Meta, StoryObj } from '@storybook/react';
import type { TurnStats } from '../chatSlice';

/**
 * Standalone StatsFooter story component — mirrors the logic from
 * InventoryChatWindow's StatsFooter without importing the full chat window.
 */
function formatNumber(n: number): string {
  if (n >= 1000) {
    return n.toLocaleString('en-US');
  }
  return String(n);
}

interface StatsFooterProps {
  modelName: string | null;
  turnStats: TurnStats | null;
  isStreaming: boolean;
  streamStartTime: number | null;
  streamOutputTokens: number;
}

function StatsFooter({
  modelName,
  turnStats,
  isStreaming,
  streamStartTime,
  streamOutputTokens,
}: StatsFooterProps) {
  const parts: string[] = [];

  if (modelName) {
    parts.push(modelName);
  }

  if (isStreaming && streamStartTime) {
    const elapsed = (Date.now() - streamStartTime) / 1000;
    if (streamOutputTokens > 0 && elapsed > 0) {
      const liveTps = Math.round((streamOutputTokens / elapsed) * 10) / 10;
      parts.push(`streaming: ${formatNumber(streamOutputTokens)} tok · ${liveTps} tok/s`);
    } else {
      parts.push('streaming...');
    }
  } else if (turnStats) {
    const tokenParts: string[] = [];
    if (turnStats.inputTokens !== undefined) {
      tokenParts.push(`In:${formatNumber(turnStats.inputTokens)}`);
    }
    if (turnStats.outputTokens !== undefined) {
      tokenParts.push(`Out:${formatNumber(turnStats.outputTokens)}`);
    }
    if (turnStats.cachedTokens !== undefined && turnStats.cachedTokens > 0) {
      tokenParts.push(`Cache:${formatNumber(turnStats.cachedTokens)}`);
    }
    if (turnStats.cacheCreationInputTokens !== undefined && turnStats.cacheCreationInputTokens > 0) {
      tokenParts.push(`CacheWrite:${formatNumber(turnStats.cacheCreationInputTokens)}`);
    }
    if (tokenParts.length > 0) {
      parts.push(tokenParts.join(' '));
    }
    if (turnStats.durationMs !== undefined) {
      parts.push(`${(turnStats.durationMs / 1000).toFixed(1)}s`);
    }
    if (turnStats.tps !== undefined) {
      parts.push(`${turnStats.tps} tok/s`);
    }
  }

  if (parts.length === 0) {
    return <span style={{ color: '#999', fontSize: 10 }}>Streaming via /chat + /ws</span>;
  }

  return <span style={{ fontSize: 10 }}>{parts.join(' · ')}</span>;
}

const meta = {
  title: 'Apps/Inventory/Chat/ModelStats',
  component: StatsFooter,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '4px 24px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          textAlign: 'center',
          width: 520,
          maxWidth: '95vw',
          background: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatsFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Complete turn stats with all fields */
export const WithFullStats: Story = {
  args: {
    modelName: 'claude-sonnet-4-20250514',
    turnStats: {
      inputTokens: 1234,
      outputTokens: 567,
      cachedTokens: 890,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 890,
      durationMs: 4200,
      tps: 135,
    },
    isStreaming: false,
    streamStartTime: null,
    streamOutputTokens: 0,
  },
};

/** Streaming state with live TPS counter */
export const Streaming: Story = {
  args: {
    modelName: 'claude-sonnet-4-20250514',
    turnStats: null,
    isStreaming: true,
    streamStartTime: Date.now() - 3000,
    streamOutputTokens: 412,
  },
};

/** No metadata available from backend */
export const NoMetadata: Story = {
  args: {
    modelName: null,
    turnStats: null,
    isStreaming: false,
    streamStartTime: null,
    streamOutputTokens: 0,
  },
};

/** Large token counts (100k+) */
export const LargeTokenCounts: Story = {
  args: {
    modelName: 'claude-opus-4-20250514',
    turnStats: {
      inputTokens: 128456,
      outputTokens: 16384,
      cachedTokens: 102400,
      cacheCreationInputTokens: 26056,
      cacheReadInputTokens: 102400,
      durationMs: 45200,
      tps: 362.5,
    },
    isStreaming: false,
    streamStartTime: null,
    streamOutputTokens: 0,
  },
};

/** Model name only, no token stats */
export const ModelOnly: Story = {
  args: {
    modelName: 'gpt-4o',
    turnStats: null,
    isStreaming: false,
    streamStartTime: null,
    streamOutputTokens: 0,
  },
};
