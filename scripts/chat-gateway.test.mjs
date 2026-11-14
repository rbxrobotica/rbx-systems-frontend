import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as kit from '@sveltejs/kit';

import { sanitizeMessages } from '../src/lib/server/chatMessages.js';
import { loadTypeScriptGraph } from './test-support/load-typescript-graph.mjs';
import { seededRandom } from './test-support/seeded-random.mjs';

// The chat endpoint's call to the LLM gateway: its deadline, and what each
// failure of the gateway answers and logs (RBX engineering guardrail 3). The
// real handler runs against a fake `fetch`; nothing here opens a socket.

const source = (path) => new URL(`../src/${path}`, import.meta.url);

const GATEWAY_KEY = 'test-gateway-key';
const VISITOR_TEXT = 'segredo do visitante 7f3a';

/**
 * The real `POST` handler with its real dependencies. Every call builds a
 * fresh module graph, so the rate limiter starts empty.
 */
function loadChatHandler(environment = {}) {
  return loadTypeScriptGraph(source('routes/api/chat/+server.ts'), {
    '@sveltejs/kit': kit,
    '$env/dynamic/private': {
      env: {
        LLM_GATEWAY_URL: 'https://gateway.example/v1/',
        LLM_GATEWAY_KEY: GATEWAY_KEY,
        LLM_MODEL: 'test-model',
        ...environment
      }
    },
    '$lib/server/chatMessages.js': { sanitizeMessages },
    // The shadow request is off unless its variables are set: it sends nothing.
    '$lib/server/ragShadow': loadTypeScriptGraph(source('lib/server/ragShadow.ts')),
    '$lib/i18n/locale': loadTypeScriptGraph(source('lib/i18n/locale.ts')),
    '$lib/content/partnership': loadTypeScriptGraph(source('lib/content/partnership.ts'))
  }).POST;
}

let visitors = 0;

/** What SvelteKit hands the handler for one visitor message, each from its own address. */
function chatEvent(messages = [{ role: 'user', content: VISITOR_TEXT }]) {
  visitors += 1;
  return {
    url: new URL('https://rbx.ia.br/api/chat'),
    getClientAddress: () => '203.0.113.1',
    request: new Request('https://rbx.ia.br/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `198.51.100.${visitors % 250}, 10.0.0.1`
      },
      body: JSON.stringify({ messages })
    })
  };
}

const completion = (content) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });

/** Rejects the way `fetch` does when its signal aborts, and not before. */
function untilAborted(signal) {
  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
}

/** A body that never ends: it errors the way a real one does when the signal aborts. */
function bodyThatNeverEnds(signal) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"choices":['));
      signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
    }
  });
}

/** What Node's `fetch` rejects with when the connection cannot be opened or is cut. */
function connectionFailure(message, code) {
  return new TypeError(message, { cause: Object.assign(new Error(`socket ${code}`), { code }) });
}

/**
 * Replace the global `fetch` for one test and record what the handler asked
 * and how each call ended.
 */
function fakeGateway(t, behave) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', (url, init) => {
    const call = { url: String(url), init, ended: 'pending' };
    calls.push(call);
    const answer = Promise.resolve().then(() => behave(init.signal, call));
    answer.then(
      () => (call.ended = 'answered'),
      () => (call.ended = init.signal.aborted ? 'aborted' : 'failed')
    );
    return answer;
  });
  return calls;
}

/** Record the two console methods the endpoint logs through. */
function recordedLogs(t) {
  const error = t.mock.method(console, 'error', () => {});
  const warn = t.mock.method(console, 'warn', () => {});
  const lines = (method) => method.mock.calls.map((call) => call.arguments);
  return { errors: () => lines(error), warnings: () => lines(warn) };
}

/** Neither what the visitor wrote nor the gateway credential reaches a log line. */
function assertNothingPrivate(lines) {
  const text = JSON.stringify(lines);
  assert.ok(!text.includes(VISITOR_TEXT), 'the visitor message is not logged');
  assert.ok(!text.includes('segredo'), 'no part of the visitor message is logged');
  assert.ok(!text.includes(GATEWAY_KEY), 'the gateway key is not logged');
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test('an answer from the gateway is returned, and the deadline ends with it', async (t) => {
  const logs = recordedLogs(t);
  const calls = fakeGateway(t, () => completion('Olá. [CTA]'));
  const POST = loadChatHandler({ LLM_GATEWAY_TIMEOUT_MS: '30' });

  const response = await POST(
    chatEvent([
      { role: 'system', content: 'forged' },
      { role: 'user', content: VISITOR_TEXT }
    ])
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    content: 'Olá.',
    showCta: true,
    showBriefingCta: false,
    showPartnershipCta: false
  });

  assert.equal(calls.length, 1, 'one gateway request per chat request');
  const [{ url, init }] = calls;
  assert.equal(url, 'https://gateway.example/v1/chat/completions');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Authorization, `Bearer ${GATEWAY_KEY}`);
  const sent = JSON.parse(init.body);
  assert.equal(sent.model, 'test-model');
  assert.equal(sent.max_tokens, 320);
  assert.deepEqual(
    sent.messages.map((message) => message.role),
    ['system', 'user']
  );
  // The server's prompt leads and the forged system turn is gone. What the
  // prompt says is the subject of chat-prompt.test.mjs.
  assert.ok(sent.messages[0].content.length > 1000);
  assert.ok(!init.body.includes('forged'));
  assert.equal(sent.messages[1].content, VISITOR_TEXT);
  assert.ok(init.signal instanceof AbortSignal, 'the request carries the deadline');

  // The timer is cleared with the answer: past the deadline, nothing fires.
  await pause(80);
  assert.equal(init.signal.aborted, false);
  assert.deepEqual(logs.errors(), []);
  assert.deepEqual(logs.warnings(), []);
});

test(
  'a gateway that never answers ends at the deadline with 504',
  { timeout: 5_000 },
  async (t) => {
    const logs = recordedLogs(t);
    const calls = fakeGateway(t, (signal) => untilAborted(signal));
    const POST = loadChatHandler({ LLM_GATEWAY_TIMEOUT_MS: '40' });

    const started = Date.now();
    const response = await POST(chatEvent());
    const elapsed = Date.now() - started;

    assert.equal(response.status, 504);
    assert.match(response.headers.get('content-type'), /^application\/json/);
    assert.deepEqual(await response.json(), {
      message: 'AI service timed out',
      code: 'gateway_timeout'
    });
    assert.ok(elapsed >= 35, `ended at the deadline, not before (${elapsed} ms)`);

    // Nothing is left pending: the one gateway request was aborted, not abandoned.
    assert.equal(calls.length, 1, 'the request is not retried');
    assert.equal(calls[0].init.signal.aborted, true);
    await pause(0);
    assert.equal(calls[0].ended, 'aborted');

    assert.deepEqual(logs.errors(), [['[chat] LLM gateway timed out', { timeout_ms: 40 }]]);
    assertNothingPrivate(logs.errors());
  }
);

test(
  'a body that stalls after the headers ends at the same deadline',
  { timeout: 5_000 },
  async (t) => {
    const logs = recordedLogs(t);
    const calls = fakeGateway(
      t,
      (signal) => new Response(bodyThatNeverEnds(signal), { status: 200 })
    );
    const POST = loadChatHandler({ LLM_GATEWAY_TIMEOUT_MS: '40' });

    const response = await POST(chatEvent());

    assert.equal(response.status, 504);
    assert.deepEqual(await response.json(), {
      message: 'AI service timed out',
      code: 'gateway_timeout'
    });
    assert.equal(calls[0].init.signal.aborted, true);
    assert.deepEqual(logs.errors(), [['[chat] LLM gateway timed out', { timeout_ms: 40 }]]);
  }
);

test('a refused connection answers 502 and says what failed', async (t) => {
  const logs = recordedLogs(t);
  const calls = fakeGateway(t, () => {
    throw connectionFailure('fetch failed', 'ECONNREFUSED');
  });
  const POST = loadChatHandler();

  const response = await POST(chatEvent());

  assert.equal(response.status, 502);
  assert.match(response.headers.get('content-type'), /^application\/json/);
  assert.deepEqual(await response.json(), {
    message: 'AI service unreachable',
    code: 'gateway_unreachable'
  });
  assert.equal(calls.length, 1, 'the request is not retried');
  assert.equal(calls[0].init.signal.aborted, false);
  assert.deepEqual(logs.errors(), [['[chat] LLM gateway unreachable', { cause: 'ECONNREFUSED' }]]);
  assertNothingPrivate(logs.errors());
});

test('a connection cut in the middle of the answer is the same 502', async (t) => {
  const logs = recordedLogs(t);
  fakeGateway(t, () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"choices":['));
        controller.error(connectionFailure('terminated', 'UND_ERR_SOCKET'));
      }
    });
    return new Response(body, { status: 200 });
  });
  const POST = loadChatHandler();

  const response = await POST(chatEvent());

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    message: 'AI service unreachable',
    code: 'gateway_unreachable'
  });
  assert.deepEqual(logs.errors(), [
    ['[chat] LLM gateway unreachable', { cause: 'UND_ERR_SOCKET' }]
  ]);
});

test('a failure that carries no code is named, and its message is not logged', async (t) => {
  const logs = recordedLogs(t);
  fakeGateway(t, () => {
    throw new TypeError(`cannot send ${VISITOR_TEXT}`);
  });
  const POST = loadChatHandler();

  const response = await POST(chatEvent());

  assert.equal(response.status, 502);
  assert.deepEqual(logs.errors(), [['[chat] LLM gateway unreachable', { cause: 'TypeError' }]]);
  assertNothingPrivate(logs.errors());
});

test('an answer that is not OK keeps its 502 and its log line', async (t) => {
  const logs = recordedLogs(t);
  const calls = fakeGateway(t, () => new Response('{"error":"model overloaded"}', { status: 503 }));
  const POST = loadChatHandler();

  await assert.rejects(POST(chatEvent()), (thrown) => {
    assert.ok(kit.isHttpError(thrown, 502));
    assert.equal(thrown.body.message, 'AI service unavailable');
    return true;
  });

  assert.equal(calls.length, 1, 'the request is not retried');
  assert.deepEqual(logs.errors(), [
    ['[chat] LLM gateway error', 503, '{"error":"model overloaded"}']
  ]);
});

test(
  'an answer that is not OK and whose body stalls still ends at the deadline',
  { timeout: 5_000 },
  async (t) => {
    const logs = recordedLogs(t);
    fakeGateway(t, (signal) => new Response(bodyThatNeverEnds(signal), { status: 503 }));
    const POST = loadChatHandler({ LLM_GATEWAY_TIMEOUT_MS: '40' });

    await assert.rejects(POST(chatEvent()), (thrown) => kit.isHttpError(thrown, 502));

    assert.deepEqual(logs.errors(), [['[chat] LLM gateway error', 503, '']]);
  }
);

test('an OK answer that is not JSON is a 502, and its body is not logged', async (t) => {
  const logs = recordedLogs(t);
  fakeGateway(t, () => new Response(`<html>${VISITOR_TEXT}</html>`, { status: 200 }));
  const POST = loadChatHandler();

  await assert.rejects(POST(chatEvent()), (thrown) => {
    assert.ok(kit.isHttpError(thrown, 502));
    assert.equal(thrown.body.message, 'AI service unavailable');
    return true;
  });

  assert.deepEqual(logs.errors(), [['[chat] LLM gateway answer is not JSON']]);
  assertNothingPrivate(logs.errors());
});

test('the deadline is 35 s unless the variable holds a valid number of milliseconds', async (t) => {
  const logs = recordedLogs(t);
  fakeGateway(t, () => completion('ok'));
  const timers = t.mock.method(globalThis, 'setTimeout');
  const delays = () => timers.mock.calls.map((call) => call.arguments[1]);

  await loadChatHandler()(chatEvent());
  assert.ok(delays().includes(35_000), 'default');
  assert.deepEqual(logs.warnings(), []);

  timers.mock.resetCalls();
  await loadChatHandler({ LLM_GATEWAY_TIMEOUT_MS: ' 1234 ' })(chatEvent());
  assert.ok(delays().includes(1_234), 'a valid value is used');
  assert.ok(!delays().includes(35_000));

  timers.mock.resetCalls();
  await loadChatHandler({ LLM_GATEWAY_TIMEOUT_MS: '60000' })(chatEvent());
  assert.ok(delays().includes(60_000), 'the upper bound is valid');
  assert.deepEqual(logs.warnings(), []);
});

test('an invalid deadline is ignored, never honoured, and reported once', async (t) => {
  for (const invalid of ['0', '-1', '1.5', '60001', 'abc', 'Infinity', '30s']) {
    const logs = recordedLogs(t);
    // An answer after 20 ms: a deadline of 0 or 1 ms would have ended it first.
    fakeGateway(t, async () => {
      await pause(20);
      return completion('ok');
    });
    const timers = t.mock.method(globalThis, 'setTimeout');
    const POST = loadChatHandler({ LLM_GATEWAY_TIMEOUT_MS: invalid });

    const first = await POST(chatEvent());
    const second = await POST(chatEvent());

    assert.equal(first.status, 200, invalid);
    assert.equal(second.status, 200, invalid);
    assert.ok(
      timers.mock.calls.some((call) => call.arguments[1] === 35_000),
      `${invalid}: the default applies`
    );
    assert.deepEqual(
      logs.warnings(),
      [['[chat] LLM_GATEWAY_TIMEOUT_MS invalid, default in use', { default_ms: 35_000 }]],
      `${invalid}: one warning for the process, not one per request`
    );
    t.mock.restoreAll();
  }
});

test(
  'answer and deadline in any order: one outcome each, and no timer survives it',
  { timeout: 20_000 },
  async (t) => {
    const DEADLINE = 25;
    const logs = recordedLogs(t);
    const plans = new Map();
    // Each request finds its plan by the message it carries.
    t.mock.method(globalThis, 'fetch', async (url, init) => {
      const plan = plans.get(JSON.parse(init.body).messages.at(-1).content);
      plan.signal = init.signal;
      const aborted = untilAborted(init.signal);
      aborted.catch(() => {});
      await Promise.race([pause(plan.headersAfter), aborted]);
      if (plan.refused) throw connectionFailure('fetch failed', 'ECONNREFUSED');
      const body = new ReadableStream({
        async start(controller) {
          init.signal.addEventListener('abort', () => controller.error(init.signal.reason), {
            once: true
          });
          await pause(plan.bodyAfter);
          if (init.signal.aborted) return;
          controller.enqueue(new TextEncoder().encode(JSON.stringify(plan.payload)));
          controller.close();
        }
      });
      return new Response(body, { status: plan.status });
    });
    const POST = loadChatHandler({ LLM_GATEWAY_TIMEOUT_MS: String(DEADLINE) });

    const seen = { answered: 0, timeout: 0, unreachable: 0, unusable: 0 };
    for (let seed = 1; seed <= 12; seed += 1) {
      const random = seededRandom(seed);
      plans.clear();
      const requests = [];
      // 24 requests at once, their answers spread on both sides of the deadline.
      for (let index = 0; index < 24; index += 1) {
        const name = `seed ${seed} request ${index}`;
        const plan = {
          headersAfter: random.int(2 * DEADLINE),
          bodyAfter: random.int(DEADLINE),
          refused: random.chance(0.15),
          status: random.chance(0.15) ? 503 : 200,
          payload: { choices: [{ message: { content: name } }] }
        };
        plans.set(name, plan);
        requests.push(
          POST(chatEvent([{ role: 'user', content: name }])).then(
            async (response) => ({
              name,
              plan,
              status: response.status,
              body: await response.json()
            }),
            (thrown) => ({ name, plan, thrown })
          )
        );
      }

      const outcomes = await Promise.all(requests);
      // Past every deadline: a timer that outlived its request would fire now.
      await pause(DEADLINE + 15);

      for (const { name, plan, status, body, thrown } of outcomes) {
        const at = `${name} (${JSON.stringify({ ...plan, payload: undefined, signal: undefined })})`;
        const fired = plan.signal.aborted;
        if (status === 504) {
          seen.timeout += 1;
          assert.equal(body.code, 'gateway_timeout', at);
          assert.equal(fired, true, `${at}: a 504 is the deadline and nothing else`);
        } else if (status === 200) {
          seen.answered += 1;
          assert.equal(fired, false, `${at}: the deadline never fires for an answered request`);
          assert.equal(plan.refused, false, at);
          assert.equal(plan.status, 200, at);
          assert.equal(body.content, name, `${at}: each request gets its own answer`);
        } else if (status === 502) {
          seen.unreachable += 1;
          assert.equal(fired, false, `${at}: the deadline never fires for a failed connection`);
          assert.equal(plan.refused, true, at);
          assert.equal(body.code, 'gateway_unreachable', at);
        } else {
          // A not-OK answer keeps its 502 even when the deadline ends its body.
          seen.unusable += 1;
          assert.ok(kit.isHttpError(thrown, 502), `${at}: nothing but a 502 is thrown`);
          assert.equal(plan.refused, false, at);
          assert.equal(plan.status, 503, at);
        }
      }
    }

    // Every failure was logged once, and only failures were logged.
    const logged = (line) => logs.errors().filter(([first]) => first === line).length;
    assert.equal(logged('[chat] LLM gateway timed out'), seen.timeout);
    assert.equal(logged('[chat] LLM gateway unreachable'), seen.unreachable);
    assert.equal(logged('[chat] LLM gateway error'), seen.unusable);
    assert.equal(logs.errors().length, seen.timeout + seen.unreachable + seen.unusable);
    for (const [kind, count] of Object.entries(seen)) {
      assert.ok(count > 0, `the runs covered ${kind}`);
    }
  }
);

test('the widget offers a retry for a failed request and stays frozen while one is pending', async () => {
  const widget = await readFile(source('lib/design/components/AIChatWidget.svelte'), 'utf8');

  // One request at a time: the guard and the freeze come before the first await.
  assert.match(
    widget,
    /async function request\(\) \{\n(?:\s*\/\/[^\n]*\n)*\s*if \(loading\) return;\n\s*loading = true;\n\s*failure = null;/
  );
  assert.match(
    widget,
    /messages = \[\.\.\.messages, \{ role: 'user', content: text \}\];\n\s*await request\(\);/
  );
  assert.match(widget, /\} finally \{\n\s*loading = false;/);
  assert.match(widget, /class:pending=\{loading\}/);
  assert.match(widget, /<textarea[^>]*disabled=\{loading\}/);
  assert.match(widget, /class="send-btn"[^>]*disabled=\{loading \|\| !input\.trim\(\)\}/);

  // The deadline and every other failure each set a state, not an assistant turn.
  assert.match(widget, /failure = res\.status === 504 \? 'timeout' : 'unavailable';\n\s*return;/);
  assert.match(widget, /\} catch \{\n\s*failure = 'unavailable';\n\s*\} finally \{/);
  assert.doesNotMatch(widget, /role: 'assistant', content: errMsg/);

  // The retry asks again with the conversation as it stands, and is not
  // offered while a request is pending.
  assert.match(
    widget,
    /\{#if failure && !loading\}\s*<div class="failure" role="alert">\s*<p class="failure-text">\{failureText\}<\/p>\s*<button type="button" class="cta-btn secondary" disabled=\{loading\} onclick=\{request\}>\s*\{retryLabel\}/
  );
  assert.match(widget, /failure === 'timeout'\n\s*\? \$locale\?\.startsWith\('en'\)/);
  assert.match(widget, /'Try again' : 'Tentar novamente'/);
});

test('the deadline is documented where it is configured and where failures are recorded', async () => {
  const route = await readFile(source('routes/api/chat/+server.ts'), 'utf8');
  const example = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');

  assert.match(route, /const DEFAULT_GATEWAY_TIMEOUT_MS = 35_000;/);
  assert.match(route, /const MAX_GATEWAY_TIMEOUT_MS = 60_000;/);
  assert.match(example, /^# LLM_GATEWAY_TIMEOUT_MS=35000$/m);
  assert.match(readme, /`LLM_GATEWAY_TIMEOUT_MS`/);
  assert.match(readme, /35 s/);
  assert.match(readme, /`code: "gateway_timeout"`/);
  assert.match(readme, /`code: "gateway_unreachable"`/);
});
