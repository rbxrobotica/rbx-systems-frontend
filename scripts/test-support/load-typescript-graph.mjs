import { readFileSync } from 'node:fs';
import ts from 'typescript';

/**
 * Load a TypeScript module together with the relative TypeScript modules it
 * imports, in Node versions that do not support type stripping.
 *
 * Every call builds a fresh module graph, so module-level state (caches,
 * counters) never leaks from one test into the next. Relative imports and
 * imports through the `$lib` alias are followed, to TypeScript modules and to
 * JSON files. Anything else must be supplied through `externals`, keyed by
 * the exact import specifier. `externals` wins over resolution, which makes
 * it the seam for replacing a dependency with a test double or for sharing
 * one module instance between two graphs.
 */
const LIB = new URL('../../src/lib/', import.meta.url);

export function loadTypeScriptGraph(entryUrl, externals = {}) {
  const modules = new Map();
  const supplied = new Map(Object.entries(externals));

  const load = (url) => {
    const loaded = modules.get(url.href);
    if (loaded) return loaded;
    const exports = {};
    modules.set(url.href, exports);

    if (url.pathname.endsWith('.json')) {
      // What `import data from './data.json'` reads once transpiled.
      exports.default = JSON.parse(readFileSync(url, 'utf8'));
      return exports;
    }
    const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
    }).outputText;
    const require = (specifier) => {
      if (supplied.has(specifier)) return supplied.get(specifier);
      const base = specifier.startsWith('$lib/') ? LIB : url;
      const relative = specifier.startsWith('$lib/') ? specifier.slice('$lib/'.length) : specifier;
      if (specifier.startsWith('.') || specifier.startsWith('$lib/')) {
        return load(new URL(relative.endsWith('.json') ? relative : `${relative}.ts`, base));
      }
      throw new Error(`Unexpected dependency of ${url.pathname}: ${specifier}`);
    };
    new Function('require', 'exports', compiled)(require, exports);
    return exports;
  };

  return load(new URL(entryUrl));
}
