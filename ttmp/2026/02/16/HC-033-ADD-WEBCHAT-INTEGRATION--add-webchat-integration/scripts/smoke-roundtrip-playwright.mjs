#!/usr/bin/env node

import { chromium } from 'playwright';

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173';
const prompt = process.env.PROMPT ?? 'Give me a short inventory summary.';
const timeoutMs = Number(process.env.TIMEOUT_MS ?? '60000');

function firstNonEmptyAIMessage(page) {
  return page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll('[data-part="chat-message"][data-role="ai"]')
    );
    for (const node of nodes) {
      const text = (node.textContent ?? '').replace(/^AI:\s*/, '').trim();
      if (text.length > 0 && !text.includes('Thinking')) {
        return text;
      }
    }
    return '';
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(frontendUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForSelector('[data-part="chat-window"]', { timeout: timeoutMs });

    const input = page.locator('[data-part="field-input"]');
    await input.fill(prompt);
    await page.getByRole('button', { name: 'Send' }).click();

    await page.waitForFunction(
      () => {
        const nodes = Array.from(
          document.querySelectorAll('[data-part="chat-message"][data-role="ai"]')
        );
        return nodes.some((node) => {
          const text = (node.textContent ?? '').replace(/^AI:\s*/, '').trim();
          return text.length > 0 && !text.includes('Thinking');
        });
      },
      { timeout: timeoutMs }
    );

    const aiMessage = await firstNonEmptyAIMessage(page);
    console.log(`OK: received AI stream output: ${aiMessage.slice(0, 200)}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('FAIL: smoke roundtrip failed');
  console.error(error);
  process.exit(1);
});
