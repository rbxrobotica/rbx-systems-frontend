import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import {
  backgroundWorkSettled,
  controlClock,
  createContentGateway,
  hookEvent,
  journalSlug,
  loadHandleHook,
  publishJournal
} from './test-support/content-gateway.mjs';
import { seededRandom } from './test-support/seeded-random.mjs';

// Storage request counts per Content Gateway operation (RBX engineering
// guardrail 1.1). The numbers asserted here are the ones recorded in
// docs/implementation/content-gateway-request-budget.md: change both together.

const POSTS = 38;

function count(requests) {
  return {
    list: requests.filter((request) => request.command === 'ListObjectsV2').length,
    get: requests.filter((request) => request.command === 'GetObject').length
  };
}

/**
 * Collect the budget reports logged during a test: `reports()` returns the
 * totals of the operations that finished over budget, `reports.exceeded()`
 * the lines logged the moment an operation went over it. Loads that run
 * outside an operation report on their own, so the counting tests call this
 * as well, to keep those reports out of the test output.
 */
function captureReports(t) {
  const warn = t.mock.method(console, 'warn', () => {});
  const lines = (message) =>
    warn.mock.calls
      .filter((call) => call.arguments[0] === `[content-gateway] ${message}`)
      .map((call) => JSON.parse(call.arguments[1]));
  const reports = () => lines('storage request total over budget');
  reports.exceeded = () => lines('storage request budget exceeded');
  return reports;
}

test('a site page costs one storage request cold and none while cached', async () => {
  const { s3, gateway } = createContentGateway();
  s3.objects.set('site/pt-BR/home/index.md', '---\ntitle: Home\n---\nBody');

  await gateway.loadPage('home', 'pt-BR');
  assert.deepEqual(count(s3.takeRequests()), { list: 0, get: 1 });

  await gateway.loadPage('home', 'pt-BR');
  assert.deepEqual(count(s3.takeRequests()), { list: 0, get: 0 });
});

test('a missing site page costs one storage request on every request', async () => {
  const { s3, gateway } = createContentGateway();

  assert.equal(await gateway.loadPageOrNull('careers', 'en'), null);
  assert.equal(await gateway.loadPageOrNull('careers', 'en'), null);
  assert.deepEqual(count(s3.takeRequests()), { list: 0, get: 2 });
});

test('a cold Journal listing costs one LIST plus one GET per post of the locale', async (t) => {
  captureReports(t);
  const { s3, gateway } = createContentGateway();
  const posts = publishJournal(s3, POSTS);

  assert.equal((await gateway.loadAllPosts('pt-BR')).length, posts['pt-BR']);
  assert.deepEqual(count(s3.takeRequests()), { list: 1, get: posts['pt-BR'] });

  assert.equal((await gateway.loadAllPosts('en')).length, posts.en);
  assert.deepEqual(count(s3.takeRequests()), { list: 1, get: posts.en });

  await gateway.loadAllPosts('pt-BR');
  await gateway.loadAllPosts('en');
  assert.deepEqual(count(s3.takeRequests()), { list: 0, get: 0 });
});

test('a cold article costs both locale listings plus a LIST and a GET for the post', async (t) => {
  captureReports(t);
  const { s3, gateway } = createContentGateway();
  const posts = publishJournal(s3, POSTS);
  const slug = '2026-01-02-post-1';

  const resolved = await gateway.resolvePostSlug(slug, 'pt-BR');
  assert.deepEqual(count(s3.takeRequests()), { list: 2, get: posts['pt-BR'] + posts.en });

  await gateway.loadPost(resolved.canonicalSlug, 'pt-BR');
  assert.deepEqual(count(s3.takeRequests()), { list: 1, get: 1 });

  await gateway.resolvePostSlug(slug, 'pt-BR');
  await gateway.loadPost(resolved.canonicalSlug, 'pt-BR');
  assert.deepEqual(count(s3.takeRequests()), { list: 0, get: 0 });
});

test('the LIST costs one request per page of keys', async (t) => {
  captureReports(t);
  const { s3, gateway } = createContentGateway({ pageSize: 25 });
  const posts = publishJournal(s3, POSTS);
  const pages = Math.ceil(s3.objects.size / 25);

  await gateway.loadAllPosts('en');
  assert.deepEqual(count(s3.takeRequests()), { list: pages, get: posts.en });
});

test('an asset costs one storage request, found or not, and the answer is cached', async () => {
  const { s3, gateway } = createContentGateway();
  s3.objects.set('blog/covers/post-v1.jpg', 'jpeg bytes');

  assert.ok(await gateway.getAsset('blog/covers/', 'post-v1.jpg'));
  assert.equal(await gateway.getAsset('blog/covers/', 'absent.jpg'), null);
  assert.deepEqual(count(s3.takeRequests()), { list: 0, get: 2 });

  await gateway.getAsset('blog/covers/', 'post-v1.jpg');
  await gateway.getAsset('blog/covers/', 'absent.jpg');
  assert.deepEqual(count(s3.takeRequests()), { list: 0, get: 0 });
});

test('the Journal committed in blog-posts/ costs 1 + N requests per locale today', async (t) => {
  captureReports(t);
  const { s3, gateway } = createContentGateway();
  const directory = new URL('../blog-posts/', import.meta.url);
  const files = readdirSync(directory).filter((name) => name.endsWith('.md'));
  for (const name of files) {
    s3.objects.set(`blog/posts/${name}`, readFileSync(new URL(name, directory), 'utf8'));
  }

  for (const locale of ['pt-BR', 'en']) {
    const posts = files.filter((name) => name.endsWith(`.${locale}.md`)).length;
    await gateway.loadAllPosts(locale);
    const requests = count(s3.takeRequests());
    assert.deepEqual(requests, { list: 1, get: posts });
    t.diagnostic(`${locale}: ${posts} posts, ${requests.list + requests.get} storage requests`);
  }
});

test('the default budget is the guardrail threshold: 15 passes, 16 is reported', async (t) => {
  const reports = captureReports(t);
  const { budget } = createContentGateway();
  assert.equal(budget.DEFAULT_STORAGE_REQUEST_BUDGET, 15);

  const operation = (name, requests) =>
    budget.withStorageBudget(name, async () => {
      for (let i = 0; i < requests; i += 1) budget.countStorageRequest();
    });

  await operation('at the budget', 15);
  assert.deepEqual(reports.exceeded(), []);
  assert.deepEqual(reports(), []);

  await operation('over the budget', 16);
  const report = { operation: 'over the budget', requests: 16, budget: 15, loads: {} };
  assert.deepEqual(reports.exceeded(), [report]);
  assert.deepEqual(reports(), [report]);
});

test('a cold article request is reported at its 16th request and again with its total', async (t) => {
  const reports = captureReports(t);
  const { s3, gateway, budget } = createContentGateway();
  const posts = publishJournal(s3, POSTS);
  const slug = '2026-01-02-post-1';

  await budget.withStorageBudget('GET /blog/[slug]', async () => {
    const resolved = await gateway.resolvePostSlug(slug, 'pt-BR');
    return gateway.loadPost(resolved.canonicalSlug, 'pt-BR');
  });

  assert.deepEqual(reports.exceeded(), [
    { operation: 'GET /blog/[slug]', requests: 16, budget: 15, loads: { 'posts:pt-BR': 16 } }
  ]);
  assert.deepEqual(reports(), [
    {
      operation: 'GET /blog/[slug]',
      requests: posts['pt-BR'] + posts.en + 4,
      budget: 15,
      loads: {
        'posts:pt-BR': posts['pt-BR'] + 1,
        'posts:en': posts.en + 1,
        [`post:pt-BR:${slug}`]: 2
      }
    }
  ]);
});

test('operations within the budget are not reported', async (t) => {
  const reports = captureReports(t);
  const { s3, gateway, budget } = createContentGateway();
  s3.objects.set('site/en/home/index.md', '---\ntitle: Home\n---\nBody');
  s3.objects.set('assets/ui/bitmap.svg', '<svg/>');

  await budget.withStorageBudget('GET /', () => gateway.loadPage('home', 'en'));
  await budget.withStorageBudget('GET /api/assets/[...path]', () =>
    gateway.getAsset('assets/', 'ui/bitmap.svg')
  );

  assert.equal(s3.takeRequests().length, 2);
  assert.deepEqual(reports.exceeded(), []);
  assert.deepEqual(reports(), []);
});

test('a request answered from a stale listing is charged for the revalidation it starts', async (t) => {
  const clock = controlClock(t);
  const reports = captureReports(t);
  const { s3, gateway, budget } = createContentGateway();
  const posts = publishJournal(s3, POSTS);

  await gateway.loadAllPosts('en');
  s3.takeRequests();
  const cold = reports().length;
  clock.advance(61_000);

  const served = await budget.withStorageBudget('GET /journal', () => gateway.loadAllPosts('en'));
  assert.equal(served.length, posts.en);
  // The response is ready, the revalidation is still running: no total yet.
  assert.equal(reports().length, cold);

  await backgroundWorkSettled();
  assert.deepEqual(count(s3.takeRequests()), { list: 1, get: posts.en });
  assert.deepEqual(reports().slice(cold), [
    {
      operation: 'GET /journal',
      requests: posts.en + 1,
      budget: 15,
      loads: { 'posts:en': posts.en + 1 }
    }
  ]);
});

test('a load started outside any operation is reported under its own label', async (t) => {
  const reports = captureReports(t);
  const { s3, gateway } = createContentGateway();
  const posts = publishJournal(s3, POSTS);

  await gateway.loadAllPosts('pt-BR');

  assert.deepEqual(reports.exceeded(), [
    { operation: 'posts:pt-BR', requests: 16, budget: 15, loads: {} }
  ]);
  assert.deepEqual(reports(), [
    { operation: 'posts:pt-BR', requests: posts['pt-BR'] + 1, budget: 15, loads: {} }
  ]);
});

test('a failed load still closes its operation', async (t) => {
  const reports = captureReports(t);
  const { s3, gateway, budget } = createContentGateway({ pageSize: 1 });
  publishJournal(s3, POSTS);
  // Fail on the 17th LIST page, after the operation is already over budget.
  const send = s3.module.S3Client.prototype.send;
  let sent = 0;
  t.mock.method(s3.module.S3Client.prototype, 'send', function (command) {
    sent += 1;
    if (sent === 17) return Promise.reject(new Error('storage unreachable'));
    return send.call(this, command);
  });

  await assert.rejects(
    budget.withStorageBudget('GET /journal', () => gateway.loadAllPosts('en')),
    { status: 503 }
  );

  assert.deepEqual(reports(), [
    { operation: 'GET /journal', requests: 17, budget: 15, loads: { 'posts:en': 17 } }
  ]);
});

test('an operation that stops answering after going over budget is already reported', async (t) => {
  const reports = captureReports(t);
  const { s3, gateway, budget } = createContentGateway();
  const posts = publishJournal(s3, POSTS);
  // The listing reads its posts in order: the 20th request is the 19th post.
  const release = s3.hold((request) => request.key === `blog/posts/${journalSlug(19)}.en.md`);

  let finished = false;
  const operation = budget
    .withStorageBudget('GET /journal', () => gateway.loadAllPosts('en'))
    .finally(() => (finished = true));
  await backgroundWorkSettled();

  assert.equal(s3.requests.length, 20);
  assert.equal(finished, false);
  assert.deepEqual(reports.exceeded(), [
    { operation: 'GET /journal', requests: 16, budget: 15, loads: { 'posts:en': 16 } }
  ]);
  assert.deepEqual(reports(), []);

  release();
  await operation;
  assert.deepEqual(reports(), [
    {
      operation: 'GET /journal',
      requests: posts.en + 1,
      budget: 15,
      loads: { 'posts:en': posts.en + 1 }
    }
  ]);
  assert.equal(reports.exceeded().length, 1);
});

test('a listing revalidation that keeps failing is paid again by each request, with no TTL window in between', async (t) => {
  const clock = controlClock(t);
  const reports = captureReports(t);
  const { s3, gateway, budget } = createContentGateway();
  publishJournal(s3, POSTS);

  const warm = await gateway.loadAllPosts('en');
  s3.takeRequests();
  const cold = { exceeded: reports.exceeded().length, totals: reports().length };
  clock.advance(61_000);
  // The 17th post cannot be read: a revalidation fails at its 18th request.
  s3.failWith(
    new Error('storage unreachable'),
    (request) => request.key === `blog/posts/${journalSlug(17)}.en.md`
  );

  const attempt = {
    operation: 'GET /journal',
    requests: 18,
    budget: 15,
    loads: { 'posts:en': 18 }
  };
  for (let attempts = 1; attempts <= 3; attempts += 1) {
    // The clock does not move between the attempts.
    const served = await budget.withStorageBudget('GET /journal', () => gateway.loadAllPosts('en'));
    assert.deepEqual(served, warm, 'the stale listing is still served');
    await backgroundWorkSettled();

    assert.equal(s3.takeRequests().length, 18);
    assert.equal(reports.exceeded().length - cold.exceeded, attempts);
    assert.deepEqual(reports().slice(cold.totals), Array(attempts).fill(attempt));
  }
});

test('CONTENT_STORAGE_REQUEST_BUDGET overrides the budget; invalid values fall back to 15', async (t) => {
  const reports = captureReports(t);
  t.after(() => delete process.env.CONTENT_STORAGE_REQUEST_BUDGET);
  const requestsReportedWith = async (value, requests) => {
    process.env.CONTENT_STORAGE_REQUEST_BUDGET = value;
    const { budget } = createContentGateway();
    const before = reports().length;
    await budget.withStorageBudget('operation', async () => {
      for (let i = 0; i < requests; i += 1) budget.countStorageRequest();
    });
    return reports().slice(before);
  };

  assert.deepEqual(await requestsReportedWith('2', 2), []);
  assert.deepEqual(reports.exceeded(), []);
  assert.deepEqual(await requestsReportedWith('2', 4), [
    { operation: 'operation', requests: 4, budget: 2, loads: {} }
  ]);
  assert.deepEqual(reports.exceeded(), [
    { operation: 'operation', requests: 3, budget: 2, loads: {} }
  ]);
  for (const invalid of ['0', '-4', '2.5', 'many', '']) {
    assert.deepEqual(await requestsReportedWith(invalid, 15), []);
    assert.equal((await requestsReportedWith(invalid, 16))[0].budget, 15);
  }
});

test('concurrent operations never share counts, whatever the interleaving', async (t) => {
  const reports = captureReports(t);
  process.env.CONTENT_STORAGE_REQUEST_BUDGET = '3';
  t.after(() => delete process.env.CONTENT_STORAGE_REQUEST_BUDGET);
  const { budget } = createContentGateway();

  for (let seed = 1; seed <= 200; seed += 1) {
    const random = seededRandom(seed);
    const pause = () =>
      random.chance(0.5) ? Promise.resolve() : new Promise((resolve) => setImmediate(resolve));
    const before = reports().length;
    const beforeExceeded = reports.exceeded().length;
    const expected = [];
    const background = [];

    await Promise.all(
      Array.from({ length: 2 + random.int(5) }, (_, index) => {
        const name = `seed ${seed} operation ${index}`;
        const loads = {};
        let requests = 0;
        const request = () => {
          budget.countStorageRequest();
          requests += 1;
        };
        const plan = Array.from({ length: random.int(4) }, () => ({
          label: `load ${random.int(2)}`,
          requests: random.int(7),
          awaited: random.chance(0.6),
          fails: random.chance(0.2)
        }));
        const direct = random.int(3);

        return budget
          .withStorageBudget(name, async () => {
            for (const step of plan) {
              const load = budget.trackLoad(step.label, async () => {
                for (let i = 0; i < step.requests; i += 1) {
                  await pause();
                  request();
                  loads[step.label] = (loads[step.label] ?? 0) + 1;
                }
                if (step.fails) throw new Error('load failed');
              });
              if (step.awaited) await load.catch(() => {});
              else background.push(load.catch(() => {}));
            }
            for (let i = 0; i < direct; i += 1) {
              await pause();
              request();
            }
          })
          .then(() => expected.push({ name, loads, requests: () => requests }));
      })
    );
    await Promise.all(background);
    await backgroundWorkSettled();

    const reported = reports().slice(before);
    const overBudget = expected.filter((operation) => operation.requests() > 3);
    assert.deepEqual(
      reports
        .exceeded()
        .slice(beforeExceeded)
        .map((report) => [report.operation, report.requests])
        .sort(),
      overBudget.map((operation) => [operation.name, 4]).sort(),
      `seed ${seed}: each over-budget operation is reported once at its 4th request`
    );
    assert.deepEqual(
      reported.map((report) => report.operation).sort(),
      overBudget.map((operation) => operation.name).sort(),
      `seed ${seed}: exactly the over-budget operations are reported, once each`
    );
    for (const operation of overBudget) {
      assert.deepEqual(
        reported.find((report) => report.operation === operation.name),
        {
          operation: operation.name,
          requests: operation.requests(),
          budget: 3,
          loads: operation.loads
        },
        `seed ${seed}`
      );
    }
  }
});

test('the handle hook runs each request as one operation named by its route', async (t) => {
  const reports = captureReports(t);
  const { s3, gateway, budget } = createContentGateway();
  const posts = publishJournal(s3, POSTS);
  const handle = loadHandleHook({ gateway, budget });

  const response = await handle({
    event: hookEvent('https://merovelis.com/pt-br/journal?utm_source=x', { routeId: '/journal' }),
    resolve: async () => {
      await gateway.loadAllPosts('pt-BR');
      return new Response('<html></html>', { headers: { 'content-type': 'text/html' } });
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
  assert.equal(reports.exceeded()[0].operation, 'GET /journal');
  assert.deepEqual(reports(), [
    {
      operation: 'GET /journal',
      requests: posts['pt-BR'] + 1,
      budget: 15,
      loads: { 'posts:pt-BR': posts['pt-BR'] + 1 }
    }
  ]);

  await handle({
    event: hookEvent('https://merovelis.com/pt-br/nowhere'),
    resolve: async () => {
      for (let i = 0; i < 16; i += 1) budget.countStorageRequest();
      return new Response('Not found', { status: 404 });
    }
  });
  assert.equal(reports()[1].operation, 'GET unmatched');
});
