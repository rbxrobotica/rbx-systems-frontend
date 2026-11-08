import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { buildRelease } from './build-release.mjs';

// Synthetic metadata fixture; it does not claim to identify a repository commit.
const revision = 'a'.repeat(40);
const builtAt = '2026-11-08T03:04:05Z';
const detailsRoute = new URL('../src/routes/health/details/+server.ts', import.meta.url);
const legacyRoute = new URL('../src/routes/healthz/+server.ts', import.meta.url);

// Execute the actual self-contained route in an isolated Node context, with
// the same literal input that Vite defines. Type-only imports are erased.
async function routeHandler(url, metadata) {
  const source = await readFile(url, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const exports = {};
  const context = {
    exports,
    Response,
    fetch: () => {
      throw new Error('A liveness route must not call a dependency');
    },
    process: {
      env: {
        RBX_BUILD_REVISION: 'b'.repeat(40),
        RBX_BUILD_BUILT_AT: '2099-01-01T00:00:00Z',
        GITHUB_SHA: 'c'.repeat(40),
        HOSTNAME: 'private-runtime-identity',
        DATABASE_URL: 'must-never-appear'
      }
    }
  };
  if (metadata !== undefined) context.__RBX_BUILD_RELEASE__ = metadata;
  vm.runInNewContext(compiled, context, { filename: url.pathname, timeout: 1000 });
  return exports.GET;
}

test('build metadata accepts only full lowercase revisions and valid UTC instants', () => {
  assert.deepEqual(buildRelease({ revision, builtAt }), { revision, builtAt });
  assert.equal(
    buildRelease({ builtAt: '2024-02-29T12:00:00.123456Z' }).builtAt,
    '2024-02-29T12:00:00.123456Z'
  );
  assert.equal(buildRelease({ builtAt: '2026-11-08T03:04:05+00:00' }).builtAt, builtAt);
});

test('missing or invalid release values stay unknown instead of becoming invented evidence', () => {
  assert.deepEqual(buildRelease(), { revision: null, builtAt: null });
  for (const invalid of [
    null,
    12,
    '',
    'main',
    '1030812',
    revision.toUpperCase(),
    `${revision}\n`,
    'g'.repeat(40)
  ]) {
    assert.equal(buildRelease({ revision: invalid }).revision, null);
  }
  for (const invalid of [
    null,
    12,
    '',
    'now',
    '2026-02-29T00:00:00Z',
    '2026-11-08T24:00:00Z',
    '2026-11-08T03:04:05-03:00',
    '2026-11-08T03:04:05',
    '2026-11-08T03:04:05Z\n'
  ]) {
    assert.equal(buildRelease({ builtAt: invalid }).builtAt, null);
  }
  assert.deepEqual(buildRelease({ revision: 'short', builtAt }), { revision: null, builtAt });
});

test('the actual detailed route serves only the versioned public contract without caching', async () => {
  const GET = await routeHandler(detailsRoute, buildRelease({ revision, builtAt }));
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.match(response.headers.get('content-type'), /^application\/json/);
  assert.deepEqual(await response.json(), {
    schemaVersion: 'rbx.health.v1',
    service: 'rbx-systems-frontend',
    health: { status: 'up' },
    release: { revision, builtAt }
  });
});

test('unknown build identity stays null even when the runtime advertises different metadata', async () => {
  for (const metadata of [
    undefined,
    buildRelease(),
    buildRelease({ revision: 'invalid', builtAt: 'invalid' })
  ]) {
    const GET = await routeHandler(detailsRoute, metadata);
    const response = GET();
    assert.deepEqual((await response.json()).release, { revision: null, builtAt: null });
  }
});

test('responses cannot mutate the release identity used by later probes', async () => {
  const GET = await routeHandler(detailsRoute, buildRelease({ revision, builtAt }));
  const first = await GET().json();
  first.release.revision = 'd'.repeat(40);
  assert.deepEqual((await GET().json()).release, { revision, builtAt });
});

test('the existing /healthz route is still the same cheap plain-text probe', async () => {
  const GET = await routeHandler(legacyRoute);
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain');
  assert.equal(await response.text(), 'ok');
});
