import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';

const { productsContent } = await importTypeScriptModule(
  new URL('../src/lib/content/products.ts', import.meta.url)
);

// Contract copied from rbx-market-briefing/src/utils/validator.ts,
// REQUIRED_DISCLAIMER, checked 2026-10-05. The marketing Markdown contains
// different EN punctuation; this portfolio follows the product validator.
const disclosures = {
  'pt-BR':
    'Este briefing é material de preparação operacional e governança. Não constitui recomendação de investimento, sinal de trading ou orientação financeira. A decisão de operar é exclusiva do operador humano. Este produto não gera ordens, não recomenda compra/venda e não aciona sistemas de execução.',
  en: 'This briefing is operational preparation and governance material. It does not constitute investment advice, a trading signal or financial guidance. The decision to trade belongs exclusively to the human operator. This product does not generate orders, does not recommend buying or selling and does not trigger execution systems.'
};

const catalog = (content) => [...content.products, ...content.additionalProducts];
const originalProductIds = [
  'robson',
  'strategos',
  'verentir',
  'satwake', // Existing Briefing BTC product under its requested public name.
  'ledger',
  'yield',
  'maestro',
  'argos-radar',
  'thalamus',
  'truthmetal'
];

test('both locales preserve all ten original products with unique matching ids', () => {
  for (const content of Object.values(productsContent)) {
    const ids = catalog(content).map((product) => product.id);
    assert.deepEqual(ids, originalProductIds);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('Kulinaryos remains an external reference outside the RBX catalog and SEO description', () => {
  for (const content of Object.values(productsContent)) {
    assert.equal(content.externalReference.id, 'kulinaryos');
    assert.match(content.externalReference.description, /Food Process/);
    assert.doesNotMatch(content.externalReference.description, /fundador|founder/);
    assert.ok(catalog(content).every((product) => product.id !== 'kulinaryos'));
    assert.doesNotMatch(content.description, /Kulinaryos/);
  }
});

test('financial disclosures match the runtime canonical contract exactly in both locales', () => {
  for (const [locale, content] of Object.entries(productsContent)) {
    assert.equal(content.financialNote, disclosures[locale]);
  }
});

test('Satwake retains the Briefing BTC name and existing localized destination', () => {
  for (const [locale, content] of Object.entries(productsContent)) {
    const product = content.products.find((item) => item.id === 'satwake');
    assert.match(product.name, /Satwake/);
    assert.match(product.name, /Briefing BTC/);
    assert.equal(product.href, `${locale === 'pt-BR' ? '/produtos' : '/products'}/briefing-btc`);
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
      `${prefix}/briefing-btc`,
      `${prefix}/maestro`,
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
    const entries = [...catalog(content), content.externalReference, ...content.references];
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
      const dynamic = href.startsWith('/blog/')
        ? '/blog/[slug]'
        : href === `${prefix}/maestro`
          ? `${prefix}/[slug]`
          : href;
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
