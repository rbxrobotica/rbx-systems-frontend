import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ANNUAL_DISCOUNT_PCT,
  BRIEFING_HUB_URL,
  PAYMENT_METHODS,
  MONTHLY_DISCOUNT_PCT,
  PAID_PLANS,
  TEAM_MAX_SEATS,
  TEAM_MIN_SEATS,
  clampSeats,
  currencyForLocale,
  findPlan,
  formatAmount,
  formatPhoneDisplay,
  normalizePhone,
  parseSubscribeParams,
  perMonthAmount,
  totalAmount
} from '../src/lib/briefing/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Server-side catalog in rbx-commerce/internal/checkout/handler.go. Keep in
// sync by hand; this pins the contract the modal relies on.
const SERVER_CATALOG = {
  'briefing-pro-monthly-brl': { amount: 3900, list: 6500, currency: 'BRL' },
  'briefing-pro-annual-brl': { amount: 39000, list: 78000, currency: 'BRL' },
  'briefing-pro-monthly-usd': { amount: 1200, list: 2000, currency: 'USD' },
  'briefing-pro-annual-usd': { amount: 12000, list: 24000, currency: 'USD' },
  'briefing-team-monthly-brl': { amount: 3900, list: 6500, currency: 'BRL' },
  'briefing-team-annual-brl': { amount: 39000, list: 78000, currency: 'BRL' },
  'briefing-team-monthly-usd': { amount: 1200, list: 2000, currency: 'USD' },
  'briefing-team-annual-usd': { amount: 12000, list: 24000, currency: 'USD' }
};

test('the display catalog mirrors the rbx-commerce plan ids and amounts', () => {
  assert.equal(PAID_PLANS.length, Object.keys(SERVER_CATALOG).length);
  for (const plan of PAID_PLANS) {
    const server = SERVER_CATALOG[plan.id];
    assert.ok(server, `unknown plan id ${plan.id}`);
    assert.equal(plan.amount, server.amount, `${plan.id} amount`);
    assert.equal(plan.listAmount, server.list, `${plan.id} list amount`);
    assert.equal(plan.currency, server.currency, `${plan.id} currency`);
  }
});

test('published discounts are 40% monthly and 50% annual against the list price', () => {
  assert.equal(MONTHLY_DISCOUNT_PCT, 40);
  assert.equal(ANNUAL_DISCOUNT_PCT, 50);
  for (const plan of PAID_PLANS) {
    if (plan.billing === 'monthly') {
      assert.equal(plan.amount * 100, plan.listAmount * 60, `${plan.id} monthly discount`);
      assert.equal(plan.discountPct, 40);
    } else {
      assert.equal(plan.amount * 2, plan.listAmount, `${plan.id} annual discount`);
      assert.equal(plan.discountPct, 50);
    }
  }
  for (const currency of ['BRL', 'USD']) {
    const monthly = findPlan('individual', 'monthly', currency);
    const annual = findPlan('individual', 'annual', currency);
    assert.equal(
      monthly.listAmount * 12,
      annual.listAmount,
      `${currency} annual list is 12 months`
    );
    assert.equal(
      findPlan('team', 'annual', currency).amount,
      annual.amount,
      `${currency} team per seat`
    );
  }
});

test('locale decides the currency and the payment method', () => {
  assert.equal(currencyForLocale('pt-BR'), 'BRL');
  assert.equal(currencyForLocale('en'), 'USD');
  assert.equal(findPlan('individual', 'annual', 'BRL').method, 'pix');
  assert.equal(
    findPlan('individual', 'annual', 'USD').method,
    'usdt',
    'USDT via BTCPay is the USD default'
  );
  assert.deepEqual(PAYMENT_METHODS, { BRL: ['pix'], USD: ['usdt', 'card'] });
  assert.equal(BRIEFING_HUB_URL, 'https://app.merovelis.com/briefing-btc');
});

test('amounts format per locale, dropping decimals only on whole values', () => {
  // pt-BR keeps a no-break space between the symbol and the number.
  const nbsp = '\u00a0';
  assert.equal(formatAmount(3900, 'BRL', 'pt-BR'), `R$${nbsp}39`);
  assert.equal(formatAmount(3250, 'BRL', 'pt-BR'), `R$${nbsp}32,50`);
  assert.equal(formatAmount(39000, 'BRL', 'pt-BR'), `R$${nbsp}390`);
  assert.equal(formatAmount(0, 'BRL', 'pt-BR', { alwaysDecimals: true }), `R$${nbsp}0,00`);
  assert.equal(formatAmount(1200, 'USD', 'en'), '$12');
  assert.equal(formatAmount(1000, 'USD', 'en'), '$10');
  assert.equal(formatAmount(12000, 'USD', 'en'), '$120');
  assert.equal(formatAmount(0, 'USD', 'en', { alwaysDecimals: true }), '$0.00');
});

test('per-month equivalents and team totals', () => {
  const annualBRL = findPlan('individual', 'annual', 'BRL');
  assert.equal(perMonthAmount(annualBRL), 3250);
  assert.equal(perMonthAmount(findPlan('individual', 'monthly', 'BRL')), 3900);
  const teamAnnualUSD = findPlan('team', 'annual', 'USD');
  assert.equal(totalAmount(teamAnnualUSD, 5), 60000);
  assert.equal(totalAmount(teamAnnualUSD, 1), 12000 * TEAM_MIN_SEATS, 'below minimum clamps up');
  assert.equal(
    totalAmount(teamAnnualUSD, 999),
    12000 * TEAM_MAX_SEATS,
    'above maximum clamps down'
  );
  assert.equal(totalAmount(annualBRL, 7), annualBRL.amount, 'individual plans ignore seats');
});

test('seat counts clamp into the team bounds', () => {
  assert.equal(TEAM_MIN_SEATS, 2);
  assert.equal(TEAM_MAX_SEATS, 50);
  assert.equal(clampSeats(0), 2);
  assert.equal(clampSeats(2.9), 2);
  assert.equal(clampSeats(51), 50);
  assert.equal(clampSeats(NaN), 2);
  assert.equal(clampSeats(12), 12);
});

test('deep-link parameters open and preset the modal', () => {
  assert.deepEqual(parseSubscribeParams(new URLSearchParams('')), {
    open: false,
    audience: 'individual',
    billing: 'annual'
  });
  assert.deepEqual(
    parseSubscribeParams(new URLSearchParams('subscribe=1&audience=team&billing=monthly')),
    {
      open: true,
      audience: 'team',
      billing: 'monthly'
    }
  );
  assert.equal(parseSubscribeParams(new URLSearchParams('assinar=true')).open, true);
  assert.equal(parseSubscribeParams(new URLSearchParams('subscribe=0')).open, false);
  assert.equal(
    parseSubscribeParams(new URLSearchParams('audience=enterprise')).audience,
    'individual'
  );
});

test('WhatsApp numbers normalize to E.164 per locale', () => {
  assert.equal(normalizePhone('11 91234-5678', 'pt-BR'), '+5511912345678');
  assert.equal(normalizePhone('(11) 3123-4567', 'pt-BR'), '+551131234567');
  assert.equal(normalizePhone('+55 11 91234-5678', 'pt-BR'), '+5511912345678');
  assert.equal(normalizePhone('55 11 91234-5678', 'pt-BR'), '+5511912345678');
  assert.equal(normalizePhone('+41 79 000 00 00', 'en'), '+41790000000');
  assert.equal(normalizePhone('0041790000000', 'en'), '+41790000000');
  assert.equal(normalizePhone('79 000 00 00', 'en'), null, 'en requires the country code');
  assert.equal(normalizePhone('123', 'pt-BR'), null);
  assert.equal(normalizePhone('', 'pt-BR'), null);
  assert.equal(normalizePhone('+1 212 555 0100 999 999', 'en'), null, 'too long for E.164');
  assert.equal(formatPhoneDisplay('+5511912345678'), '+55 11 91234-5678');
  assert.equal(formatPhoneDisplay('+551131234567'), '+55 11 3123-4567');
  assert.equal(formatPhoneDisplay('+41790000000'), '+41790000000');
});

function keyShape(value) {
  if (Array.isArray(value)) return `[${value.length}]`;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        // eslint-disable-next-line security/detect-object-injection -- k iterates Object.keys(value)
        .map((k) => [k, keyShape(value[k])])
    );
  }
  return typeof value;
}

test('both locales carry the same briefing.subscribe copy structure', async () => {
  const pt = JSON.parse(await readFile(path.join(root, 'src/lib/i18n/pt-BR.json'), 'utf8'));
  const en = JSON.parse(await readFile(path.join(root, 'src/lib/i18n/en.json'), 'utf8'));
  assert.deepEqual(keyShape(pt.briefing.subscribe), keyShape(en.briefing.subscribe));
  // Voice system: no em dashes, arrows, emoji or exclamation marks in copy.
  const banned = /[—→←↑↓⇒!]|[\u{1F000}-\u{1FAFF}]/u;
  for (const [locale, dict] of [
    ['pt-BR', pt],
    ['en', en]
  ]) {
    const text = JSON.stringify(dict.briefing.subscribe);
    assert.doesNotMatch(text, banned, `${locale} subscribe copy carries a banned glyph`);
  }
});
