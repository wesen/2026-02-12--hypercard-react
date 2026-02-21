#!/usr/bin/env node

import { chromium } from 'playwright';

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173';
const timeoutMs = Number(process.env.TIMEOUT_MS ?? '90000');
const conversationStorageKey = 'inventory.webchat.conv_id';
const prompt =
  process.env.PROMPT ?? `Hydration test prompt ${new Date().toISOString()}: summarize inventory quickly.`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function getAIMessages(page) {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('[data-part="chat-message"][data-role="ai"]'));
    return rows
      .map((row) => (row.textContent ?? '').replace(/^AI:\s*/, '').trim())
      .filter((text) => text.length > 0 && text !== 'Thinking…');
  });
}

async function getTimelineItemCount(page) {
  return page.evaluate(() => document.querySelectorAll('[data-part="inventory-timeline-item"]').length);
}

async function fetchTimelineSnapshot(page, conversationId) {
  return page.evaluate(async (convId) => {
    const response = await fetch(`/api/timeline?conv_id=${encodeURIComponent(convId)}`);
    if (!response.ok) {
      throw new Error(`timeline request failed (${response.status})`);
    }
    return await response.json();
  }, conversationId);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(frontendUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForSelector('[data-part="chat-window"]', { timeout: timeoutMs });

    // Force a clean conversation id for deterministic hydration checks.
    await page.evaluate((storageKey) => {
      window.localStorage.removeItem(storageKey);
    }, conversationStorageKey);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForSelector('[data-part="chat-window"]', { timeout: timeoutMs });

    const input = page.locator('[data-part="field-input"]');
    await input.fill(prompt);
    await page.getByRole('button', { name: 'Send' }).click();

    await page.waitForFunction(
      () => {
        const nodes = Array.from(document.querySelectorAll('[data-part="chat-message"][data-role="ai"]'));
        return nodes.some((node) => {
          const text = (node.textContent ?? '').replace(/^AI:\s*/, '').trim();
          return text.length > 0 && text !== 'Thinking…';
        });
      },
      { timeout: timeoutMs }
    );

    const conversationId = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), conversationStorageKey);
    assert(typeof conversationId === 'string' && conversationId.length > 0, 'conversation id missing from localStorage');

    const preReloadMessages = await getAIMessages(page);
    const preReloadTimelineCount = await getTimelineItemCount(page);
    assert(preReloadTimelineCount > 0, 'expected timeline widget items before reload');

    const snapshot = await fetchTimelineSnapshot(page, conversationId);
    const entities = Array.isArray(snapshot.entities) ? snapshot.entities : [];
    assert(entities.length > 0, 'timeline snapshot is empty after first round-trip');

    const kinds = new Set(
      entities
        .map((entity) => (entity && typeof entity.kind === 'string' ? entity.kind : ''))
        .filter((kind) => kind.length > 0)
    );
    assert(kinds.has('message'), 'timeline snapshot missing message entities');

    await page.reload({ waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForSelector('[data-part="chat-window"]', { timeout: timeoutMs });

    await page.waitForFunction(
      () => {
        const rows = Array.from(document.querySelectorAll('[data-part="chat-message"][data-role="ai"]'));
        const aiCount = rows
          .map((row) => (row.textContent ?? '').replace(/^AI:\s*/, '').trim())
          .filter((text) => text.length > 0 && text !== 'Thinking…').length;
        const timelineCount = document.querySelectorAll('[data-part="inventory-timeline-item"]').length;
        return aiCount > 0 || timelineCount > 0;
      },
      { timeout: timeoutMs }
    );

    const postReloadMessages = await getAIMessages(page);
    const postReloadTimelineCount = await getTimelineItemCount(page);
    assert(
      postReloadMessages.length > 0 || postReloadTimelineCount > 0,
      'expected hydrated AI messages or timeline widget items after reload'
    );

    console.log(`OK: reload hydration verified for conversation ${conversationId}`);
    console.log(`OK: AI messages pre=${preReloadMessages.length}, post=${postReloadMessages.length}`);
    console.log(`OK: timeline items pre=${preReloadTimelineCount}, post=${postReloadTimelineCount}`);
    console.log(`OK: timeline entity kinds: ${Array.from(kinds).sort().join(', ')}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('FAIL: reload hydration smoke failed');
  console.error(error);
  process.exit(1);
});
