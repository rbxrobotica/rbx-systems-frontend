import type { PartnershipExchangeRates } from '$lib/content/partnership';

const RATES_URL = 'https://api.coinbase.com/v2/exchange-rates?currency=BRL';
const CACHE_MS = 5 * 60_000;
const MAX_AGE_MS = 60 * 60_000;
const TIMEOUT_MS = 2000;
const MAX_BYTES = 128 * 1024;

/** One bounded public request per refresh, shared across concurrent readers.
 * Keep one quote for at most an hour on failure, with its original timestamp.
 * No timers, retries, browser requests, credentials or visitor data.
 */
export function createPartnershipPricing(
  request: typeof fetch = fetch,
  now: () => number = Date.now
) {
  let cached: PartnershipExchangeRates | null = null;
  let retryAfter = 0;
  let pending: Promise<PartnershipExchangeRates | null> | null = null;

  const usableQuote = () =>
    cached && now() - Date.parse(cached.updatedAt) <= MAX_AGE_MS ? cached : null;

  async function refresh(): Promise<PartnershipExchangeRates | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await request(RATES_URL, {
        signal: controller.signal,
        redirect: 'error',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok || !response.body) throw new Error('rates_unavailable');
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BYTES) throw new Error('rates_too_large');
          chunks.push(value);
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const body = JSON.parse(new TextDecoder().decode(bytes));
      const rates = Object.fromEntries(
        ['BTC', 'EUR', 'USD'].map((currency) => {
          const raw = body?.data?.rates?.[currency];
          return [currency, typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN];
        })
      ) as PartnershipExchangeRates['rates'];
      if (
        body?.data?.currency !== 'BRL' ||
        Object.values(rates).some((rate) => !Number.isFinite(rate) || rate <= 0)
      ) {
        throw new Error('rates_invalid');
      }
      cached = { rates, updatedAt: new Date(now()).toISOString() };
      return cached;
    } catch {
      console.warn('[partnership-pricing] rates unavailable', {
        fallback: usableQuote() ? 'dated_quote' : 'unavailable'
      });
      return usableQuote();
    } finally {
      clearTimeout(timeout);
      retryAfter = now() + CACHE_MS;
    }
  }

  return async function getQuote(): Promise<PartnershipExchangeRates | null> {
    if (now() < retryAfter) return usableQuote();
    if (!pending) pending = refresh().finally(() => (pending = null));
    return pending;
  };
}

export const getPartnershipExchangeRates = createPartnershipPricing();
