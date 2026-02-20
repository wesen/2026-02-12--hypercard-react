import { stripTrailingWhitespace } from '../sem/semHelpers';

function resolveBasePrefix(basePrefix?: string): string {
  return typeof basePrefix === 'string' ? basePrefix.replace(/\/$/, '') : '';
}

function toErrorMessage(body: string, fallback: string): string {
  const normalized = stripTrailingWhitespace(body).trim();
  return normalized.length > 0 ? normalized : fallback;
}

export async function submitPrompt(
  prompt: string,
  convId: string,
  basePrefix = '',
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const response = await fetchImpl(`${resolveBasePrefix(basePrefix)}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      conv_id: convId,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(toErrorMessage(body, `chat request failed (${response.status})`));
  }
}

export async function fetchTimelineSnapshot(
  convId: string,
  basePrefix = '',
  fetchImpl: typeof fetch = fetch
): Promise<unknown> {
  const response = await fetchImpl(
    `${resolveBasePrefix(basePrefix)}/api/timeline?conv_id=${encodeURIComponent(convId)}`
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(toErrorMessage(body, `timeline request failed (${response.status})`));
  }

  return response.json();
}
