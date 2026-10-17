import assert from 'node:assert/strict';
import test from 'node:test';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';

const { getPartnershipPrices, formatPartnershipPrice, partnershipPriceNote } =
  await importTypeScriptModule(new URL('../src/lib/content/partnership.ts', import.meta.url));
const { createPartnershipPricing } = await importTypeScriptModule(
  new URL('../src/lib/server/partnershipPricing.ts', import.meta.url)
);
const quote = {
  rates: { BTC: 0.0000025, EUR: 0.175, USD: 0.2 },
  updatedAt: '2026-10-16T12:00:00.000Z'
};
const response = (rates = quote.rates, currency = 'BRL') =>
  Response.json({ data: { currency, rates } });

test('Brazil keeps the BRL 8,000 offer even when international rates are available', () => {
  for (const rates of [null, quote]) {
    const prices = getPartnershipPrices('pt-BR', rates);
    assert.deepEqual(
      prices.map(({ currency, amount }) => ({ currency, amount })),
      [{ currency: 'BRL', amount: 8000 }]
    );
    assert.equal(formatPartnershipPrice('pt-BR', rates).replace(/\s/g, ' '), 'R$ 8.000');
    assert.equal(partnershipPriceNote('pt-BR', rates), 'Valor em reais (BRL).');
  }
});

test('international pricing converts all three currencies without exposing BRL', () => {
  const prices = getPartnershipPrices('en', quote);
  assert.deepEqual(
    prices.map(({ currency, amount }) => ({ currency, amount })),
    [
      { currency: 'BTC', amount: 0.02 },
      { currency: 'EUR', amount: 1400 },
      { currency: 'USD', amount: 1600 }
    ]
  );
  assert.match(prices[0].formatted, /BTC\s0\.02000000/);
  assert.match(prices[1].formatted, /EUR\s1,400\.00/);
  assert.match(prices[2].formatted, /USD\s1,600\.00/);
  assert.doesNotMatch(formatPartnershipPrice('en', quote), /BRL|R\$/);
  assert.match(partnershipPriceNote('en', quote), /16 Oct 2026, 12:00 UTC/);
  assert.match(partnershipPriceNote('en', quote), /Indicative conversions/);
});

test('missing exchange rates stay visible and never fall back to reais internationally', () => {
  assert.deepEqual(getPartnershipPrices('en'), []);
  assert.match(formatPartnershipPrice('en'), /quote temporarily unavailable/);
  assert.doesNotMatch(formatPartnershipPrice('en'), /BRL|R\$|8,000/);
});

test('concurrent readers share one bounded request and reuse the cached quote', async () => {
  let requests = 0;
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let now = Date.parse(quote.updatedAt);
  const getQuote = createPartnershipPricing(
    async (url, options) => {
      requests++;
      assert.equal(url, 'https://api.coinbase.com/v2/exchange-rates?currency=BRL');
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal instanceof AbortSignal);
      await gate;
      return response();
    },
    () => now
  );
  const pending = Array.from({ length: 50 }, () => getQuote());
  assert.equal(requests, 1);
  release();
  const results = await Promise.all(pending);
  assert.ok(results.every((result) => result === results[0]));
  assert.deepEqual(results[0], quote);
  now += 4 * 60_000;
  assert.deepEqual(await getQuote(), quote);
  assert.equal(requests, 1);
  now += 60_000;
  await getQuote();
  assert.equal(requests, 2);
});

test('failures preserve the dated quote for at most an hour and throttle further attempts', async () => {
  let now = Date.parse(quote.updatedAt);
  let requests = 0;
  const getQuote = createPartnershipPricing(
    async () => {
      requests++;
      if (requests > 1) throw new Error('offline');
      return response();
    },
    () => now
  );
  assert.deepEqual(await getQuote(), quote);
  now += 5 * 60_000;
  assert.deepEqual(await getQuote(), quote);
  assert.deepEqual(await getQuote(), quote);
  assert.equal(requests, 2);
  now += 56 * 60_000;
  assert.equal(await getQuote(), null);
  assert.equal(requests, 3);
  assert.equal(await getQuote(), null);
  assert.equal(requests, 3);
});

test('bad base currencies, malformed and incomplete rates never become public quotes', async () => {
  const invalid = [
    () => response(quote.rates, 'USD'),
    () => response({ EUR: 0.2, USD: 0.2 }),
    () => response({ ...quote.rates, BTC: 0 }),
    () => response({ ...quote.rates, EUR: -1 }),
    () => response({ ...quote.rates, USD: 'Infinity' }),
    () => response({ ...quote.rates, USD: true }),
    () => new Response('not json'),
    () => new Response('', { status: 503 }),
    () => new Response('x'.repeat(128 * 1024 + 1))
  ];
  for (const makeResponse of invalid) {
    let requests = 0;
    const getQuote = createPartnershipPricing(async () => {
      requests++;
      return makeResponse();
    });
    assert.equal(await getQuote(), null);
    assert.equal(await getQuote(), null);
    assert.equal(requests, 1);
  }
});

test('a timed-out request aborts, releases all readers and allows a later recovery', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let now = Date.parse(quote.updatedAt);
  let requests = 0;
  const getQuote = createPartnershipPricing(
    async (_url, { signal }) => {
      requests++;
      if (requests > 1) return response();
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      });
    },
    () => now
  );
  const pending = [getQuote(), getQuote()];
  t.mock.timers.tick(2000);
  assert.deepEqual(await Promise.all(pending), [null, null]);
  assert.equal(requests, 1);
  now += 5 * 60_000;
  assert.ok(await getQuote());
  assert.equal(requests, 2);
});
