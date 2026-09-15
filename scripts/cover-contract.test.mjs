import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const sourceDir = join(root, 'blog-covers-src');
const catalogPath = join(sourceDir, 'covers.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const prohibitedElements = /<(?:text|image|foreignObject|script|style|animate|set)\b/i;

test('the Journal cover catalog is complete and valid', () => {
  assert.equal(catalog.version, 1);
  assert.equal(catalog.width, 1200);
  assert.equal(catalog.height, 630);
  assert.ok(catalog.posts.length >= 35, 'the published cover inventory must not shrink');

  const slugs = new Set();
  for (const spec of catalog.posts) {
    assert.match(spec.slug, /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!slugs.has(spec.slug), `duplicate cover spec: ${spec.slug}`);
    slugs.add(spec.slug);
    assert.match(spec.title, /\S/);
    assert.match(spec.motif, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(['cyan', 'green', 'violet', 'amber', 'red'].includes(spec.accent));
    assert.ok(['jpg', 'png'].includes(spec.extension));
    assert.ok(Number.isInteger(spec.revision) && spec.revision >= 1);
    assert.match(spec.alt, /^Abstract .{24,}$/);
  }
});

test('every catalogued cover has a safe, text-free 1200x630 SVG source', () => {
  const expected = new Set(catalog.posts.map((spec) => `${spec.slug}.svg`));
  const actual = new Set(readdirSync(sourceDir).filter((file) => file.endsWith('.svg')));
  assert.deepEqual(actual, expected);

  for (const filename of actual) {
    const svg = readFileSync(join(sourceDir, filename), 'utf8');
    assert.match(svg, /<svg[^>]*width="1200"[^>]*height="630"[^>]*viewBox="0 0 1200 630"/);
    assert.ok(!prohibitedElements.test(svg), `${filename} contains a prohibited visual element`);
    assert.ok(!/\b(?:href|src)\s*=/.test(svg), `${filename} embeds an external resource`);
  }
});

test('committed SVG sources are byte-for-byte reproducible', () => {
  const generatedDir = mkdtempSync(join(tmpdir(), 'rbx-cover-contract-'));
  try {
    execFileSync(
      'python3',
      [
        join(root, 'scripts/generate-cover.py'),
        '--all',
        '--source-only',
        '--source-dir',
        generatedDir
      ],
      { stdio: 'ignore' }
    );
    for (const spec of catalog.posts) {
      const filename = `${spec.slug}.svg`;
      assert.equal(
        readFileSync(join(generatedDir, filename), 'utf8'),
        readFileSync(join(sourceDir, filename), 'utf8'),
        `${filename} is stale; regenerate it with scripts/generate-cover.py`
      );
    }
  } finally {
    rmSync(generatedDir, { recursive: true, force: true });
  }
});

test('every local post uses its catalogued cover key and extension', () => {
  const specs = new Map(catalog.posts.map((spec) => [spec.slug, spec]));
  const postFiles = readdirSync(join(root, 'blog-posts')).filter((file) => file.endsWith('.md'));
  for (const filename of postFiles) {
    const slug = filename.replace(/(?:\.pt-BR|\.en)?\.md$/, '');
    const spec = specs.get(slug);
    assert.ok(spec, `${filename} has no entry in blog-covers-src/covers.json`);
    const markdown = readFileSync(join(root, 'blog-posts', filename), 'utf8');
    const cover = markdown.match(/^cover:\s*['"]?([^'"\n]+)['"]?\s*$/m)?.[1];
    assert.ok(cover, `${filename} has no explicit cover URL`);
    assert.equal(basename(cover), `${slug}-v${spec.revision}.${spec.extension}`);
  }
});
