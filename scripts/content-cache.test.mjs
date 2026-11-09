import assert from 'node:assert/strict';
import test from 'node:test';
import {
  backgroundWorkSettled,
  controlClock,
  createContentGateway,
  publishJournal
} from './test-support/content-gateway.mjs';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';
import { seededRandom } from './test-support/seeded-random.mjs';

// Size bound, eviction and failure visibility of the content caches (RBX
// engineering guardrail 1.3), and what they do while Object Storage is down.

const { SwrCache } = await importTypeScriptModule(
  new URL('../src/lib/server/content/cache.ts', import.meta.url)
);
const { monitoredCache } = await importTypeScriptModule(
  new URL('../src/lib/server/content/cache-monitor.ts', import.meta.url)
);

const TTL = 100;
const originDown = async () => {
  throw new Error('origin down');
};

/**
 * A cache that records what it evicts, which revalidations fail and which
 * loaded values it does not keep.
 */
function observedCache(maxEntries, options = {}) {
  const evicted = [];
  const refreshErrors = [];
  const notCached = [];
  const cache = new SwrCache(TTL, {
    maxEntries,
    onEvict: (key) => evicted.push(key),
    onRefreshError: (key) => refreshErrors.push(key),
    onNotCached: (key) => notCached.push(key),
    ...options
  });
  return { cache, evicted, refreshErrors, notCached };
}

/** A load the test settles by hand. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { load: () => promise, resolve, reject };
}

/** Collect the `[content-cache]` lines logged during a test. */
function captureCacheLines(t) {
  const warn = t.mock.method(console, 'warn', () => {});
  return () =>
    warn.mock.calls
      .filter((call) => String(call.arguments[0]).startsWith('[content-cache]'))
      .map((call) => ({ message: call.arguments[0], ...JSON.parse(call.arguments[1]) }));
}

test('a cache cannot be created without a positive integer bound', () => {
  for (const maxEntries of [undefined, 0, -1, 1.5, Infinity, '8']) {
    assert.throws(() => new SwrCache(TTL, { maxEntries }), RangeError);
  }
  assert.equal(new SwrCache(TTL, { maxEntries: 1 }).size, 0);
});

test('a full cache evicts the least recently read entry and reports it', async () => {
  const { cache, evicted } = observedCache(2);

  await cache.get('a', async () => 'A');
  await cache.get('b', async () => 'B');
  await cache.get('a', originDown); // read: "b" is now the least recently read
  await cache.get('c', async () => 'C');

  assert.equal(cache.size, 2);
  assert.deepEqual(evicted, ['b']);
  assert.equal(await cache.get('a', originDown), 'A');
  assert.equal(await cache.get('c', originDown), 'C');
  await assert.rejects(cache.get('b', originDown), /origin down/);
});

test('a failed load adds nothing and evicts nothing', async () => {
  const { cache, evicted } = observedCache(2);
  await cache.get('a', async () => 'A');
  await cache.get('b', async () => 'B');

  for (const key of ['c', 'd', 'e']) {
    await assert.rejects(cache.get(key, originDown), /origin down/);
  }

  assert.equal(cache.size, 2);
  assert.deepEqual(evicted, []);
  assert.equal(await cache.get('a', originDown), 'A');
  assert.equal(await cache.get('b', originDown), 'B');
});

test('a failed revalidation keeps the stale entry, for any age, and is reported', async (t) => {
  const clock = controlClock(t);
  const { cache, evicted, refreshErrors } = observedCache(1);
  await cache.get('a', async () => 'A');

  for (const age of [TTL, 10 * TTL, 1000 * TTL]) {
    clock.advance(age);
    assert.equal(await cache.get('a', originDown), 'A');
    await backgroundWorkSettled();
  }

  assert.deepEqual(refreshErrors, ['a', 'a', 'a']);
  assert.deepEqual(evicted, []);

  // The origin is back: the next read still answers stale, then the new value.
  assert.equal(await cache.get('a', async () => 'A2'), 'A');
  await backgroundWorkSettled();
  assert.equal(await cache.get('a', originDown), 'A2');
});

test('a revalidation that outlives its entry does not bring the entry back', async (t) => {
  const clock = controlClock(t);
  const { cache, evicted } = observedCache(1);
  await cache.get('a', async () => 'A');
  clock.advance(TTL);

  let finishRevalidation;
  await cache.get('a', () => new Promise((resolve) => (finishRevalidation = resolve)));
  await cache.get('b', async () => 'B'); // evicts "a" while its revalidation runs
  finishRevalidation('A2');
  await backgroundWorkSettled();

  assert.deepEqual(evicted, ['a']);
  assert.equal(cache.size, 1);
  assert.equal(await cache.get('b', originDown), 'B');
});

test('a load answered after the origin failed is served, but pushes nothing out of a full cache', async () => {
  const { cache, evicted, notCached } = observedCache(2);
  await cache.get('a', async () => 'A');
  await cache.get('b', async () => 'B');

  // "c" is requested while the origin still answers. The answer is slow.
  const slow = deferred();
  const reader = cache.get('c', slow.load);
  // The origin goes down, and another load finds out.
  await assert.rejects(cache.get('d', originDown), /origin down/);
  // Only then the answer for "c" arrives.
  slow.resolve('C');

  assert.equal(await reader, 'C');
  assert.deepEqual(evicted, []);
  assert.deepEqual(notCached, ['c']);
  assert.equal(cache.size, 2);
  assert.equal(await cache.get('a', originDown), 'A');
  assert.equal(await cache.get('b', originDown), 'B');

  // The origin answers again: a load that saw no failure evicts as usual.
  assert.equal(await cache.get('c', async () => 'C2'), 'C2');
  assert.deepEqual(evicted, ['a']);
  assert.deepEqual(notCached, ['c']);
});

test('a failed revalidation holds evictions like a failed load does', async (t) => {
  const clock = controlClock(t);
  const { cache, evicted, notCached } = observedCache(1);
  await cache.get('a', async () => 'A');
  clock.advance(TTL);

  const slow = deferred();
  const reader = cache.get('b', slow.load);
  assert.equal(await cache.get('a', originDown), 'A'); // stale: the revalidation fails
  await backgroundWorkSettled();
  slow.resolve('B');

  assert.equal(await reader, 'B');
  assert.deepEqual(evicted, []);
  assert.deepEqual(notCached, ['b']);
  assert.equal(await cache.get('a', originDown), 'A');
});

test('a cache with room keeps a load that saw the origin fail', async () => {
  const { cache, evicted, notCached } = observedCache(2);
  await cache.get('a', async () => 'A');

  const slow = deferred();
  const reader = cache.get('b', slow.load);
  await assert.rejects(cache.get('c', originDown), /origin down/);
  slow.resolve('B');

  assert.equal(await reader, 'B');
  assert.equal(cache.size, 2);
  assert.deepEqual([evicted, notCached], [[], []]);
  assert.equal(await cache.get('b', originDown), 'B');
});

test('caches of one origin hold evictions together; unrelated caches do not', async () => {
  const origin = { count: 0 };
  const pages = observedCache(1, { origin });
  const assets = observedCache(1, { origin });
  const other = observedCache(1);
  await assets.cache.get('cover', async () => 'COVER');
  await other.cache.get('x', async () => 'X');

  const slowAsset = deferred();
  const slowOther = deferred();
  const assetReader = assets.cache.get('bogus', slowAsset.load);
  const otherReader = other.cache.get('y', slowOther.load);
  await assert.rejects(pages.cache.get('home', originDown), /origin down/);
  slowAsset.resolve(null);
  slowOther.resolve('Y');

  assert.equal(await assetReader, null);
  assert.deepEqual(assets.notCached, ['bogus']);
  assert.equal(await assets.cache.get('cover', originDown), 'COVER');
  assert.equal(origin.count, 1);

  assert.equal(await otherReader, 'Y');
  assert.deepEqual(other.evicted, ['x']);
});

test('a rejection that is an answer of the origin does not hold evictions', async () => {
  const notFound = new Error('not found');
  const { cache, evicted, notCached } = observedCache(1, {
    isOriginFailure: (err) => err !== notFound
  });
  await cache.get('a', async () => 'A');

  const slow = deferred();
  const reader = cache.get('b', slow.load);
  await assert.rejects(
    cache.get('c', async () => {
      throw notFound;
    }),
    /not found/
  );
  slow.resolve('B');

  assert.equal(await reader, 'B');
  assert.deepEqual(evicted, ['a']);
  assert.deepEqual(notCached, []);
});

test('property: the cache matches an LRU model for any sequence of reads, failures and clock jumps', async (t) => {
  const clock = controlClock(t);

  for (let seed = 1; seed <= 300; seed += 1) {
    const random = seededRandom(seed);
    const maxEntries = 1 + random.int(4);
    const { cache, evicted, refreshErrors, notCached } = observedCache(maxEntries);
    // key -> { value, fetchedAt }, least recently read first.
    const model = new Map();
    const expectedEvicted = [];
    const expectedRefreshErrors = [];
    let now = 0;

    for (let step = 0; step < 80; step += 1) {
      const at = `seed ${seed} step ${step}`;
      if (random.chance(0.2)) {
        const jump = random.int(250);
        clock.advance(jump);
        now += jump;
        continue;
      }

      const key = random.pick(['a', 'b', 'c', 'd', 'e', 'f']);
      const fails = random.chance(0.35);
      const loaded = `value ${step}`;
      let loads = 0;
      const outcome = await cache
        .get(key, async () => {
          loads += 1;
          if (fails) throw new Error('origin down');
          return loaded;
        })
        .then(
          (value) => ({ value }),
          (err) => ({ error: err.message })
        );
      await backgroundWorkSettled();

      const entry = model.get(key);
      if (entry) {
        const stale = now - entry.fetchedAt >= TTL;
        assert.deepEqual(outcome, { value: entry.value }, at);
        assert.equal(loads, stale ? 1 : 0, at);
        model.delete(key);
        model.set(key, entry);
        if (stale && fails) expectedRefreshErrors.push(key);
        if (stale && !fails) Object.assign(entry, { value: loaded, fetchedAt: now });
      } else if (fails) {
        assert.deepEqual(outcome, { error: 'origin down' }, at);
      } else {
        assert.deepEqual(outcome, { value: loaded }, at);
        if (model.size === maxEntries) {
          const oldest = model.keys().next().value;
          model.delete(oldest);
          expectedEvicted.push(oldest);
        }
        model.set(key, { value: loaded, fetchedAt: now });
      }

      assert.equal(cache.size, model.size, at);
      assert.ok(cache.size <= maxEntries, at);
      assert.deepEqual(evicted, expectedEvicted, at);
      assert.deepEqual(refreshErrors, expectedRefreshErrors, at);
      // One load at a time: none is in flight while another fails.
      assert.deepEqual(notCached, [], at);
    }

    // What the model still holds, the cache still serves without the origin.
    for (const [key, entry] of model) {
      assert.equal(await cache.get(key, originDown), entry.value, `seed ${seed} final ${key}`);
    }
    await backgroundWorkSettled();
  }
});

test('property: under any interleaving of reads, slow answers, failures and clock jumps the cache matches a model', async (t) => {
  const clock = controlClock(t);
  const seen = { evicted: 0, notCached: 0, refreshErrors: 0, joined: 0 };

  for (let seed = 1; seed <= 300; seed += 1) {
    const random = seededRandom(seed);
    const maxEntries = 1 + random.int(3);
    const { cache, evicted, refreshErrors, notCached } = observedCache(maxEntries);
    // The model. Entries: key -> { value, fetchedAt }, least recently read
    // first. Flights: key -> the one load in flight for that key.
    const entries = new Map();
    const flights = new Map();
    const expected = { evicted: [], refreshErrors: [], notCached: [] };
    let now = 0;
    let failures = 0;
    let serial = 0;

    const read = (key, at) => {
      const entry = entries.get(key);
      let starts = null;
      if (entry) {
        entries.delete(key);
        entries.set(key, entry);
        if (now - entry.fetchedAt >= TTL && !flights.has(key)) starts = 'refresh';
      } else if (!flights.has(key)) {
        starts = 'miss';
      }

      let started = null;
      const reader = cache.get(key, () => {
        assert.equal(started, null, `${at}: one load per read`);
        started = deferred();
        return started.load();
      });
      assert.equal(
        started !== null,
        starts !== null,
        `${at}: a load starts only when the model says so`
      );
      if (started) {
        flights.set(key, { ...started, kind: starts, failuresAtStart: failures, readers: [] });
      }

      if (entry) {
        const cached = entry.value;
        return reader.then((value) => assert.equal(value, cached, at));
      }
      // Not cached: the read waits for the flight of its key, even a
      // revalidation that outlived its entry.
      if (!started) seen.joined += 1;
      flights.get(key).readers.push(reader);
      return undefined;
    };

    const settle = async (key, at) => {
      const flight = flights.get(key);
      flights.delete(key);

      if (random.chance(0.4)) {
        failures += 1;
        if (flight.kind === 'refresh') expected.refreshErrors.push(key);
        flight.reject(new Error('origin down'));
        for (const reader of flight.readers) await assert.rejects(reader, /origin down/, at);
      } else {
        const value = `value ${(serial += 1)}`;
        const entry = entries.get(key);
        if (flight.kind === 'refresh') {
          // In place: the entry keeps its recency. Gone means it stays gone.
          if (entry) Object.assign(entry, { value, fetchedAt: now });
        } else if (entries.size < maxEntries) {
          entries.set(key, { value, fetchedAt: now });
        } else if (failures !== flight.failuresAtStart) {
          expected.notCached.push(key);
        } else {
          const oldest = entries.keys().next().value;
          entries.delete(oldest);
          expected.evicted.push(oldest);
          entries.set(key, { value, fetchedAt: now });
        }
        flight.resolve(value);
        for (const reader of flight.readers) assert.equal(await reader, value, at);
      }
      await backgroundWorkSettled();
    };

    const cachedReads = [];
    for (let step = 0; step < 120; step += 1) {
      const at = `seed ${seed} step ${step}`;
      const roll = random.int(10);
      if (roll < 5) {
        cachedReads.push(read(random.pick(['a', 'b', 'c', 'd', 'e']), at));
      } else if (roll < 8 && flights.size > 0) {
        await settle(random.pick([...flights.keys()]), at);
      } else {
        const jump = random.int(250);
        clock.advance(jump);
        now += jump;
      }
      await backgroundWorkSettled();

      assert.equal(cache.size, entries.size, at);
      assert.ok(cache.size <= maxEntries, at);
      assert.deepEqual(evicted, expected.evicted, at);
      assert.deepEqual(refreshErrors, expected.refreshErrors, at);
      assert.deepEqual(notCached, expected.notCached, at);
    }

    while (flights.size > 0) await settle(flights.keys().next().value, `seed ${seed} drain`);
    await Promise.all(cachedReads);
    assert.deepEqual(evicted, expected.evicted, `seed ${seed} drained`);
    assert.deepEqual(notCached, expected.notCached, `seed ${seed} drained`);

    // What the model still holds, the cache still serves without the origin.
    for (const [key, entry] of entries) {
      assert.equal(await cache.get(key, originDown), entry.value, `seed ${seed} final ${key}`);
    }
    await backgroundWorkSettled();

    seen.evicted += evicted.length;
    seen.notCached += notCached.length;
    seen.refreshErrors += refreshErrors.length;
  }

  // The seeds reach every branch of the model.
  for (const [what, times] of Object.entries(seen)) assert.ok(times > 100, `${what}: ${times}`);
});

test('the monitor logs the first event at once and folds the rest into one line per minute', (t) => {
  const clock = controlClock(t);
  const lines = captureCacheLines(t);
  const { maxEntries, onRefreshError, onEvict, onNotCached } = monitoredCache('post', 1024);
  assert.equal(maxEntries, 1024);

  onRefreshError('post:en:first', new Error('connect ECONNREFUSED'));
  for (let i = 0; i < 5; i += 1) onRefreshError('post:en:burst', new Error('ignored'));
  assert.deepEqual(lines(), [
    {
      message: '[content-cache] refresh failed, serving stale',
      cache: 'post',
      key: 'post:en:first',
      error: 'Error: connect ECONNREFUSED',
      failures: 1,
      total: 1
    }
  ]);

  clock.advance(60_000);
  // The gateway turns storage failures into a SvelteKit 503.
  onRefreshError('post:en:later', { status: 503, body: { message: 'Blog content unavailable' } });
  assert.deepEqual(lines()[1], {
    message: '[content-cache] refresh failed, serving stale',
    cache: 'post',
    key: 'post:en:later',
    error: '503 Blog content unavailable',
    failures: 6,
    total: 7
  });

  // Evictions are throttled on their own, not behind the refresh failures.
  onEvict('post:en:old');
  assert.deepEqual(lines()[2], {
    message: '[content-cache] entry evicted, cache is full',
    cache: 'post',
    key: 'post:en:old',
    maxEntries: 1024,
    evictions: 1,
    total: 1
  });

  onNotCached('post:en:late');
  onNotCached('post:en:later');
  assert.deepEqual(lines()[3], {
    message: '[content-cache] entry not cached, cache is full and storage failed',
    cache: 'post',
    key: 'post:en:late',
    maxEntries: 1024,
    notCached: 1,
    total: 1
  });
  assert.equal(lines().length, 4);

  onRefreshError('post:en:long', new Error('x'.repeat(5000)));
  clock.advance(60_000);
  onRefreshError('post:en:long', new Error('x'.repeat(5000)));
  assert.equal(lines()[4].error.length, 300);
});

test('while storage is down, everything cached keeps being served and nothing is evicted', async (t) => {
  const clock = controlClock(t);
  const lines = captureCacheLines(t);
  const { s3, gateway } = createContentGateway();
  publishJournal(s3, 5);
  s3.objects.set('site/pt-BR/home/index.md', '---\ntitle: Home\n---\nBody');
  s3.objects.set('blog/covers/post-v1.jpg', 'jpeg bytes');
  const slug = '2026-01-02-post-1';

  const read = async () => ({
    page: await gateway.loadPage('home', 'pt-BR'),
    listing: await gateway.loadAllPosts('pt-BR'),
    otherListing: await gateway.loadAllPosts('en'),
    resolved: await gateway.resolvePostSlug(slug, 'pt-BR'),
    post: await gateway.loadPost(slug, 'pt-BR'),
    cover: await gateway.getAsset('blog/covers/', 'post-v1.jpg'),
    missingCover: await gateway.getAsset('blog/covers/', 'absent.jpg')
  });
  const warm = await read();
  assert.equal(warm.listing.length, 6);
  assert.ok(warm.cover);
  assert.equal(warm.missingCover, null);

  s3.failWith(Object.assign(new Error('Service Unavailable'), { name: 'ServiceUnavailable' }));
  for (let round = 1; round <= 3; round += 1) {
    clock.advance(11 * 60_000); // past the TTL of every cache, assets included
    // Twice per round: the first read starts the failing revalidation, the
    // second proves that the failure did not replace what was cached.
    assert.deepEqual(await read(), warm, `round ${round}, first read`);
    await backgroundWorkSettled();
    assert.deepEqual(await read(), warm, `round ${round}, second read`);

    // Content that was never cached is unavailable, and asking for it does not
    // disturb what is cached.
    await assert.rejects(gateway.loadPage(`cold-${round}`, 'pt-BR'), { status: 503 });
    assert.equal(await gateway.getAsset('blog/covers/', `cold-${round}.jpg`), null);
    await backgroundWorkSettled();
  }

  const failures = lines().filter((line) => line.message.includes('refresh failed'));
  assert.deepEqual([...new Set(failures.map((line) => line.cache))].sort(), [
    'asset',
    'list',
    'page',
    'post'
  ]);
  assert.match(failures.find((line) => line.cache === 'asset').error, /^ServiceUnavailable: /);
  assert.equal(
    failures.find((line) => line.cache === 'page').error,
    '503 Content unavailable: home'
  );
  assert.deepEqual(
    lines().filter((line) => line.message.includes('evicted')),
    []
  );

  // Storage answers again: the next read is still stale, the one after is new.
  s3.failWith(null);
  s3.objects.set('site/pt-BR/home/index.md', '---\ntitle: Home, updated\n---\nBody');
  clock.advance(11 * 60_000);
  assert.equal((await gateway.loadPage('home', 'pt-BR')).title, 'Home');
  await backgroundWorkSettled();
  assert.equal((await gateway.loadPage('home', 'pt-BR')).title, 'Home, updated');
});

test('an asset lookup answered after storage failed does not push a cached asset out', async (t) => {
  const lines = captureCacheLines(t);
  const { s3, gateway } = createContentGateway();
  s3.objects.set('blog/covers/post-v1.jpg', 'jpeg bytes');

  // A real cover, then enough lookups of absent assets to fill the cache. The
  // cover is now the least recently read entry: the next one to be evicted.
  const cover = await gateway.getAsset('blog/covers/', 'post-v1.jpg');
  for (let i = 1; i < 256; i += 1) await gateway.getAsset('assets/', `bogus/${i}.jpg`);

  // One more lookup is sent while storage still answers. Its answer is slow.
  const release = s3.hold((request) => request.key === 'assets/bogus/late.jpg');
  const late = gateway.getAsset('assets/', 'bogus/late.jpg');
  await backgroundWorkSettled();
  // Storage goes down, and a page request finds out.
  s3.failWith(Object.assign(new Error('Service Unavailable'), { name: 'ServiceUnavailable' }));
  await assert.rejects(gateway.loadPage('home', 'pt-BR'), { status: 503 });
  // Only then the answer of the lookup arrives: "no such key".
  release();
  assert.equal(await late, null);
  await backgroundWorkSettled();

  // Storage is still down, so only the cache can answer this.
  assert.deepEqual(await gateway.getAsset('blog/covers/', 'post-v1.jpg'), cover);
  assert.deepEqual(lines(), [
    {
      message: '[content-cache] entry not cached, cache is full and storage failed',
      cache: 'asset',
      key: 'asset:assets/bogus/late.jpg',
      maxEntries: 256,
      notCached: 1,
      total: 1
    }
  ]);
});

test('a page that does not exist is an answer of storage: it does not hold evictions', async (t) => {
  const lines = captureCacheLines(t);
  const { s3, gateway } = createContentGateway();
  for (let i = 0; i < 256; i += 1) await gateway.getAsset('assets/', `bogus/${i}.jpg`);

  const release = s3.hold((request) => request.key === 'assets/bogus/late.jpg');
  const late = gateway.getAsset('assets/', 'bogus/late.jpg');
  await backgroundWorkSettled();
  assert.equal(await gateway.loadPageOrNull('careers', 'en'), null);
  release();
  assert.equal(await late, null);

  assert.deepEqual(
    lines().map((line) => line.message),
    ['[content-cache] entry evicted, cache is full']
  );
});

test('an asset lookup that fails is not remembered: the asset is back as soon as storage is', async (t) => {
  captureCacheLines(t);
  const { s3, gateway } = createContentGateway();
  s3.objects.set('assets/ui/bitmap.svg', '<svg/>');

  s3.failWith(new Error('storage unreachable'));
  assert.equal(await gateway.getAsset('assets/', 'ui/bitmap.svg'), null);

  s3.failWith(null);
  assert.ok(await gateway.getAsset('assets/', 'ui/bitmap.svg'));
});

test('lookups of assets that do not exist cannot grow the asset cache past its bound', async (t) => {
  const clock = controlClock(t);
  const lines = captureCacheLines(t);
  const { gateway } = createContentGateway();
  const lookUp = (name) => gateway.getAsset('assets/', `bogus/${name}.jpg`);

  // 256 entries fit. Each lookup beyond that evicts exactly one entry.
  for (let i = 0; i < 256 + 40; i += 1) assert.equal(await lookUp(i), null);
  assert.deepEqual(
    lines().map(({ cache, maxEntries, evictions, total }) => ({
      cache,
      maxEntries,
      evictions,
      total
    })),
    [{ cache: 'asset', maxEntries: 256, evictions: 1, total: 1 }]
  );

  clock.advance(60_000);
  await lookUp('one-more');
  const last = lines()[1];
  assert.deepEqual({ evictions: last.evictions, total: last.total }, { evictions: 40, total: 41 });
});
