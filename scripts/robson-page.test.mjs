import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { importTypeScriptModule } from './test-support/import-typescript-module.mjs';

const localeModule = await importTypeScriptModule(
  new URL('../src/lib/i18n/locale.ts', import.meta.url)
);
const hosts = [
  ['https://rbx.ia.br', 'pt-BR'],
  ['https://rbxsystems.ch', 'en']
];

// Run each real route with its actual locale resolver and an isolated CMS
// boundary. No network, credentials or SvelteKit runtime are needed.
async function routeFactory(route) {
  const source = await readFile(
    new URL(`../src/routes/${route}/+page.server.ts`, import.meta.url),
    'utf8'
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText;
  return (loadPageOrNull) => {
    const exports = {};
    const require = (specifier) => {
      if (specifier === '$lib/server/content/gateway') return { loadPageOrNull };
      if (specifier === '$lib/i18n/locale') return localeModule;
      throw new Error(`Unexpected route dependency: ${specifier}`);
    };
    new Function('require', 'exports', compiled)(require, exports);
    return exports.load;
  };
}

for (const route of ['produtos/robson', 'products/robson']) {
  const createLoad = await routeFactory(route);

  test(`${route}: a missing CMS page preserves locale and returns the null used by fallback copy`, async () => {
    for (const [host, locale] of hosts) {
      const calls = [];
      const load = createLoad(async (...args) => {
        calls.push(args);
        return null;
      });
      assert.deepEqual(await load({ url: new URL(`/${route}`, host) }), { locale, page: null });
      assert.deepEqual(calls, [['robson', locale]]);
    }
  });

  test(`${route}: existing CMS content is preserved in both host locales`, async () => {
    for (const [host, locale] of hosts) {
      const page = { title: `Robson ${locale}`, html: '<p>Published product copy.</p>' };
      const load = createLoad(async (key, requestedLocale) => {
        assert.equal(key, 'robson');
        assert.equal(requestedLocale, locale);
        return page;
      });
      const result = await load({ url: new URL(`/${route}`, host) });
      assert.equal(result.page, page);
      assert.equal(result.locale, locale);
    }
  });

  test(`${route}: an unavailable CMS is not hidden by the missing-content fallback`, async () => {
    const unavailable = Object.assign(new Error('CMS unavailable'), { status: 503 });
    const load = createLoad(async () => {
      throw unavailable;
    });
    await assert.rejects(load({ url: new URL(`/${route}`, hosts[0][0]) }), (error) => {
      assert.equal(error, unavailable);
      return true;
    });
  });
}
