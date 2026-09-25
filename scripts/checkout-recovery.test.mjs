import assert from 'node:assert/strict';
import test from 'node:test';
import { originalRecoveredPaymentURL } from '../src/lib/briefing/recovery-terms.ts';

const url = 'https://sandbox.asaas.com/i/original';
const teamPlan = {
  id: 'briefing-team-yearly-brl',
  currency: 'BRL',
  billing: 'annual',
  audience: 'team'
};
const original = {
  reused: true,
  status: 'pending',
  plan_id: teamPlan.id,
  currency: 'BRL',
  payment_method: 'pix',
  billing_cycle: 'YEARLY',
  amount: 23400,
  seats: 5,
  checkout_url: url
};

test('an email-recovered annual team invoice keeps its original seat count', () => {
  // A buyer in a fresh browser may have the default 2 seats selected. The
  // server's five-seat order remains reviewable before an explicit click.
  assert.equal(originalRecoveredPaymentURL(original, teamPlan, 'pix', 2, 20), url);
});

test('incomplete or inconsistent original terms never expose a payment link', () => {
  for (const changed of [
    { billing_cycle: 'MONTHLY' },
    { amount: undefined },
    { seats: 21 },
    { payment_method: 'card' },
    { checkout_url: 'http://sandbox.asaas.com/i/original' },
    { reused: false }
  ]) {
    assert.equal(
      originalRecoveredPaymentURL({ ...original, ...changed }, teamPlan, 'pix', 2, 20),
      null
    );
  }
});
