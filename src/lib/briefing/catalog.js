/**
 * Briefing BTC public plan catalog (display-only mirror).
 *
 * The server is the source of truth for pricing: rbx-commerce resolves every
 * `plan_id` against `internal/checkout/handler.go` and never trusts an amount
 * from the browser. This module exists so the subscription modal can render
 * prices, discounts and totals before the request is made, keyed by the same
 * plan ids. Amounts are integers in the smallest currency unit (cents).
 *
 * Plain JavaScript with JSDoc types so `scripts/briefing-catalog.test.mjs`
 * can import it under node without a TypeScript step.
 */

/** @typedef {'pt-BR' | 'en'} Locale */
/** @typedef {'BRL' | 'USD'} Currency */
/** @typedef {'monthly' | 'annual'} Billing */
/** @typedef {'individual' | 'team'} Audience */
/** @typedef {'free' | 'pro'} Tier */

/**
 * @typedef {object} PaidPlan
 * @property {string} id            rbx-commerce plan_id
 * @property {Audience} audience
 * @property {Billing} billing
 * @property {Currency} currency
 * @property {number} amount        charged per unit and cycle (per seat on team plans)
 * @property {number} listAmount    undiscounted reference price per unit and cycle
 * @property {number} discountPct   published discount against listAmount
 * @property {PaymentMethod} method   default method for the plan's currency
 */

/**
 * Canonical authenticated entrypoint for the product (rbx-governance
 * ADR-0014): the Free tier reads the briefing here after a Google sign-in.
 */
export const BRIEFING_HUB_URL = 'https://app.merovelis.com/briefing-btc';

/** @typedef {'pix' | 'usdt' | 'card'} PaymentMethod */

/**
 * Payment methods a currency can be paid with, first entry is the default.
 * BRL: Pix through Asaas. USD: USDT through the RBX BTCPay Server (owner
 * preference) or card through Payrexx.
 * @type {Record<Currency, PaymentMethod[]>}
 */
export const PAYMENT_METHODS = { BRL: ['pix'], USD: ['usdt', 'card'] };

/** Team plans sell this many seats on one invoice. Mirrors the server bounds. */
export const TEAM_MIN_SEATS = 2;
export const TEAM_MAX_SEATS = 50;

/** Discounts published on the plan cards. The server catalog encodes the same ratios. */
export const MONTHLY_DISCOUNT_PCT = 40;
export const ANNUAL_DISCOUNT_PCT = 50;

/**
 * Whether the cards show the list price struck through next to the discount
 * chip (the DeepLearning.AI pattern the owner asked for). The list price is a
 * reference price no cycle sells at, which the Zurich-coded LP rules read as
 * an anchor; this single switch turns the anchor off and leaves only the real
 * prices on screen if that decision changes.
 */
export const SHOW_LIST_PRICE = true;

/** @type {Record<Currency, { monthlyList: number }>} list price per month, per currency */
const LIST_PER_MONTH = {
  BRL: { monthlyList: 6500 },
  USD: { monthlyList: 2000 }
};

/**
 * @param {Currency} currency
 * @param {Billing} billing
 * @returns {{ amount: number, listAmount: number, discountPct: number }}
 */
function priceFor(currency, billing) {
  // eslint-disable-next-line security/detect-object-injection -- currency is 'BRL' or 'USD', the Currency type
  const monthlyList = LIST_PER_MONTH[currency].monthlyList;
  if (billing === 'annual') {
    const listAmount = monthlyList * 12;
    return { amount: listAmount / 2, listAmount, discountPct: ANNUAL_DISCOUNT_PCT };
  }
  return {
    amount: (monthlyList * (100 - MONTHLY_DISCOUNT_PCT)) / 100,
    listAmount: monthlyList,
    discountPct: MONTHLY_DISCOUNT_PCT
  };
}

/** @type {PaidPlan[]} */
export const PAID_PLANS = [];
for (const audience of /** @type {Audience[]} */ (['individual', 'team'])) {
  for (const currency of /** @type {Currency[]} */ (['BRL', 'USD'])) {
    for (const billing of /** @type {Billing[]} */ (['monthly', 'annual'])) {
      const tier = audience === 'team' ? 'team' : 'pro';
      PAID_PLANS.push({
        id: `briefing-${tier}-${billing}-${currency.toLowerCase()}`,
        audience,
        billing,
        currency,
        // eslint-disable-next-line security/detect-object-injection -- currency iterates the literal list of the loop above
        method: PAYMENT_METHODS[currency][0],
        ...priceFor(currency, billing)
      });
    }
  }
}

/**
 * @param {Locale} locale
 * @returns {Currency}
 */
export function currencyForLocale(locale) {
  return locale === 'pt-BR' ? 'BRL' : 'USD';
}

/**
 * @param {Audience} audience
 * @param {Billing} billing
 * @param {Currency} currency
 * @returns {PaidPlan}
 */
export function findPlan(audience, billing, currency) {
  const plan = PAID_PLANS.find(
    (p) => p.audience === audience && p.billing === billing && p.currency === currency
  );
  if (!plan) throw new Error(`no plan for ${audience}/${billing}/${currency}`);
  return plan;
}

/**
 * @param {number} seats
 * @returns {number}
 */
export function clampSeats(seats) {
  if (!Number.isFinite(seats)) return TEAM_MIN_SEATS;
  return Math.min(TEAM_MAX_SEATS, Math.max(TEAM_MIN_SEATS, Math.trunc(seats)));
}

/**
 * Format an amount in the smallest unit for display. Whole amounts drop the
 * decimals (R$ 39, $12); fractional ones keep two (R$ 32,50). Pass
 * `alwaysDecimals` for the free tier's R$ 0,00 / $0.00.
 * @param {number} amount
 * @param {Currency} currency
 * @param {Locale} locale
 * @param {{ alwaysDecimals?: boolean }} [options]
 * @returns {string}
 */
export function formatAmount(amount, currency, locale, options = {}) {
  const value = amount / 100;
  const fractional = options.alwaysDecimals === true || Math.round(amount) % 100 !== 0;
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractional ? 2 : 0,
    maximumFractionDigits: fractional ? 2 : 0
  }).format(value);
  // ICU separates symbol and number with U+00A0 (pt-BR) or nothing (en) and
  // some versions emit U+202F. Normalize to U+00A0 so the price never wraps
  // between "R$" and the number and so output is stable across ICU builds.
  return formatted.replace(/\u202f/g, '\u00a0');
}

/**
 * Per-month equivalent of a plan (annual amount split over twelve months).
 * @param {PaidPlan} plan
 * @returns {number}
 */
export function perMonthAmount(plan) {
  return plan.billing === 'annual' ? plan.amount / 12 : plan.amount;
}

/**
 * @param {PaidPlan} plan
 * @param {number} seats
 * @returns {number}
 */
export function totalAmount(plan, seats) {
  return plan.amount * (plan.audience === 'team' ? clampSeats(seats) : 1);
}

/**
 * @typedef {object} SubscribeParams
 * @property {boolean} open       open the modal on page load
 * @property {Audience} audience
 * @property {Billing} billing
 */

/**
 * Read the deep-link parameters the modal honors: `?subscribe=1` (also
 * `assinar=1`) opens it, `audience=team|individual` and
 * `billing=monthly|annual` preselect the controls. Unknown values fall back
 * to the defaults (individual, annual).
 * @param {URLSearchParams} params
 * @returns {SubscribeParams}
 */
export function parseSubscribeParams(params) {
  const flag = params.get('subscribe') ?? params.get('assinar');
  const open = flag === '1' || flag === 'true';
  const audienceRaw = params.get('audience');
  const billingRaw = params.get('billing');
  return {
    open,
    audience: audienceRaw === 'team' ? 'team' : 'individual',
    billing: billingRaw === 'monthly' ? 'monthly' : 'annual'
  };
}

/**
 * Normalize a typed WhatsApp number to E.164 for the site locale.
 *
 * pt-BR: a Brazilian number typed without the country code (10 or 11 digits,
 * area code plus 8 or 9 digits) gets 55 prepended; the server would otherwise
 * store "+11 9..." as if it were a North American number and the subscriber
 * would never receive a delivery. en: the country code must be typed (a
 * leading "+" or 00), since no single default fits an international site.
 * Returns null when the number cannot be a valid E.164 number.
 * @param {string} raw
 * @param {Locale} locale
 * @returns {string | null}
 */
export function normalizePhone(raw, locale) {
  const trimmed = String(raw ?? '').trim();
  const explicitCountry = trimmed.startsWith('+') || trimmed.startsWith('00');
  let digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('00')) digits = digits.replace(/^00/, '');
  if (digits.length === 0) return null;
  if (!explicitCountry && locale === 'pt-BR') {
    if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
    else if (!(digits.length >= 12 && digits.length <= 13 && digits.startsWith('55'))) return null;
  } else if (!explicitCountry) {
    return null;
  }
  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}

/**
 * Display form of an E.164 number: Brazilian numbers as +55 11 91234-5678,
 * everything else grouped in blocks of three after the country code guess.
 * @param {string} e164
 * @returns {string}
 */
export function formatPhoneDisplay(e164) {
  const digits = String(e164 ?? '').replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const area = digits.slice(2, 4);
    const local = digits.slice(4);
    const split = local.length - 4;
    return `+55 ${area} ${local.slice(0, split)}-${local.slice(split)}`;
  }
  return `+${digits}`;
}
