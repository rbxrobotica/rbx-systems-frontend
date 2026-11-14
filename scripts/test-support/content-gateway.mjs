import * as asyncHooks from 'node:async_hooks';
import * as kit from '@sveltejs/kit';
import * as entities from 'entities';
import * as jsYaml from 'js-yaml';
import * as markedModule from 'marked';
import { createFakeS3 } from './fake-s3-client.mjs';
import { loadTypeScriptGraph } from './load-typescript-graph.mjs';

const source = (path) => new URL(`../../src/${path}`, import.meta.url);

/**
 * Build a fresh Content Gateway (real gateway, cache, store and request
 * budget modules) on top of an in-memory bucket. Module state starts empty on
 * every call, so each test gets cold caches.
 */
export function createContentGateway({ pageSize } = {}) {
  const s3 = createFakeS3({ pageSize });
  const budget = loadTypeScriptGraph(source('lib/server/content/request-budget.ts'), {
    'node:async_hooks': asyncHooks
  });
  const gateway = loadTypeScriptGraph(source('lib/server/content/gateway.ts'), {
    '@aws-sdk/client-s3': s3.module,
    '@sveltejs/kit': kit,
    entities,
    'js-yaml': jsYaml,
    marked: markedModule,
    './request-budget': budget
  });
  return { s3, gateway, budget };
}

/** The real `handle` hook, wired to the given gateway and its request budget. */
export function loadHandleHook({ gateway, budget }) {
  return loadTypeScriptGraph(source('hooks.server.ts'), {
    '$lib/server/content/gateway': gateway,
    '$lib/server/content/request-budget': budget
  }).handle;
}

/**
 * The event the hook reads, for a request as the server would see it: the
 * address, the method and the headers a client or the ingress sends.
 */
export function hookEvent(address, { routeId = null, method = 'GET', headers = {} } = {}) {
  const url = new URL(address);
  return {
    url,
    request: new Request(url, { method, headers: { host: url.host, ...headers } }),
    route: { id: routeId }
  };
}

/** Slug of the `index`th post of `publishJournal`. A listing reads posts in this order. */
export function journalSlug(index) {
  return `2026-01-${String((index % 28) + 1).padStart(2, '0')}-post-${index}`;
}

/**
 * Publish `count` posts in both locales, plus one post that exists only in
 * pt-BR and one legacy object without a locale suffix (listed, never read).
 * Returns how many posts each locale listing will read.
 */
export function publishJournal(s3, count) {
  const post = (slug, locale) =>
    [
      '---',
      `title: '${slug} (${locale})'`,
      `date: '${slug.slice(0, 10)}'`,
      'tags: [engineering]',
      `excerpt: 'Excerpt of ${slug}.'`,
      '---',
      '',
      `Body of ${slug}.`
    ].join('\n');

  for (let i = 1; i <= count; i += 1) {
    const slug = journalSlug(i);
    s3.objects.set(`blog/posts/${slug}.pt-BR.md`, post(slug, 'pt-BR'));
    s3.objects.set(`blog/posts/${slug}.en.md`, post(slug, 'en'));
  }
  s3.objects.set('blog/posts/2026-02-01-only-pt.pt-BR.md', post('2026-02-01-only-pt', 'pt-BR'));
  s3.objects.set('blog/posts/2025-01-01-legacy.md', post('2025-01-01-legacy', 'pt-BR'));
  return { 'pt-BR': count + 1, en: count };
}

/** Let promise chains that were started in the background run to completion. */
export function backgroundWorkSettled() {
  return new Promise((resolve) => setImmediate(resolve));
}

/** Replace the wall clock the cache reads with one the test advances by hand. */
export function controlClock(t) {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  return {
    advance(milliseconds) {
      now += milliseconds;
    }
  };
}
