import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const route = await readFile(path.join(root, 'src/routes/api/chat/+server.ts'), 'utf8');

test('RBX Journal discovery stays inside the assistant scope', () => {
  assert.match(route, /Requests to discover or recommend public RBX Journal articles are in scope/);
  assert.match(route, /recommend "RAG público com controle e evidência"/);
  assert.match(route, /https:\/\/rbx\.ia\.br\/blog\/2026-07-29-governed-public-rag/);
  assert.match(
    route,
    /https:\/\/rbx\.ia\.br\/blog\/2026-08-01-governed-autonomy-distributed-systems/
  );
  assert.match(route, /https:\/\/rbx\.ia\.br\/blog\/2026-08-01-auditoria-ou-telemetria/);
  assert.match(route, /include the exact title, one concise reason and the full RBX URL/);
  assert.match(route, /Recommend only the listed public RBX Journal posts/);
  assert.match(route, /For another RBX theme not covered above/);
  assert.match(route, /commercial, editorial, or support information/);
  assert.match(route, /Refuse every other topic/);
});

test('the three Robson product identities remain distinct', () => {
  assert.match(route, /Robson: without a qualifier, this name means the original RBX product/);
  assert.match(route, /open-source Rust system for trade execution and risk management in crypto/);
  assert.match(route, /Robson Code: a distinct internal RBX coding agent/);
  assert.match(
    route,
    /Robson AI Assistant: this public RBX assistant for institutional, commercial, editorial and product-support information/
  );
  assert.match(route, /It does not execute trades and is not Robson Code/);
  assert.match(route, /Do not claim precision, returns or financial performance/);
});
