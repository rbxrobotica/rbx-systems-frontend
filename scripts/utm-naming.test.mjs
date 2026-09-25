import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

// Execute the real parser without SvelteKit's browser-only module. Its browser
// guard is irrelevant to parseUtm, and runtime dependencies are not installed
// in this lightweight checkout.
const root = resolve(import.meta.dirname, '..');
const source = readFileSync(join(root, 'src/lib/analytics/utm.ts'), 'utf8');
const transformed = source.replace(
  "import { browser } from '$app/environment';",
  'const browser = false;'
);
assert.notEqual(transformed, source, 'expected SvelteKit environment import');
const compiled = ts.transpileModule(transformed, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const parseUtm = new Function(compiled.replace(/^export /gm, '') + '\nreturn parseUtm;')();

test('accepts the Satwake paid campaign taxonomy in the real parser', () => {
  assert.deepEqual(
    parseUtm(
      '?utm_source=instagram&utm_medium=social_paid&utm_campaign=satwake_h1_preparacao&utm_content=satwake_h1_amostra_001&utm_term=btc_preparacao'
    ),
    {
      utm_source: 'instagram',
      utm_medium: 'social_paid',
      utm_campaign: 'satwake_h1_preparacao',
      utm_content: 'satwake_h1_amostra_001',
      utm_term: 'btc_preparacao'
    }
  );
  assert.equal(parseUtm('?utm_source=facebook')?.utm_source, 'facebook');
  assert.equal(parseUtm('?utm_source=google')?.utm_source, 'google');
});

test('retains earlier Satwake and taxonomy v2 legacy campaigns', () => {
  assert.equal(
    parseUtm('?utm_campaign=satwake_h1_ritual07h')?.utm_campaign,
    'satwake_h1_ritual07h'
  );
  assert.deepEqual(
    parseUtm(
      '?utm_source=linkedin&utm_medium=social_organic&utm_campaign=2026h2_b2b_leads_001&utm_content=bad+content'
    ),
    {
      utm_source: 'linkedin',
      utm_medium: 'social_organic',
      utm_campaign: '2026h2_b2b_leads_001'
    }
  );
  assert.equal(parseUtm('?utm_source=LinkedIn&utm_campaign=Satwake_H1_ritual07h'), null);
});

test('drops PII-bearing and oversized values', () => {
  assert.deepEqual(
    parseUtm('?utm_source=google&utm_campaign=satwake_h1_1234567890&utm_term=joao_11999999999'),
    { utm_source: 'google' }
  );
  assert.equal(parseUtm('?utm_campaign=satwake_h1_' + 'a'.repeat(121)), null);
  assert.equal(parseUtm('?utm_source=google%40example.com'), null);
});
