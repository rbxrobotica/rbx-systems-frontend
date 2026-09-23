import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';

const { canonicalTag, collectCanonicalTags, normalizeTag, postHasTag } =
  await importTypeScriptModule(new URL('../src/lib/journal/tags.ts', import.meta.url));
const { authorSlugFor, JOURNAL_AUTHORS, journalAuthorBySlug } = await importTypeScriptModule(
  new URL('../src/lib/journal/authors.ts', import.meta.url)
);

test('normalizeTag lowercases and strips diacritics', () => {
  assert.equal(normalizeTag('Governança'), 'governanca');
  assert.equal(normalizeTag(' validação '), 'validacao');
  assert.equal(normalizeTag('AI'), 'ai');
});

test('canonicalTag maps pt-BR aliases to the canonical slug', () => {
  assert.equal(canonicalTag('engenharia'), 'engineering');
  assert.equal(canonicalTag('risco'), 'risk');
  assert.equal(canonicalTag('confiabilidade'), 'reliability');
  assert.equal(canonicalTag('agentes'), 'agents');
  assert.equal(canonicalTag('governança'), 'governance');
  assert.equal(canonicalTag('governanca'), 'governance');
  assert.equal(canonicalTag('IA'), 'ai');
  assert.equal(canonicalTag('sistemas-distribuídos'), 'distributed-systems');
});

test('canonicalTag leaves already-canonical tags untouched', () => {
  assert.equal(canonicalTag('robson'), 'robson');
  assert.equal(canonicalTag('event-sourcing'), 'event-sourcing');
  assert.equal(canonicalTag('engineering'), 'engineering');
});

test('postHasTag matches across locales', () => {
  assert.equal(postHasTag(['engenharia', 'risco'], 'engineering'), true);
  assert.equal(postHasTag(['robson'], 'ai'), false);
});

test('collectCanonicalTags dedupes locale variants and sorts', () => {
  const tags = collectCanonicalTags([
    { tags: ['engenharia', 'risco'] },
    { tags: ['engineering', 'risk', 'robson'] }
  ]);
  assert.deepEqual(tags, ['engineering', 'risk', 'robson']);
});

test('authorSlugFor resolves the known frontmatter author names', () => {
  assert.equal(authorSlugFor('Leandro Damasio'), 'leandro-damasio');
  assert.equal(authorSlugFor('Cauê Souza Azevedo Alencar'), 'caue-alencar');
  assert.equal(authorSlugFor('RBX Systems'), 'rbx-systems');
  assert.equal(authorSlugFor('Anonymous'), null);
});

test('journalAuthorBySlug returns directory entries only for known slugs', () => {
  assert.equal(JOURNAL_AUTHORS.length, 3);
  assert.equal(journalAuthorBySlug('rbx-systems')?.kind, 'organization');
  assert.equal(journalAuthorBySlug('leandro-damasio')?.kind, 'person');
  assert.equal(journalAuthorBySlug('nobody'), null);
});
