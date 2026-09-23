import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';

const { breadcrumbSchema, collectionPageSchema, faqPageSchema, personSchemaFor, serviceSchema } =
  await importTypeScriptModule(new URL('../src/lib/seo/schema.ts', import.meta.url));

test('breadcrumbSchema emits ordered ListItems with absolute URLs', () => {
  const schema = breadcrumbSchema('pt-BR', 'https://rbx.ia.br/blog/post', [
    { name: 'Início', path: '/' },
    { name: 'Journal', path: '/journal' },
    { name: 'Post', path: '/blog/post' }
  ]);
  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.equal(schema['@id'], 'https://rbx.ia.br/blog/post#breadcrumb');
  const items = schema.itemListElement;
  assert.equal(items.length, 3);
  assert.deepEqual(
    items.map((i) => i.position),
    [1, 2, 3]
  );
  assert.equal(items[0].item, 'https://rbx.ia.br/');
  assert.equal(items[1].item, 'https://rbx.ia.br/journal');
  assert.equal(items[2].name, 'Post');
});

test('breadcrumbSchema absolutizes against the en host', () => {
  const schema = breadcrumbSchema('en', 'https://rbxsystems.ch/services/llmops', [
    { name: 'Home', path: '/' },
    { name: 'Solutions', path: '/solutions' }
  ]);
  assert.equal(schema.itemListElement[1].item, 'https://rbxsystems.ch/solutions');
});

test('collectionPageSchema without items has no ItemList', () => {
  const schema = collectionPageSchema('en', 'https://rbxsystems.ch/products', 'Products', 'Desc');
  assert.equal(schema['@type'], 'CollectionPage');
  assert.equal(schema.isPartOf['@id'], 'https://rbxsystems.ch/#website');
  assert.equal(schema.mainEntity, undefined);
});

test('collectionPageSchema with items emits an ItemList mainEntity', () => {
  const schema = collectionPageSchema('pt-BR', 'https://rbx.ia.br/journal', 'Journal', 'Desc', [
    { name: 'Post A', url: 'https://rbx.ia.br/blog/a' },
    { name: 'Post B', url: 'https://rbx.ia.br/blog/b' }
  ]);
  assert.equal(schema.mainEntity['@type'], 'ItemList');
  const items = schema.mainEntity.itemListElement;
  assert.equal(items.length, 2);
  assert.equal(items[0].position, 1);
  assert.equal(items[1].url, 'https://rbx.ia.br/blog/b');
});

test('faqPageSchema mirrors visible Q&A as Question/Answer entities', () => {
  const schema = faqPageSchema('https://rbx.ia.br/produtos/briefing-btc', [
    { question: 'Quanto custa?', answer: 'Free: R$ 0.' }
  ]);
  assert.equal(schema['@type'], 'FAQPage');
  assert.equal(schema['@id'], 'https://rbx.ia.br/produtos/briefing-btc#faq');
  const [question] = schema.mainEntity;
  assert.equal(question['@type'], 'Question');
  assert.equal(question.name, 'Quanto custa?');
  assert.equal(question.acceptedAnswer['@type'], 'Answer');
  assert.equal(question.acceptedAnswer.text, 'Free: R$ 0.');
});

test('personSchemaFor mints a site-level entity employed by the org', () => {
  const schema = personSchemaFor('pt-BR', 'caue-alencar', 'Cauê Alencar', 'CFO, RBX Systems');
  assert.equal(schema['@type'], 'Person');
  assert.equal(schema['@id'], 'https://rbx.ia.br/#caue-alencar');
  assert.equal(schema.url, 'https://rbx.ia.br/caue-alencar');
  assert.equal(schema.worksFor['@id'], 'https://rbx.ia.br/#organization');
  assert.equal(schema.sameAs, undefined);
});

test('serviceSchema links the provider organization', () => {
  const schema = serviceSchema('en', 'https://rbxsystems.ch/services/llmops', 'LLMOps', 'Desc');
  assert.equal(schema['@type'], 'Service');
  assert.equal(schema.provider['@id'], 'https://rbxsystems.ch/#organization');
  assert.equal(schema.url, 'https://rbxsystems.ch/services/llmops');
});
