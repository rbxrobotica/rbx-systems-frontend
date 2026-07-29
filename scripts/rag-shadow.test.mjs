import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { Buffer } from 'node:buffer';
import ts from 'typescript';

const sourceUrl = new URL('../src/lib/server/ragShadow.ts', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022
  }
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
const { runRagShadow } = await import(moduleUrl);

const enabledEnvironment = {
  THALAMUS_RAG_SHADOW_ENABLED: 'true',
  THALAMUS_URL: 'https://thalamus.example',
  THALAMUS_RAG_TOKEN: 'test-token',
  THALAMUS_RAG_SHADOW_TIMEOUT_MS: '100'
};

function validPayload(overrides = {}) {
  return {
    mode: 'shadow',
    package_id: 'rbx-rag-public-assistant',
    visibility: 'public',
    model_alias: 'embedding-public',
    trace_id: '018f47a0-9131-7d18-9c7b-7ca62de7c001',
    audit_id: '018f47a0-9131-7d18-9c7b-7ca62de7c002',
    embedding_trace_id: 'embedding-trace-1',
    embedding_audit_id: 'embedding-audit-1',
    hits: [
      {
        chunk_id: 'chunk-1',
        document_id: 'document-1',
        content: 'public context',
        locale: 'en',
        score: 0.91
      }
    ],
    ...overrides
  };
}

function response(payload = validPayload(), init = {}) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init
  });
}

function recordingLogger() {
  const records = [];
  return {
    records,
    logger: {
      info(message, metadata) {
        records.push({ level: 'info', message, metadata });
      },
      warn(message, metadata) {
        records.push({ level: 'warn', message, metadata });
      }
    }
  };
}

test('disabled shadow mode performs no request', async () => {
  let calls = 0;
  const outcome = await runRagShadow({
    query: 'What is RBX?',
    environment: {},
    fetchImpl: async () => {
      calls += 1;
      return response();
    }
  });

  assert.deepEqual(outcome, { status: 'disabled' });
  assert.equal(calls, 0);
});

test('sends one exact governed shadow request and logs only safe correlation metadata', async () => {
  const requests = [];
  const { records, logger } = recordingLogger();
  const query = 'What is the public RBX platform?';
  const outcome = await runRagShadow({
    query,
    environment: enabledEnvironment,
    logger,
    fetchImpl: async (url, init) => {
      requests.push({ url: String(url), init });
      return response();
    }
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://thalamus.example/rbx/v1/rag/shadow/retrieve');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    tenant: 'public',
    product: 'rbx-site',
    workflow: 'public-assistant-shadow',
    package_id: 'rbx-rag-public-assistant',
    visibility: 'public',
    query,
    limit: 5
  });
  assert.deepEqual(outcome, {
    status: 'success',
    traceId: '018f47a0-9131-7d18-9c7b-7ca62de7c001',
    auditId: '018f47a0-9131-7d18-9c7b-7ca62de7c002',
    hitCount: 1
  });
  const logs = JSON.stringify(records);
  assert.equal(logs.includes(query), false);
  assert.equal(logs.includes('test-token'), false);
  assert.equal(logs.includes('public context'), false);
});

test('fails closed when the governed response exposes source metadata', async () => {
  const payload = validPayload();
  payload.hits[0].source_uri = 'https://internal.example/document';
  const outcome = await runRagShadow({
    query: 'What is RBX?',
    environment: enabledEnvironment,
    fetchImpl: async () => response(payload)
  });

  assert.deepEqual(outcome, { status: 'failed', reason: 'malformed_response' });
});

test('rejects an oversized response before parsing it', async () => {
  const outcome = await runRagShadow({
    query: 'What is RBX?',
    environment: enabledEnvironment,
    fetchImpl: async () =>
      response(validPayload(), {
        headers: {
          'content-type': 'application/json',
          'content-length': '262145'
        }
      })
  });

  assert.deepEqual(outcome, { status: 'failed', reason: 'malformed_response' });
});

test('times out without retrying or throwing into the live chat path', async () => {
  let calls = 0;
  const outcome = await runRagShadow({
    query: 'What is RBX?',
    environment: {
      ...enabledEnvironment,
      THALAMUS_RAG_SHADOW_TIMEOUT_MS: '5'
    },
    fetchImpl: async (_url, init) => {
      calls += 1;
      return await new Promise((_resolve, reject) => {
        init.signal.addEventListener(
          'abort',
          () => reject(new DOMException('aborted', 'AbortError')),
          { once: true }
        );
      });
    }
  });

  assert.equal(calls, 1);
  assert.deepEqual(outcome, { status: 'failed', reason: 'timeout' });
});
