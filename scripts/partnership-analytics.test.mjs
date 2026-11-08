import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';

const { buildQualificationSubmission } = await importTypeScriptModule(
  new URL('../src/lib/partnership/qualification.ts', import.meta.url)
);
const utmSource = await readFile(new URL('../src/lib/analytics/utm.ts', import.meta.url), 'utf8');

const source = await readFile(
  new URL('../src/lib/analytics/partnership.ts', import.meta.url),
  'utf8'
);
const providerSource = await readFile(
  new URL('../src/lib/analytics/index.ts', import.meta.url),
  'utf8'
);

function compile(source) {
  return ts
    .transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
    })
    .outputText.replace(/^export /gm, '');
}

function fixture({
  browser = true,
  hostname = 'rbx.ia.br',
  storage,
  first,
  last,
  providerThrows = false
} = {}) {
  const calls = [];
  const window = {
    location: {
      hostname,
      origin: `https://${hostname}`,
      href: `https://${hostname}/parceria?email=private@example.test#private`
    },
    localStorage: storage ?? { getItem: () => null }
  };
  const transformed = source
    .replace("import { browser } from '$app/environment';", '')
    .replace("import { trackEvent, type EventProps } from './index';", '')
    .replace("import { getFirstTouchUtm, getLastTouchUtm } from './utm';", '');
  const api = new Function(
    'browser',
    'window',
    'trackEvent',
    'getFirstTouchUtm',
    'getLastTouchUtm',
    compile(transformed) + '\nreturn { trackPartnershipEvent, getPartnershipAttribution };'
  )(
    browser,
    window,
    (...args) => {
      if (providerThrows) throw new Error('provider unavailable');
      calls.push(args);
    },
    () => first,
    () => last
  );
  return { ...api, calls };
}

const context = { locale: 'pt-BR', surface: 'partnership', entry: 'form' };

test('weekly channel links survive capture, clean navigation and the submitted Comms context', () => {
  for (const [channel, placement] of [
    ['linkedin', 'b2b_post_authority_046'],
    ['linkedin', 'b2b_post_application_046'],
    ['youtube', 'b2b_video_explanation_046'],
    ['facebook', 'b2b_video_reuse_046']
  ]) {
    const storage = () => {
      const values = new Map();
      return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
    };
    const capture = new Function(
      'browser',
      'localStorage',
      'sessionStorage',
      compile(utmSource.replace("import { browser } from '$app/environment';", '')) +
        '\nreturn { captureUtm, getFirstTouchUtm, getLastTouchUtm };'
    )(true, storage(), storage());
    const values = {
      utm_source: channel,
      utm_medium: 'social_organic',
      utm_campaign: '2026h2_b2b_partnership_001',
      utm_content: placement,
      utm_term: 'founder_saas'
    };
    capture.captureUtm('?' + new URLSearchParams(values));
    capture.captureUtm(''); // clean internal navigation must retain the touch
    const attribution = fixture({
      first: capture.getFirstTouchUtm(),
      last: capture.getLastTouchUtm()
    }).getPartnershipAttribution();
    const submission = buildQualificationSubmission(
      {
        name: 'Synthetic contract',
        email: 'contract@example.invalid',
        company: 'Synthetic SaaS',
        productUrl: '',
        stage: 'production',
        objective: 'Review one integration.',
        timeframe: 'next-month',
        budget: 'review',
        commercialConsent: true,
        website: ''
      },
      'pt-BR',
      {
        monthlyPriceBRL: 8000,
        monthlyHours: 16,
        version: '2026-10-05',
        referencePrice: 'BRL 8000'
      },
      'test-only',
      attribution
    );
    assert.equal(submission.ok, true);
    for (const touch of ['first_touch', 'last_touch']) {
      for (const [key, value] of Object.entries(values)) {
        assert.equal(attribution[`${touch}_${key}`], value);
        assert.ok(submission.payload.message.includes(`${touch}_${key}: ${value}`));
      }
    }
    assert.equal(submission.payload.whatsapp_opt_in, false);
    assert.equal(submission.payload.source, 'rbx-engineering-partnership');
  }
});

test('partnership events keep only bounded properties and a canonical query-free URL', () => {
  const f = fixture();
  f.trackPartnershipEvent('form_success', {
    ...context,
    name: 'Private Name',
    email: 'private@example.test',
    message: 'private note',
    phone: '+5511999999999',
    url: 'https://private.example.test/?token=secret',
    error: 'HTTP 500: private@example.test',
    product: 'private-company',
    destination: 'qualification'
  });
  assert.deepEqual(f.calls, [
    [
      'form_success',
      {
        offer: 'engineering-partnership',
        offer_version: '2026-10-05',
        ...context,
        destination: 'qualification'
      },
      { url: 'https://rbx.ia.br/parceria', interactive: true }
    ]
  ]);
});

test('all locales and surfaces use canonical paths; passive views do not inflate engagement', () => {
  const f = fixture();
  for (const [locale, surface, path] of [
    ['pt-BR', 'products', '/produtos'],
    ['en', 'products', '/products'],
    ['pt-BR', 'partnership', '/parceria'],
    ['en', 'partnership', '/partnership']
  ]) {
    f.trackPartnershipEvent('offer_view', { locale, surface, entry: 'offer' });
    assert.equal(f.calls.at(-1)[2].url, `https://rbx.ia.br${path}`);
    assert.equal(f.calls.at(-1)[2].interactive, false);
  }
  f.trackPartnershipEvent('evidence_view', {
    locale: 'pt-BR',
    surface: 'products',
    entry: 'gallery',
    product: 'robson-code'
  });
  assert.equal(f.calls.at(-1)[1].product, 'robson-code');
  assert.equal(f.calls.at(-1)[2].interactive, false);
});

test('invalid events and required dimensions are discarded at runtime', () => {
  const f = fixture();
  f.trackPartnershipEvent('private@example.test', context);
  f.trackPartnershipEvent('form_start', { ...context, locale: 'private@example.test' });
  f.trackPartnershipEvent('form_start', { ...context, surface: 'customer-profile' });
  f.trackPartnershipEvent('form_start', { ...context, entry: 'private-name' });
  f.trackPartnershipEvent('form_start', null);
  assert.deepEqual(f.calls, []);
});

test('SSR, loopback previews and the existing opt-out never emit events', () => {
  const cases = [
    { browser: false },
    { hostname: 'localhost' },
    { hostname: 'preview.localhost' },
    { hostname: '127.0.0.1' },
    { hostname: '[::1]' },
    { storage: { getItem: () => 'true' } }
  ];
  for (const options of cases) {
    const f = fixture(options);
    f.trackPartnershipEvent('form_submit', context);
    assert.deepEqual(f.calls, [], JSON.stringify(options));
  }
});

test('storage and analytics outages never interrupt the visitor', () => {
  const f = fixture({
    storage: {
      getItem: () => {
        throw new Error('blocked');
      }
    }
  });
  assert.doesNotThrow(() => f.trackPartnershipEvent('cta_click', context));
  assert.equal(f.calls.length, 1);
  assert.doesNotThrow(() =>
    fixture({ providerThrows: true }).trackPartnershipEvent('form_submit', context)
  );
});

test('commercial attribution revalidates storage and never includes free text or arbitrary campaigns', () => {
  const f = fixture({
    first: {
      utm_source: 'partner',
      utm_medium: 'referral',
      utm_campaign: '2026h2_b2b_networking_001',
      utm_content: 'b2b_portfolio_partnership_001',
      utm_term: 'private_name',
      email: 'private@example.test',
      last_touch_utm: '{"email":"private@example.test"}'
    },
    last: {
      utm_source: 'private@example.test',
      utm_medium: 'email',
      utm_campaign: '2026h2_b2b_private_name_001',
      utm_content: 'b2b_private_name_001',
      url: 'https://private.example.test'
    }
  });
  assert.deepEqual(f.getPartnershipAttribution(), {
    first_touch_utm_source: 'partner',
    first_touch_utm_medium: 'referral',
    first_touch_utm_campaign: '2026h2_b2b_networking_001',
    first_touch_utm_content: 'b2b_portfolio_partnership_001',
    last_touch_utm_medium: 'email'
  });
  assert.deepEqual(fixture({ browser: false }).getPartnershipAttribution(), {});
  assert.deepEqual(fixture({ first: 'invalid', last: 123 }).getPartnershipAttribution(), {});
});

function providerFixture() {
  const window = {};
  const transformed = providerSource
    .replace("import { browser } from '$app/environment';", 'const browser = true;')
    .replaceAll('import.meta.env', '({})');
  const api = new Function(
    'window',
    compile(transformed) + '\nreturn { bootstrapPlausible, setRuntimeConfig, trackEvent };'
  )(window);
  return { ...api, window };
}

test('the shared provider removes referrer details only for partnership events', () => {
  const f = providerFixture();
  f.bootstrapPlausible();
  const transform = f.window.plausible.o.transformRequest;
  const payload = {
    n: 'form_success',
    p: { offer: 'engineering-partnership' },
    r: 'https://referrer.example.test/private-path?email=private@example.test#private'
  };
  assert.equal(transform(payload).r, 'https://referrer.example.test');
  assert.match(payload.r, /private-path/);
  assert.equal(transform({ ...payload, r: 'not a url' }).r, null);
  const other = { ...payload, p: { offer: 'briefing' } };
  assert.equal(transform(other), other);
});

test('the shared provider forwards canonical URL and passive status without breaking earlier callers', () => {
  const f = providerFixture();
  f.setRuntimeConfig({
    domain: 'rbx.ia.br',
    scriptSrc: 'https://analytics.example.test/script.js'
  });
  f.bootstrapPlausible();
  f.trackEvent(
    'offer_view',
    { offer: 'engineering-partnership' },
    { url: 'https://rbx.ia.br/parceria', interactive: false }
  );
  f.trackEvent('chat_open', { entry: 'contact-menu' });
  assert.deepEqual(f.window.plausible.q, [
    [
      'offer_view',
      {
        props: { offer: 'engineering-partnership' },
        u: 'https://rbx.ia.br/parceria',
        interactive: false
      }
    ],
    ['chat_open', { props: { entry: 'contact-menu' } }]
  ]);
});
