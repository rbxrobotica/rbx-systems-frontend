import assert from 'node:assert/strict';
import test from 'node:test';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';

const { buildQualificationSubmission, qualificationLimits } = await importTypeScriptModule(
  new URL('../src/lib/partnership/qualification.ts', import.meta.url)
);

const terms = { monthlyPriceBRL: 8000, monthlyHours: 16, version: '2026-10-05' };
const input = {
  name: ' Ana ',
  email: ' ana@example.com ',
  company: 'Conteúdo São Paulo',
  productUrl: 'https://example.com',
  stage: 'production',
  objective: 'Evoluir assinaturas e preservar o controle dos dados.',
  timeframe: 'next-month',
  budget: 'yes',
  commercialConsent: true,
  website: ''
};
const proof = '{"challenge":"test-only"}';

test('partnership brief preserves the approved terms and Comms consent/channel contract', () => {
  const result = buildQualificationSubmission(input, 'pt-BR', terms, proof);
  assert.equal(result.ok, true);
  const { payload } = result;
  assert.equal(payload.name, 'Ana');
  assert.equal(payload.email, 'ana@example.com');
  assert.equal(payload.source, 'rbx-engineering-partnership');
  assert.equal(payload.language, 'pt');
  assert.equal(payload.response_preference, 'email');
  assert.equal(payload.whatsapp_opt_in, false);
  assert.equal(payload.commercial_consent, true);
  assert.equal(payload.altcha, proof);
  assert.equal('phone' in payload, false);
  for (const value of [
    terms.version,
    'BRL 8000/month',
    '16 hours/month',
    input.company,
    input.objective
  ]) {
    assert.ok(payload.message.includes(value));
  }
});

test('budget evaluation remains a valid request without inventing a new quote', () => {
  const result = buildQualificationSubmission(
    { ...input, budget: 'review', productUrl: '' },
    'en',
    terms,
    proof
  );
  assert.equal(result.ok, true);
  assert.equal(result.payload.language, 'en');
  assert.match(result.payload.message, /Budget fit: needs evaluation/);
  assert.match(result.payload.message, /Reference price: BRL 8000\/month/);
  assert.match(result.payload.message, /Public product URL: \(not provided\)/);
});

test('contact authorization and an anti-abuse proof are required independently', () => {
  assert.equal(
    buildQualificationSubmission({ ...input, commercialConsent: false }, 'pt-BR', terms, proof)
      .error,
    'consent'
  );
  for (const missingProof of [null, '', '  ']) {
    assert.equal(
      buildQualificationSubmission(input, 'pt-BR', terms, missingProof).error,
      'verification'
    );
  }
});

test('invalid or missing classification and contact details never produce a payload', () => {
  for (const change of [
    { name: ' ' },
    { email: 'invalid' },
    { company: ' ' },
    { objective: '\n' },
    { stage: 'unsupported' },
    { timeframe: '' },
    { budget: 'discount' }
  ]) {
    const result = buildQualificationSubmission({ ...input, ...change }, 'pt-BR', terms, proof);
    assert.equal(result.ok, false);
    assert.equal('payload' in result, false);
  }
});

test('public product URLs reject unsupported protocols and embedded credentials', () => {
  for (const productUrl of [
    'javascript:alert(1)',
    'ftp://example.com',
    'https://user:secret@example.com',
    'not-a-url'
  ]) {
    assert.equal(
      buildQualificationSubmission({ ...input, productUrl }, 'pt-BR', terms, proof).error,
      'url'
    );
  }
});

test('maximum multilingual input stays within the Go handler byte limit without truncation', () => {
  const attribution = Object.fromEntries(
    ['first_touch', 'last_touch'].flatMap((touch) => [
      [`${touch}_utm_source`, 'newsletter'],
      [`${touch}_utm_medium`, 'social_organic'],
      [`${touch}_utm_campaign`, '2026h2_b2b_partnership_001'],
      [`${touch}_utm_content`, 'b2b_institutional_partnership_001']
    ])
  );
  for (const character of ['a', 'á', '界', '🚀']) {
    const fill = (length) => character.repeat(Math.floor(length / character.length));
    const maxInput = {
      ...input,
      name: fill(qualificationLimits.name),
      company: fill(qualificationLimits.company),
      objective: fill(qualificationLimits.objective),
      productUrl:
        'https://example.com/' +
        fill(qualificationLimits.productUrl - 'https://example.com/'.length)
    };
    const result = buildQualificationSubmission(maxInput, 'pt-BR', terms, proof, attribution);
    assert.equal(result.ok, true);
    assert.ok(
      Buffer.byteLength(result.payload.message, 'utf8') <= qualificationLimits.messageBytes
    );
    assert.ok(result.payload.message.includes(maxInput.objective));
    assert.match(result.payload.message, /first_touch_utm_campaign: 2026h2_b2b_partnership_001/);
    assert.ok(Buffer.byteLength(result.payload.name, 'utf8') <= 200);
  }
});

test('aggregate byte guard rejects excess context instead of silently truncating the brief', () => {
  const result = buildQualificationSubmission(input, 'pt-BR', terms, proof, {
    first_touch_utm_campaign: 'x'.repeat(qualificationLimits.messageBytes)
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'length');
});

test('oversized fields are rejected, including multibyte email that exceeds Go bytes', () => {
  for (const field of ['name', 'email', 'company', 'productUrl', 'objective']) {
    const value =
      field === 'email'
        ? 'a'.repeat(200) + '@example.com'
        : 'x'.repeat(qualificationLimits[field] + 1);
    assert.equal(
      buildQualificationSubmission({ ...input, [field]: value }, 'pt-BR', terms, proof).error,
      'length'
    );
  }
  assert.equal(
    buildQualificationSubmission(
      { ...input, email: '界'.repeat(70) + '@example.com' },
      'pt-BR',
      terms,
      proof
    ).error,
    'length'
  );
});
