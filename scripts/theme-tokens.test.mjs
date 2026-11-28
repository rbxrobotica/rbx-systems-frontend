// Guards the two-theme contract described in docs/themes.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), 'utf8');

function svelteFiles(dir) {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return svelteFiles(path);
    return entry.name.endsWith('.svelte') ? [path] : [];
  });
}

const tokens = read('src/lib/design/tokens.css');
const declared = (block) => new Set([...block.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]));
const lightStart = tokens.indexOf("[data-theme='light'] {");
const lightBlock = tokens.slice(lightStart, tokens.indexOf('\n}', lightStart));
const rootStart = tokens.indexOf(':root {');
const rootBlock = tokens.slice(rootStart, tokens.indexOf('\n}', rootStart));

test('components read accent role tokens, not the cyan scale', () => {
  const offenders = svelteFiles('src').flatMap((file) =>
    read(file)
      .split('\n')
      .map((line, index) => ({ file, line: index + 1, text: line.trim() }))
      .filter(({ text }) => /--cyan-(signal|brand|muted|dim|subtle)/.test(text))
  );
  assert.deepEqual(offenders, []);
});

test('the light theme only sets tokens that the dark theme declares', () => {
  assert.ok(lightStart > 0, 'light block not found');
  const dark = declared(rootBlock);
  const unknown = [...declared(lightBlock)].filter((name) => !dark.has(name));
  assert.deepEqual(unknown, []);
});

test('the light theme sets every colour role', () => {
  const light = declared(lightBlock);
  const roles = [...declared(rootBlock)].filter((name) =>
    /^--(bg-[0-3]|bg-overlay|fg-[0-3]|border|border-strong|cta|cta-hover|on-cta|accent-[a-z-]+|field-bg|ok|warn|err|info)$/.test(
      name
    )
  );
  const missing = roles.filter((name) => !light.has(name));
  assert.deepEqual(missing, []);
});

test('app.html and theme.ts use the same storage key and theme colours', () => {
  const html = read('src/app.html');
  const module = read('src/lib/design/theme.ts');
  const key = module.match(/THEME_KEY = '([^']+)'/)?.[1];
  assert.ok(key, 'THEME_KEY not found');
  assert.ok(html.includes(`localStorage.getItem('${key}')`), 'app.html reads another key');
  // Without a stored choice the page follows the system, and a stored choice
  // of either theme wins over it.
  assert.match(html, /matchMedia\('\(prefers-color-scheme: light\)'\)/);
  assert.match(html, /value === 'light' \|\| value === 'dark' \? value : null/);
  assert.match(html, /addEventListener\('change'/);
  for (const colour of ['#07080A', '#F2EFE6']) {
    assert.ok(html.includes(colour), `app.html lacks ${colour}`);
    assert.ok(module.includes(colour), `theme.ts lacks ${colour}`);
  }
});
