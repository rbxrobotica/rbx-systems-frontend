#!/usr/bin/env node
/**
 * E2E smoke test: prove the mutation-freeze pattern works.
 *
 * 1. Open rbx.ia.br
 * 2. Open the AI chat widget
 * 3. Type a message
 * 4. Intercept /api/chat and delay the response
 * 5. Click the send button 5 times rapidly
 * 6. Assert only ONE request was sent to /api/chat
 * 7. Take screenshots for evidence
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(process.cwd(), 'test-results', 'freeze');
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = process.env.BASE_URL || 'https://rbx.ia.br';
const HEADLESS = process.env.HEADLESS !== 'false';

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  let chatRequests = 0;

  // Intercept /api/chat and respond after a delay to keep the widget frozen.
  await page.route('**/api/chat', async (route, request) => {
    if (request.method() === 'POST') {
      chatRequests += 1;
      console.log(`[intercept] POST /api/chat #${chatRequests}`);
      // Keep the request "in flight" for 2s so the UI stays frozen.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'assistant',
          content: 'Resposta mockada para teste de freeze.'
        })
      });
    } else {
      await route.continue();
    }
  });

  console.log(`Opening ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT_DIR, '01-initial.png') });

  console.log('Opening AI chat widget...');
  const chatFloat = page.locator('button[aria-label="RBX AI Assistant"]');
  await chatFloat.waitFor({ state: 'visible' });
  await chatFloat.click();
  await page.screenshot({ path: path.join(OUT_DIR, '02-chat-open.png') });

  console.log('Typing message...');
  const input = page.locator('[role="dialog"] .input');
  await input.fill('Olá, este é um teste de double submit.');
  await page.screenshot({ path: path.join(OUT_DIR, '03-message-typed.png') });

  console.log('Clicking send 5 times rapidly...');
  const sendBtn = page.locator('button[aria-label="Enviar"]');
  for (let i = 0; i < 5; i++) {
    await sendBtn.click({ force: true }).catch(() => {});
  }

  // Wait enough for any additional debounced clicks to settle.
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, '04-during-freeze.png') });

  console.log('Waiting for mock response...');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT_DIR, '05-after-response.png') });

  await browser.close();

  console.log('\n=== RESULT ===');
  console.log(`Total POST /api/chat requests: ${chatRequests}`);
  if (chatRequests === 1) {
    console.log('✅ PASS: only one request was sent despite 5 rapid clicks.');
    process.exit(0);
  } else {
    console.log('❌ FAIL: mutation freeze did not prevent double submit.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
