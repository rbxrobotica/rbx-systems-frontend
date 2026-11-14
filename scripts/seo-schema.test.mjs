import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScriptGraph } from './test-support/load-typescript-graph.mjs';

const {
  breadcrumbSchema,
  buildGraph,
  collectionPageSchema,
  faqPageSchema,
  personSchemaFor,
  serializeJsonLd,
  serviceSchema
} = loadTypeScriptGraph(new URL('../src/lib/seo/schema.ts', import.meta.url));

test('serializeJsonLd cannot close the script element it is inlined in', () => {
  const schema = {
    '@type': 'BlogPosting',
    headline: 'Escaping </script><script>alert(1)</script> and <!-- comments',
    keywords: ['a < b', 'plain']
  };
  const serialized = serializeJsonLd(schema);

  assert.ok(!serialized.includes('<'));
  // Same document for a JSON parser, with the schema.org context added.
  assert.deepEqual(JSON.parse(serialized), { '@context': 'https://schema.org', ...schema });
});

test('breadcrumbSchema emits ordered ListItems with absolute URLs', () => {
  const schema = breadcrumbSchema('https://merovelis.com/pt-br/blog/post', [
    { name: 'Início', path: '/pt-br' },
    { name: 'Journal', path: '/pt-br/journal' },
    { name: 'Post', path: '/pt-br/blog/post' }
  ]);
  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.equal(schema['@id'], 'https://merovelis.com/pt-br/blog/post#breadcrumb');
  const items = schema.itemListElement;
  assert.equal(items.length, 3);
  assert.deepEqual(
    items.map((i) => i.position),
    [1, 2, 3]
  );
  assert.equal(items[0].item, 'https://merovelis.com/pt-br');
  assert.equal(items[1].item, 'https://merovelis.com/pt-br/journal');
  assert.equal(items[2].name, 'Post');
});

test('breadcrumbSchema absolutizes the en paths against the same host', () => {
  const schema = breadcrumbSchema('https://merovelis.com/en/services/llmops', [
    { name: 'Home', path: '/en' },
    { name: 'Solutions', path: '/en/solutions' }
  ]);
  assert.equal(schema.itemListElement[1].item, 'https://merovelis.com/en/solutions');
});

test('collectionPageSchema without items has no ItemList', () => {
  const schema = collectionPageSchema(
    'en',
    'https://merovelis.com/en/products',
    'Products',
    'Desc'
  );
  assert.equal(schema['@type'], 'CollectionPage');
  assert.equal(schema.isPartOf['@id'], 'https://merovelis.com/#website');
  assert.equal(schema.mainEntity, undefined);
});

test('collectionPageSchema with items emits an ItemList mainEntity', () => {
  const schema = collectionPageSchema(
    'pt-BR',
    'https://merovelis.com/pt-br/journal',
    'Journal',
    'Desc',
    [
      { name: 'Post A', url: 'https://merovelis.com/pt-br/blog/a' },
      { name: 'Post B', url: 'https://merovelis.com/pt-br/blog/b' }
    ]
  );
  assert.equal(schema.mainEntity['@type'], 'ItemList');
  const items = schema.mainEntity.itemListElement;
  assert.equal(items.length, 2);
  assert.equal(items[0].position, 1);
  assert.equal(items[1].url, 'https://merovelis.com/pt-br/blog/b');
});

test('faqPageSchema mirrors visible Q&A as Question/Answer entities', () => {
  const schema = faqPageSchema('https://merovelis.com/pt-br/produtos/briefing-btc', [
    { question: 'Quanto custa?', answer: 'Free: R$ 0.' }
  ]);
  assert.equal(schema['@type'], 'FAQPage');
  assert.equal(schema['@id'], 'https://merovelis.com/pt-br/produtos/briefing-btc#faq');
  const [question] = schema.mainEntity;
  assert.equal(question['@type'], 'Question');
  assert.equal(question.name, 'Quanto custa?');
  assert.equal(question.acceptedAnswer['@type'], 'Answer');
  assert.equal(question.acceptedAnswer.text, 'Free: R$ 0.');
});

test('personSchemaFor mints one entity per person, with the page of the language', () => {
  const pt = personSchemaFor('pt-BR', 'caue-alencar', 'Cauê Alencar', 'CFO, RBX Systems');
  assert.equal(pt['@type'], 'Person');
  assert.equal(pt['@id'], 'https://merovelis.com/#caue-alencar');
  assert.equal(pt.url, 'https://merovelis.com/pt-br/caue-alencar');
  assert.equal(pt.worksFor['@id'], 'https://merovelis.com/#organization');
  assert.equal(pt.sameAs, undefined);

  const en = personSchemaFor('en', 'caue-alencar', 'Cauê Alencar', 'CFO, RBX Systems');
  assert.equal(en['@id'], pt['@id']);
  assert.equal(en.url, 'https://merovelis.com/en/caue-alencar');
});

test('serviceSchema links the provider organization', () => {
  const schema = serviceSchema('https://merovelis.com/en/services/llmops', 'LLMOps', 'Desc');
  assert.equal(schema['@type'], 'Service');
  assert.equal(schema.provider['@id'], 'https://merovelis.com/#organization');
  assert.equal(schema.url, 'https://merovelis.com/en/services/llmops');
});

test('the organization, the site and the founder are one entity each in both languages', () => {
  const graph = (locale, pageUrl) => buildGraph(locale, pageUrl, 'Title', 'Desc')['@graph'];
  const pt = graph('pt-BR', 'https://merovelis.com/pt-br/sobre');
  const en = graph('en', 'https://merovelis.com/en/about');
  const byType = (nodes, type) => nodes.find((node) => node['@type'] === type);

  for (const type of ['Organization', 'WebSite', 'Person']) {
    assert.equal(byType(pt, type)['@id'], byType(en, type)['@id'], type);
    assert.match(byType(pt, type)['@id'], /^https:\/\/merovelis\.com\/#/, type);
  }
  // The site node is the same on every page; what is said about the
  // organization and the person follows the language of the page.
  assert.deepEqual(byType(pt, 'WebSite'), byType(en, 'WebSite'));
  assert.deepEqual(byType(pt, 'WebSite').inLanguage, ['pt-BR', 'en']);
  // An address in structured data is one that is served. The root of the host
  // answers with a redirect, so the organization names the home page in the
  // language of the page, and the site names the English one, its default.
  assert.equal(byType(pt, 'Organization').url, 'https://merovelis.com/pt-br');
  assert.equal(byType(en, 'Organization').url, 'https://merovelis.com/en');
  assert.equal(byType(pt, 'WebSite').url, 'https://merovelis.com/en');
  assert.equal(byType(pt, 'Organization').logo, 'https://merovelis.com/brand/rbx-mark.svg');
  assert.notEqual(byType(pt, 'Organization').description, byType(en, 'Organization').description);
  assert.equal(byType(pt, 'Person').url, 'https://merovelis.com/pt-br/leandro-damasio');
  assert.equal(byType(en, 'Person').url, 'https://merovelis.com/en/leandro-damasio');
  assert.equal(byType(en, 'WebPage').inLanguage, 'en');

  // The two earlier hosts redirect here, so they identify nothing else.
  const serialized = JSON.stringify([pt, en]);
  assert.doesNotMatch(serialized, /rbx\.ia\.br|rbxsystems\.ch/);
});
