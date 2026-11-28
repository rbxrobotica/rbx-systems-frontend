import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';

const { productsContent } = await importTypeScriptModule(
  new URL('../src/lib/content/products.ts', import.meta.url)
);

// Owner, 2026-11-24: Strategos is featured and Verentir is the secondary
// product, with the two AI platforms beside it. Robson is shown discreetly,
// outside the grid. Satwake and Initelo are not presented for now.
const catalog = (content) => [...content.products, ...content.additionalProducts];
const catalogProductIds = ['strategos', 'verentir', 'thalamus', 'truthmetal'];
const notPresented = /satwake|briefing btc|initelo|maestro|ledger|argos|yield/i;

test('both locales list the same four products, Strategos first', () => {
  for (const content of Object.values(productsContent)) {
    const ids = catalog(content).map((product) => product.id);
    assert.deepEqual(ids, catalogProductIds);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('Robson stays outside the grid, with its page and its source', () => {
  for (const [locale, content] of Object.entries(productsContent)) {
    const robson = content.engineeringProduct;
    assert.equal(robson.id, 'robson');
    assert.ok(catalog(content).every((product) => product.id !== 'robson'));
    assert.equal(robson.href, `${locale === 'pt-BR' ? '/produtos' : '/products'}/robson`);
    assert.deepEqual(
      robson.secondaryLinks.map((link) => link.href),
      ['https://github.com/ldamasio/robson']
    );
    assert.match(robson.note, /autotrader/);
    assert.doesNotMatch(content.description, /Robson/);
  }
});

test('products the owner left out are not named in the portfolio', () => {
  for (const content of Object.values(productsContent)) {
    assert.doesNotMatch(JSON.stringify(content), notPresented);
  }
});

test('Kulinaryos remains an external reference outside the catalog and SEO description', () => {
  for (const content of Object.values(productsContent)) {
    assert.equal(content.externalReference.id, 'kulinaryos');
    assert.match(content.externalReference.description, /Food Process/);
    assert.doesNotMatch(content.externalReference.description, /fundador|founder/);
    assert.ok(catalog(content).every((product) => product.id !== 'kulinaryos'));
    assert.doesNotMatch(content.description, /Kulinaryos/);
  }
});

test('navigation uses reviewed public destinations and existing locale routes', () => {
  for (const [locale, content] of Object.entries(productsContent)) {
    const prefix = locale === 'pt-BR' ? '/produtos' : '/products';
    const contact = locale === 'pt-BR' ? '/parceria' : '/partnership';
    // Public CMS endpoints verified before adding these links. A matching
    // dynamic route alone would not detect an absent CMS object.
    const reviewedPaths = new Set([
      `${prefix}/robson`,
      contact,
      '/blog/2026-08-07-evidence-authority-boundaries',
      '/blog/2026-07-29-governed-public-rag',
      '/blog/2026-08-02-rbx-journal-rss'
    ]);
    const reviewedExternal = new Set([
      'https://github.com/ldamasio/robson',
      'https://strategos.gr',
      'https://kulinaryos.com'
    ]);
    const entries = [
      ...catalog(content),
      content.engineeringProduct,
      content.externalReference,
      ...content.references
    ];
    const links = [
      content.contactHref,
      ...entries.flatMap((entry) => [
        entry.href,
        ...(entry.secondaryLinks ?? []).map((l) => l.href)
      ])
    ].filter(Boolean);

    for (const href of links) {
      if (!href.startsWith('/')) {
        assert.ok(reviewedExternal.has(href), `Unreviewed external destination: ${href}`);
        continue;
      }
      assert.ok(reviewedPaths.has(href), `Unreviewed internal destination: ${href}`);
      const dynamic = href.startsWith('/blog/') ? '/blog/[slug]' : href;
      assert.ok(
        existsSync(new URL(`../src/routes${dynamic}/+page.svelte`, import.meta.url)),
        `Missing route: ${href}`
      );
    }
  }
});

test('portfolio copy does not introduce prohibited financial promises or urgency', () => {
  const forbidden =
    /lucro garantido|renda passiva|sem risco|últimas vagas|oferta por tempo limitado|guaranteed profit|passive income|risk-free|limited-time offer|win rate|taxa de acerto/i;
  for (const content of Object.values(productsContent)) {
    assert.doesNotMatch(JSON.stringify(content), forbidden);
  }
});
