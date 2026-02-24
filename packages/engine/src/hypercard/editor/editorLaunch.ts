/**
 * Simple module to pass initial code to the CodeEditorWindow.
 * Since the editor opens as a windowing-system app (by appKey string),
 * we can't pass rich props directly. Instead, the caller stashes the
 * code here before dispatching openWindow, and the editor reads it on mount.
 */

import { type OpenWindowPayload, openWindow } from '../../desktop/core';
import { getPendingRuntimeCards } from '../../plugin-runtime';

const pendingCode = new Map<string, string>();
type WindowDispatch = (action: ReturnType<typeof openWindow>) => unknown;

export function buildCodeEditorWindowPayload(cardId: string): OpenWindowPayload {
  return {
    id: `window:code-editor:${cardId}`,
    title: `✏️ ${cardId}`,
    icon: '✏️',
    bounds: { x: 100, y: 40, w: 600, h: 500 },
    content: { kind: 'app', appKey: `code-editor:${cardId}` },
    dedupeKey: `code-editor:${cardId}`,
  };
}

/** Stash code for a card editor and open the window. */
export function openCodeEditor(dispatch: WindowDispatch, cardId: string, code: string): void {
  pendingCode.set(cardId, code);
  dispatch(openWindow(buildCodeEditorWindowPayload(cardId)));
}

/** Get the initial code for a card editor. Falls back to registry. */
export function getEditorInitialCode(cardId: string): string {
  const stashed = pendingCode.get(cardId);
  if (stashed !== undefined) {
    pendingCode.delete(cardId);
    return stashed;
  }
  // Fallback: look up from the runtime card registry
  const cards = getPendingRuntimeCards();
  const found = cards.find((c) => c.cardId === cardId);
  return found?.code ?? `// No code found for card: ${cardId}\n`;
}
