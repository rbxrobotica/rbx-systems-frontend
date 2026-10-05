import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';

const { productEvidence } = await importTypeScriptModule(
  new URL('../src/lib/content/product-evidence.ts', import.meta.url)
);
const publicRepositories = new Set(['ldamasio/robson', 'rbxrobotica/thalamus-core']);
const commitPattern = /^[a-f0-9]{40}$/;

// Read the JPEG frame header so a copied or resized asset cannot silently
// disagree with the intrinsic dimensions used to reserve its layout space.
function jpegDimensions(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'JPEG start marker');
  assert.equal(bytes.readUInt16BE(bytes.length - 2), 0xffd9, 'JPEG end marker');
  const frames = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
  ]);
  let offset = 2;
  while (offset < bytes.length - 1) {
    assert.equal(bytes[offset], 0xff, 'JPEG segment marker');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(offset);
    assert.ok(length >= 2 && offset + length <= bytes.length, 'JPEG segment bounds');
    if (frames.has(marker)) {
      assert.ok(length >= 8, 'JPEG frame header');
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  assert.fail('JPEG has no frame dimensions');
}

test('the evidence gallery covers the six requested products exactly once', () => {
  const ids = productEvidence.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), [
    'robson',
    'robson-code',
    'satwake',
    'strategos',
    'thalamus',
    'verentir'
  ]);
});

test('captures are local JPEGs with accurate dimensions and a bounded download budget', async () => {
  const sources = new Set();
  let totalBytes = 0;
  for (const entry of productEvidence) {
    const capture = entry.capture;
    assert.match(capture.src, /^\/products\/evidence\/[a-z0-9-]+\.jpg$/);
    assert.equal(
      capture.src,
      `/products/evidence/${entry.id}-main-${capture.commit.slice(0, 7)}.jpg`
    );
    assert.ok(!sources.has(capture.src), `reused capture: ${capture.src}`);
    sources.add(capture.src);
    const bytes = await readFile(new URL(`../static${capture.src}`, import.meta.url));
    assert.deepEqual(
      jpegDimensions(bytes),
      { width: capture.width, height: capture.height },
      `${entry.id}: declared dimensions must match the JPEG frame`
    );
    assert.ok(capture.width > 0 && capture.height > 0, `${entry.id}: positive dimensions`);
    assert.ok(bytes.length <= 250 * 1024, `${entry.id}: capture exceeds 250 KiB`);
    totalBytes += bytes.length;
  }
  assert.ok(totalBytes <= 1024 * 1024, `all captures exceed 1 MiB: ${totalBytes} bytes`);
});

test('excerpts and captures identify a repository revision and a bounded source range', () => {
  for (const entry of productEvidence) {
    assert.match(entry.name, /\S/);
    for (const source of [entry, entry.capture]) {
      assert.match(source.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
      assert.match(source.commit, commitPattern);
    }
    assert.match(entry.path, /^[A-Za-z0-9_./-]+$/);
    assert.ok(!entry.path.startsWith('/') && !entry.path.includes('\\'));
    assert.ok(entry.path.split('/').every((part) => part && part !== '.' && part !== '..'));
    assert.ok(Number.isSafeInteger(entry.startLine) && entry.startLine > 0);
    assert.match(entry.code, /\S/);
    assert.ok(!entry.code.includes('\r') && !entry.code.endsWith('\n'));
    const lines = entry.code.split('\n');
    assert.ok(lines.length >= 8 && lines.length <= 14, `${entry.id}: excerpt must have 8–14 lines`);
    assert.ok(Number.isSafeInteger(entry.startLine + lines.length - 1));
    assert.ok(['rust', 'typescript'].includes(entry.language));
    assert.ok(entry.path.endsWith(entry.language === 'rust' ? '.rs' : '.ts'));
  }
});

test('only public repositories link to GitHub, with matching main and pinned line ranges', () => {
  for (const entry of productEvidence) {
    if (!publicRepositories.has(entry.repository)) {
      assert.equal(entry.sourceUrl, undefined, `${entry.id}: private main link`);
      assert.equal(entry.permalinkUrl, undefined, `${entry.id}: private commit link`);
      continue;
    }
    const endLine = entry.startLine + entry.code.split('\n').length - 1;
    const suffix = `/${entry.path}#L${entry.startLine}-L${endLine}`;
    assert.equal(entry.sourceUrl, `https://github.com/${entry.repository}/blob/main${suffix}`);
    assert.equal(
      entry.permalinkUrl,
      `https://github.com/${entry.repository}/blob/${entry.commit}${suffix}`
    );
  }
});

test('each product has Portuguese and English descriptions, image alternatives and captions', () => {
  for (const entry of productEvidence) {
    for (const field of [entry.description, entry.capture.alt, entry.capture.caption]) {
      assert.deepEqual(Object.keys(field).sort(), ['en', 'pt-BR']);
      for (const locale of ['pt-BR', 'en']) {
        assert.equal(typeof field[locale], 'string');
        assert.ok(field[locale].trim().length >= 20, `${entry.id}: missing ${locale} context`);
      }
      assert.notEqual(field['pt-BR'], field.en, `${entry.id}: untranslated evidence copy`);
    }
  }
});
