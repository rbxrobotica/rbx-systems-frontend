import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createContentGateway,
  hookEvent,
  journalSlug,
  loadHandleHook,
  publishJournal
} from './test-support/content-gateway.mjs';
import { loadTypeScriptGraph } from './test-support/load-typescript-graph.mjs';
import { seededRandom } from './test-support/seeded-random.mjs';

// The site answers on one host, the first path segment names the language,
// and the two earlier hosts redirect page by page. These tests hold the
// whole table: what is served, what is redirected and where, in one hop.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (rel) => new URL(`../src/${rel}`, import.meta.url);

const { DEFAULT_LOCALE, detectLocaleFromUrl, isHostWidePath, localeOfPath, stripLocalePrefix } =
  loadTypeScriptGraph(source('lib/i18n/locale.ts'));
const alternates = loadTypeScriptGraph(source('lib/seo/alternates.ts'));
const { SITE_ORIGIN, SITE_HOST, LEGACY_HOST_LOCALE } = loadTypeScriptGraph(
  source('lib/seo/site.ts')
);
const { negotiateLocale, resolveRedirect } = loadTypeScriptGraph(source('lib/seo/redirects.ts'));
const { RETIRED_PATHS, JOURNAL_PAGES } = alternates;
const { BRIEFING_LANDING } = loadTypeScriptGraph(source('lib/seo/site.ts'));
const { reroute } = loadTypeScriptGraph(source('hooks.ts'));

const LOCALES = ['pt-BR', 'en'];
const SEGMENT = { 'pt-BR': '/pt-br', en: '/en' };
const LEGACY_HOSTS = Object.entries(LEGACY_HOST_LOCALE);

/** Route paths under src/routes that have the given file. */
function routesWith(file, dir = path.join(root, 'src/routes'), prefix = '') {
  const routes = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const route = `${prefix}/${entry.name}`;
    const child = path.join(dir, entry.name);
    if (existsSync(path.join(child, file))) routes.push(route);
    routes.push(...routesWith(file, child, route));
  }
  return routes;
}

const pageRoutes = ['/', ...routesWith('+page.svelte')];
const staticPages = pageRoutes.filter((route) => !route.includes('['));
const endpointRoutes = routesWith('+server.ts');

/** A request to the site host, as `resolveRedirect` reads it. */
const onSite = (pathname, extra = {}) => ({
  hosts: [SITE_HOST],
  urlHost: SITE_HOST,
  method: 'GET',
  pathname,
  search: '',
  ...extra
});
const onHost = (host, pathname, extra = {}) => ({
  ...onSite(pathname, extra),
  hosts: [host],
  urlHost: host
});

/** Path and query of a Location, absolute or not. */
const pathOf = (location) => new URL(location, SITE_ORIGIN).pathname;

/** The route a served address is matched against, as the router sees it. */
const routed = (pathname) => reroute({ url: new URL(pathname, SITE_ORIGIN) });

test('the first segment of a path names its language', () => {
  for (const [pathname, locale, rest] of [
    ['/pt-br', 'pt-BR', '/'],
    ['/pt-br/sobre', 'pt-BR', '/sobre'],
    ['/en', 'en', '/'],
    ['/en/about', 'en', '/about'],
    ['/en/blog/a-post', 'en', '/blog/a-post'],
    ['/', undefined, '/'],
    ['/about', undefined, '/about'],
    // A segment is whole: these only begin like one.
    ['/english', undefined, '/english'],
    ['/pt-brasil/x', undefined, '/pt-brasil/x'],
    ['/enx', undefined, '/enx'],
    // The segment is lower case; the server redirects any other case.
    ['/PT-BR/sobre', undefined, '/PT-BR/sobre']
  ]) {
    assert.equal(localeOfPath(pathname), locale, pathname);
    assert.equal(stripLocalePrefix(pathname), rest, pathname);
  }
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(detectLocaleFromUrl(new URL('/pt-br/sobre', SITE_ORIGIN)), 'pt-BR');
  assert.equal(detectLocaleFromUrl(new URL('/llms.txt', SITE_ORIGIN)), 'en');
});

test('every static file and every endpoint without a language is host-wide, and no page is', () => {
  const files = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name), `${prefix}/${entry.name}`);
      else files.push(`${prefix}/${entry.name}`);
    }
  };
  walk(path.join(root, 'static'), '');
  assert.ok(files.length > 5, 'static files were found');
  for (const file of files) {
    assert.ok(isHostWidePath(file), `${file} is served by the host but is not host-wide`);
  }

  // The three files that depend on the language live under the segment.
  const localeFiles = ['/llms.txt', '/rss.xml', '/sitemap.xml'];
  assert.deepEqual(
    endpointRoutes.filter((route) => !isHostWidePath(route)).sort(),
    localeFiles,
    'an endpoint is either host-wide or one of the files of a language'
  );
  for (const route of pageRoutes) {
    assert.ok(!isHostWidePath(route), `${route} is a page and must live under a locale segment`);
  }
});

test('the router matches a page without its segment and leaves host-wide paths alone', () => {
  assert.equal(routed('/en/about'), '/about');
  assert.equal(routed('/pt-br/sobre'), '/sobre');
  assert.equal(routed('/pt-br'), '/');
  assert.equal(routed('/en/blog/a-post'), '/blog/a-post');
  assert.equal(routed('/en/sitemap.xml'), '/sitemap.xml');
  assert.equal(routed('/sitemap.xml'), '/sitemap.xml');
  assert.equal(routed('/api/chat'), '/api/chat');
  // One address per host-wide resource: under a segment it matches nothing.
  for (const pathname of ['/en/api/chat', '/pt-br/healthz', '/en/robots.txt', '/en/brand/x.svg']) {
    assert.equal(routed(pathname), pathname);
    assert.ok(!endpointRoutes.includes(routed(pathname)), pathname);
  }
});

test('a path is spelled for a language, and a link written as a site path gets its segment', () => {
  for (const [locale, pathname, spelled] of [
    ['en', '/sobre', '/about'],
    ['pt-BR', '/about', '/sobre'],
    ['en', '/produtos/robson', '/products/robson'],
    ['en', '/produtos/maestro', '/products/maestro'],
    ['pt-BR', '/products/maestro', '/produtos/maestro'],
    ['en', '/servicos/agentes-de-ia', '/services/ai-agents'],
    ['en', '/services/agentes-de-ia', '/services/ai-agents'],
    ['pt-BR', '/servicos/ai-agents', '/servicos/agentes-de-ia'],
    ['en', '/blog/um-post', '/blog/um-post'],
    ['en', '/journal', '/journal'],
    ['en', '/', '/'],
    ['en', '/en/sobre', '/about'],
    ['pt-BR', '/sobre/', '/sobre']
  ]) {
    assert.equal(alternates.spelledPath(locale, pathname), spelled, `${locale} ${pathname}`);
  }

  for (const [pathname, locale] of [
    ['/sobre', 'pt-BR'],
    ['/about', 'en'],
    ['/produtos', 'pt-BR'],
    ['/products/qualquer', 'en'],
    ['/servicos/llmops', 'pt-BR'],
    ['/services/llmops', 'en'],
    ['/', undefined],
    ['/journal', undefined],
    ['/blog/um-post', undefined],
    ['/leandro-damasio', undefined],
    ['/contact/strategos', undefined]
  ]) {
    assert.equal(alternates.localeOfSpelling(pathname), locale, pathname);
  }

  for (const [locale, href, expected] of [
    ['en', '/parceria#qualificacao', '/en/partnership#qualificacao'],
    ['pt-BR', '/partnership#qualificacao', '/pt-br/parceria#qualificacao'],
    ['pt-BR', '/products?utm_source=x#evidencias', '/pt-br/produtos?utm_source=x#evidencias'],
    ['en', '/', '/en'],
    ['pt-BR', '/blog/um-post', '/pt-br/blog/um-post'],
    ['en', '/rss.xml', '/en/rss.xml'],
    // A link written to an earlier name of a page goes to the page itself.
    ['en', '/blog', '/en/journal'],
    ['pt-BR', '/aboutus#time', '/pt-br/sobre#time'],
    ['en', '/journal/tag/risco', '/en/journal/tag/risk'],
    ['pt-BR', '/journal/2026-01-01-um-post', '/pt-br/blog/2026-01-01-um-post'],
    // The briefing landing has its own host; the link goes straight there.
    ['pt-BR', '/briefing-btc?utm_campaign=w01', `${BRIEFING_LANDING}?utm_campaign=w01`],
    ['en', '/briefing-btc', BRIEFING_LANDING],
    // Not a page of the site: unchanged.
    ['en', 'https://example.org/sobre', 'https://example.org/sobre'],
    ['en', '//example.org/sobre', '//example.org/sobre'],
    ['en', 'mailto:someone@example.org', 'mailto:someone@example.org'],
    ['en', '#qualificacao', '#qualificacao'],
    ['en', '', ''],
    ['en', '/api/assets/team/a.jpg', '/api/assets/team/a.jpg'],
    ['en', '/brand/rbx-og.jpg', '/brand/rbx-og.jpg'],
    ['en', '/products/evidence/robson-main.jpg', '/products/evidence/robson-main.jpg'],
    // A link that names its language keeps it, and is written as the address
    // that language answers: a segment, or an earlier host.
    ['en', '/pt-br/sobre', '/pt-br/sobre'],
    ['pt-BR', '/en/sobre', '/en/about'],
    ['pt-BR', '/EN/sobre/', '/en/about'],
    ['en', 'https://rbx.ia.br/sobre?x=1#y', '/pt-br/sobre?x=1#y'],
    ['pt-BR', 'https://www.rbxsystems.ch/sobre', '/en/about'],
    ['en', 'https://rbx.ia.br', '/pt-br'],
    ['en', 'http://rbx.ia.br/rss.xml', '/pt-br/rss.xml'],
    ['en', 'https://rbxsystems.ch/blog', '/en/journal'],
    [
      'pt-BR',
      'https://rbx.ia.br/briefing-btc?utm_campaign=w01',
      `${BRIEFING_LANDING}?utm_campaign=w01`
    ],
    ['en', 'https://rbx.ia.br/api/blog/cover/a-v1.jpg', '/api/blog/cover/a-v1.jpg'],
    // The site host itself, written in full: the language of the page.
    ['en', 'https://merovelis.com/sobre', '/en/about'],
    ['en', 'https://merovelis.com/pt-br/about/', '/pt-br/sobre'],
    // Another host of the earlier domains is not the site.
    ['en', 'https://robson.rbx.ia.br/painel', 'https://robson.rbx.ia.br/painel'],
    ['en', 'https://rbx.ia.br.example.org/sobre', 'https://rbx.ia.br.example.org/sobre'],
    // Read the way a request is read: decoded, then written one way.
    ['en', '/%61bout', '/en/about'],
    ['en', '/%73obre/', '/en/about'],
    ['en', '/journal/tag/governan%C3%A7a', '/en/journal/tag/governance'],
    ['en', '/journal/tag/日本', '/en/journal/tag/%E6%97%A5%E6%9C%AC'],
    ['en', '/blog/a b', '/en/blog/a%20b'],
    // Not an address the router reads, or not a page under a segment: as written.
    ['en', '/%', '/%'],
    ['en', '/en/../sobre', '/en/../sobre'],
    ['en', '/en/api/chat', '/en/api/chat'],
    ['en', '/en/pt-br/sobre', '/en/pt-br/sobre'],
    // A browser reads a backslash in a path as a slash: another address than
    // the one written, which may be another host. In a query it is a character.
    ['en', '/\\example.org/sobre', '/\\example.org/sobre'],
    ['en', '\\sobre', '\\sobre'],
    ['en', '/sobre\\time', '/sobre\\time'],
    ['en', 'https://rbx.ia.br/sobre\\time', 'https://rbx.ia.br/sobre\\time'],
    ['en', 'https://rbx.ia.br\\@example.org/sobre', 'https://rbx.ia.br\\@example.org/sobre'],
    ['en', '/sobre?de=a\\b', '/en/about?de=a\\b'],
    ['en', '/blog/a%5Cb', '/en/blog/a%5Cb']
  ]) {
    assert.equal(alternates.siteHref(locale, href), expected, `${locale} ${href}`);
  }

  assert.equal(alternates.localizedUrl('en', '/sobre'), `${SITE_ORIGIN}/en/about`);
  assert.equal(alternates.localizedUrl('pt-BR', '/'), `${SITE_ORIGIN}/pt-br`);
  assert.equal(SITE_ORIGIN, 'https://merovelis.com');
});

test('hreflang alternates are reciprocal, on the site host and never a redirect', () => {
  const mapped = Object.keys(alternates.LOCALE_PATH_MAP);
  assert.ok(mapped.length > 40, 'the route map was read');
  for (const pathname of mapped) {
    const links = alternates.getAlternates('pt-BR', pathname);
    assert.deepEqual(
      links.map((link) => link.hreflang),
      ['pt-BR', 'en', 'x-default'],
      pathname
    );
    const [pt, en, fallback] = links.map((link) => link.href);
    assert.equal(fallback, en, `${pathname}: x-default is the English page`);
    for (const [locale, href] of [
      ['pt-BR', pt],
      ['en', en]
    ]) {
      // eslint-disable-next-line security/detect-object-injection -- locale is one of the two literals above
      const segment = SEGMENT[locale];
      assert.ok(
        href === `${SITE_ORIGIN}${segment}` || href.startsWith(`${SITE_ORIGIN}${segment}/`),
        `${pathname}: ${href}`
      );
      // The page each alternate names lists the same three addresses back.
      assert.deepEqual(alternates.getAlternates(locale, pathOf(href)), links, href);
      // And it is the address the page is served at, not one that redirects.
      assert.equal(resolveRedirect(onSite(pathOf(href))), undefined, href);
      const route = routed(pathOf(href));
      assert.ok(
        staticPages.includes(route) || /^\/(services|servicos)\/[a-z-]+$/.test(route),
        `${href} is not a route`
      );
    }
  }
  assert.equal(alternates.getAlternates('en', '/blog/um-post'), undefined);
});

test('each earlier host sends every page, in one hop, to the same page in its language', () => {
  for (const [host, locale] of LEGACY_HOSTS) {
    for (const name of [host, `www.${host}`]) {
      for (const route of staticPages) {
        const redirect = resolveRedirect(onHost(name, route, { search: '?utm_source=x' }));
        const expected = alternates.localizedHref(locale, route);
        assert.deepEqual(
          redirect,
          { status: 301, location: `${SITE_ORIGIN}${expected}?utm_source=x`, negotiated: false },
          `${name}${route}`
        );
        // One hop: the address it lands on is served, and it is a real page.
        assert.equal(resolveRedirect(onSite(expected)), undefined, expected);
        assert.ok(staticPages.includes(routed(expected)), `${expected} is not a route`);
      }
    }
  }

  const to = (host, pathname, extra) => resolveRedirect(onHost(host, pathname, extra))?.location;
  // The host names the language, whatever the spelling of the path.
  assert.equal(to('rbx.ia.br', '/'), `${SITE_ORIGIN}/pt-br`);
  assert.equal(to('rbxsystems.ch', '/'), `${SITE_ORIGIN}/en`);
  assert.equal(to('rbxsystems.ch', '/sobre'), `${SITE_ORIGIN}/en/about`);
  assert.equal(to('rbx.ia.br', '/about'), `${SITE_ORIGIN}/pt-br/sobre`);
  assert.equal(to('rbx.ia.br', '/sobre/'), `${SITE_ORIGIN}/pt-br/sobre`);
  // Dynamic pages keep their slug; a prefix that carries one is respelled.
  assert.equal(
    to('rbx.ia.br', '/blog/2026-01-01-um-post'),
    `${SITE_ORIGIN}/pt-br/blog/2026-01-01-um-post`
  );
  assert.equal(to('rbxsystems.ch', '/produtos/maestro'), `${SITE_ORIGIN}/en/products/maestro`);
  assert.equal(
    to('rbxsystems.ch', '/services/agentes-de-ia'),
    `${SITE_ORIGIN}/en/services/ai-agents`
  );
  assert.equal(to('rbx.ia.br', '/journal/tag/risk'), `${SITE_ORIGIN}/pt-br/journal/tag/risk`);
  // A path that already names a language keeps it.
  assert.equal(to('rbx.ia.br', '/en/about'), `${SITE_ORIGIN}/en/about`);
  // Files of a language go under the segment; host-wide paths keep their address.
  assert.equal(to('rbx.ia.br', '/sitemap.xml'), `${SITE_ORIGIN}/pt-br/sitemap.xml`);
  assert.equal(to('rbxsystems.ch', '/rss.xml'), `${SITE_ORIGIN}/en/rss.xml`);
  assert.equal(to('rbx.ia.br', '/llms.txt'), `${SITE_ORIGIN}/pt-br/llms.txt`);
  assert.equal(to('rbx.ia.br', '/robots.txt'), `${SITE_ORIGIN}/robots.txt`);
  assert.equal(
    to('rbxsystems.ch', '/api/blog/cover/a-v1.jpg'),
    `${SITE_ORIGIN}/api/blog/cover/a-v1.jpg`
  );
  assert.equal(
    to('rbx.ia.br', '/estudos/criminalidade-sp'),
    `${SITE_ORIGIN}/estudos/criminalidade-sp`
  );
  // The landing of the briefing has its own host; attribution travels.
  assert.equal(
    to('rbx.ia.br', '/briefing-btc', { search: '?utm_campaign=w01' }),
    'https://briefingbtc.merovelis.com/?utm_campaign=w01'
  );
});

test('retired names of the previous sites still land on the live page', () => {
  for (const [retired, live] of Object.entries(RETIRED_PATHS)) {
    assert.ok(staticPages.includes(live), `${retired} points at ${live}, which is not a route`);
    for (const [host, locale] of LEGACY_HOSTS) {
      const expected = `${SITE_ORIGIN}${alternates.localizedHref(locale, live)}`;
      assert.equal(resolveRedirect(onHost(host, retired)).location, expected, `${host}${retired}`);
    }
    for (const locale of LOCALES) {
      // eslint-disable-next-line security/detect-object-injection -- locale iterates LOCALES
      const redirect = resolveRedirect(onSite(`${SEGMENT[locale]}${retired}`));
      assert.equal(redirect.status, 301, retired);
      assert.equal(redirect.location, alternates.localizedHref(locale, live), retired);
    }
  }
  // /blog alone is retired; a post under it is live.
  assert.equal(resolveRedirect(onSite('/en/blog/a-post')), undefined);
});

test('a post under /journal and a tag by an alias go to where they live, in the same hop', () => {
  // /journal/{slug} is the address an early sitemap advertised for a post.
  // The pages that really live under /journal are the ones the routes have.
  const journalRoutes = readdirSync(path.join(root, 'src/routes/journal'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual([...JOURNAL_PAGES].sort(), journalRoutes);

  for (const [pathname, live] of [
    ['/journal/2026-01-01-um-post', '/blog/2026-01-01-um-post'],
    ['/journal/tag/risco', '/journal/tag/risk'],
    ['/journal/tag/Engenharia', '/journal/tag/engineering'],
    ['/journal/tag/governança', '/journal/tag/governance'],
    ['/journal/tag/risk', '/journal/tag/risk'],
    ['/journal', '/journal'],
    ['/journal/tag', '/journal/tag'],
    ['/journal/autor/leandro-damasio', '/journal/autor/leandro-damasio'],
    ['/journal/a/b', '/journal/a/b'],
    ['/blog/2026-01-01-um-post', '/blog/2026-01-01-um-post'],
    ['/precos', '/produtos'],
    ['/sobre', '/sobre']
  ]) {
    assert.equal(alternates.livePath(pathname), live, pathname);
    assert.equal(alternates.livePath(live), live, `${live} is where it lives`);
  }

  const to = (request) => resolveRedirect(request)?.location;
  assert.equal(
    to(onHost('rbx.ia.br', '/journal/2026-01-01-um-post', { search: '?a=1' })),
    `${SITE_ORIGIN}/pt-br/blog/2026-01-01-um-post?a=1`
  );
  assert.equal(
    to(onHost('rbxsystems.ch', '/journal/tag/risco')),
    `${SITE_ORIGIN}/en/journal/tag/risk`
  );
  assert.equal(to(onSite('/en/journal/tag/risco', { search: '?a=1' })), '/en/journal/tag/risk?a=1');
  assert.equal(to(onSite('/pt-br/journal/2026-01-01-um-post')), '/pt-br/blog/2026-01-01-um-post');
  // A tag that is not ASCII is written escaped, in one way.
  assert.equal(to(onSite('/en/journal/tag/%E6%97%A5%E6%9C%AC')), undefined);
  assert.equal(to(onSite('/en/journal/tag/日本')), '/en/journal/tag/%E6%97%A5%E6%9C%AC');
});

test('the host of a request is the name it carries, and the site host wins', () => {
  const ask = (hosts, urlHost, pathname = '/sobre') =>
    resolveRedirect({ hosts, urlHost, method: 'GET', pathname, search: '' })?.location;
  const moved = `${SITE_ORIGIN}/pt-br/sobre`;

  // The Host header, with a port, in any case, with a trailing dot.
  assert.equal(ask(['rbx.ia.br:443']), moved);
  assert.equal(ask(['RBX.IA.BR']), moved);
  assert.equal(ask(['rbx.ia.br.']), moved);
  // Behind the ingress of the deployment that serves the site host: the
  // forwarded host (first of a list) and the Host header are the name the
  // visitor used, the URL is the fixed ORIGIN.
  assert.equal(ask(['rbx.ia.br, 10.42.0.7', 'rbx.ia.br'], SITE_HOST), moved);
  assert.equal(ask(['www.rbx.ia.br', '10.42.0.7:8080'], SITE_HOST), moved);
  // The URL alone: a deployment whose ORIGIN is still the earlier host,
  // reached by pod address.
  assert.equal(ask([null, '10.42.0.7:8080'], 'rbx.ia.br'), moved);

  // That same deployment, asked for the site host, serves it. It must not
  // send the site host to itself without end.
  assert.equal(ask([SITE_HOST, SITE_HOST], 'rbx.ia.br'), '/pt-br/sobre');
  assert.equal(ask([SITE_HOST, SITE_HOST], 'rbx.ia.br', '/pt-br/sobre'), undefined);
  // A forwarded host that names an earlier host, on a request for the site
  // host, changes nothing: no redirect to the address the request already has.
  assert.equal(ask(['rbx.ia.br', SITE_HOST], SITE_HOST), '/pt-br/sobre');
  assert.equal(ask(['rbx.ia.br', SITE_HOST], SITE_HOST, '/pt-br/sobre'), undefined);
  assert.equal(
    ask(['rbxsystems.ch', `www.${SITE_HOST}`], SITE_HOST, '/en/about'),
    `${SITE_ORIGIN}/en/about`
  );

  // Only the two names and their www form: a look-alike is not one of them.
  for (const other of ['evil-rbx.ia.br', 'rbx.ia.br.example.org', 'staging.rbx.ia.br']) {
    assert.equal(ask([other], other), '/pt-br/sobre', other);
  }
  assert.equal(ask(['constructor'], '__proto__'), '/pt-br/sobre');
  assert.equal(ask([], undefined), '/pt-br/sobre');
});

test('the health probe is never redirected, on any host', () => {
  for (const [hosts, urlHost] of [
    [[SITE_HOST], SITE_HOST],
    [[`www.${SITE_HOST}`], SITE_HOST],
    [['rbx.ia.br'], 'rbx.ia.br'],
    [['www.rbxsystems.ch'], SITE_HOST],
    // A kubelet probe: pod address in Host, the ORIGIN of the deployment in the URL.
    [[null, '10.42.0.7:8080'], 'rbx.ia.br'],
    [[null, '10.42.0.7:8080'], SITE_HOST]
  ]) {
    assert.equal(
      resolveRedirect({ hosts, urlHost, method: 'GET', pathname: '/healthz', search: '' }),
      undefined,
      `${hosts.join(' ')} ${urlHost}`
    );
  }
});

test('on the site host, what has an address is served and nothing else is', () => {
  for (const pathname of [
    '/pt-br',
    '/en',
    '/pt-br/sobre',
    '/en/about',
    '/en/blog/a-post',
    '/pt-br/journal/tag/risk',
    '/pt-br/sitemap.xml',
    '/en/rss.xml',
    '/en/llms.txt',
    // Without a segment: the index of the sitemaps, the English llms.txt,
    // and the host-wide paths.
    '/sitemap.xml',
    '/llms.txt',
    '/robots.txt',
    '/api/chat',
    '/api/blog/cover/a-v1.jpg',
    '/brand/rbx-og.jpg',
    '/estudos/criminalidade-sp',
    // Not a page: the router answers 404 under the segment, in its language.
    '/en/nowhere',
    '/en/api/chat',
    '/en/pt-br/sobre',
    '/pt-br/pt-br'
  ]) {
    assert.equal(resolveRedirect(onSite(pathname)), undefined, pathname);
  }
});

test('an address is written one way: no trailing slash, no needless escape', () => {
  // The router would drop a trailing slash on its own, before the hook, and a
  // request for an earlier host would then take two hops. No route lets it.
  const declares = (file) =>
    /^export const trailingSlash = 'ignore';$/m.test(readFileSync(file, 'utf8'));
  assert.ok(declares(path.join(root, 'src/routes/+layout.ts')), 'the root layout');
  for (const route of endpointRoutes) {
    assert.ok(declares(path.join(root, 'src/routes', route, '+server.ts')), route);
  }

  for (const [pathname, location] of [
    ['/en/about/', '/en/about'],
    ['/en/about//', '/en/about'],
    ['/en/', '/en'],
    ['/pt-br/sobre/', '/pt-br/sobre'],
    ['/en/sobre/', '/en/about'],
    ['/en/blog/a-post/', '/en/blog/a-post'],
    ['/api/chat/', '/api/chat'],
    ['/robots.txt/', '/robots.txt'],
    ['/sitemap.xml/', '/sitemap.xml'],
    ['/en/rss.xml/', '/en/rss.xml'],
    // The router matches a path decoded: /en/%73obre is /en/sobre to it.
    ['/en/%73obre', '/en/about'],
    ['/en/%61bout', '/en/about'],
    ['/%65n/about', '/en/about'],
    ['/%70t-br/sobre', '/pt-br/sobre'],
    ['/%73obre', '/pt-br/sobre'],
    ['/en/blog/a%2Dpost', '/en/blog/a-post'],
    ['/%61pi/chat', '/api/chat'],
    // What needs an escape keeps it, in upper case, and an escaped slash stays escaped.
    ['/en/journal/tag/a%c3%a7%c3%a3o', '/en/journal/tag/acao'],
    ['/en/blog/a b', '/en/blog/a%20b'],
    ['/en/blog/a%2fb', undefined],
    ['/en/blog/a%2Fb', undefined],
    ['/en/blog/a%20b', undefined],
    ['/en/blog/50%25', undefined],
    ['/en/blog/%E6%97%A5', undefined],
    ['/en/blog/%e6%97%a5', '/en/blog/%E6%97%A5']
  ]) {
    const redirect = resolveRedirect(onSite(pathname, { search: '?a=1' }));
    assert.equal(redirect?.location, location && `${location}?a=1`, pathname);
    if (redirect) {
      assert.equal(redirect.status, 301, pathname);
      // Written that way, it is final.
      assert.equal(resolveRedirect(onSite(location)), undefined, location);
    }
  }

  // From an earlier host the slash and the escape are fixed in the hop that
  // changes the host.
  assert.equal(
    resolveRedirect(onHost('rbx.ia.br', '/sobre/', { search: '?a=1' })).location,
    `${SITE_ORIGIN}/pt-br/sobre?a=1`
  );
  assert.equal(
    resolveRedirect(onHost('rbxsystems.ch', '/%73obre/')).location,
    `${SITE_ORIGIN}/en/about`
  );
  assert.equal(
    resolveRedirect(onHost('rbx.ia.br', '/api/chat/')).location,
    `${SITE_ORIGIN}/api/chat`
  );

  // A malformed escape and a dot segment are not addresses: the router
  // answers the first with 400, and a parsed URL never carries the second.
  for (const pathname of ['/en/%', '/en/%zz', '/en/%E6', '/en/../sobre', '/en/./sobre', '/..']) {
    for (const request of [onSite(pathname), onHost('rbx.ia.br', pathname)]) {
      assert.equal(resolveRedirect(request), undefined, pathname);
    }
  }
});

test('a page path without a segment goes to the language of its spelling, or is negotiated', () => {
  const portuguese = 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7';
  for (const [pathname, location] of [
    ['/sobre', '/pt-br/sobre'],
    ['/about', '/en/about'],
    ['/products/robson', '/en/products/robson'],
    ['/servicos/llmops', '/pt-br/servicos/llmops'],
    ['/produtos/maestro', '/pt-br/produtos/maestro'],
    ['/contato/', '/pt-br/contato']
  ]) {
    // The spelling decides, whatever the browser asks for.
    for (const acceptLanguage of [portuguese, 'en-US,en;q=0.9', undefined]) {
      assert.deepEqual(
        resolveRedirect(onSite(pathname, { acceptLanguage, search: '?a=1' })),
        { status: 301, location: `${location}?a=1`, negotiated: false },
        pathname
      );
    }
  }

  for (const [pathname, pt, en] of [
    ['/', '/pt-br', '/en'],
    ['/journal', '/pt-br/journal', '/en/journal'],
    ['/blog/a-post', '/pt-br/blog/a-post', '/en/blog/a-post'],
    ['/leandro-damasio', '/pt-br/leandro-damasio', '/en/leandro-damasio'],
    ['/rss.xml', '/pt-br/rss.xml', '/en/rss.xml'],
    // A retired name has no language of its own either.
    ['/aboutus', '/pt-br/sobre', '/en/about'],
    ['/nowhere', '/pt-br/nowhere', '/en/nowhere']
  ]) {
    assert.deepEqual(
      resolveRedirect(onSite(pathname, { acceptLanguage: portuguese, search: '?a=1' })),
      { status: 302, location: `${pt}?a=1`, negotiated: true },
      pathname
    );
    for (const acceptLanguage of ['en-GB,en;q=0.9', 'fr-FR,fr;q=0.9', '', undefined, null]) {
      assert.deepEqual(
        resolveRedirect(onSite(pathname, { acceptLanguage })),
        { status: 302, location: en, negotiated: true },
        `${pathname} ${acceptLanguage}`
      );
    }
  }
});

test('the browser language is the first Portuguese or English range by weight', () => {
  for (const [header, locale] of [
    ['pt-BR', 'pt-BR'],
    ['pt', 'pt-BR'],
    ['pt-PT,pt;q=0.9', 'pt-BR'],
    ['en-US,en;q=0.9,pt;q=0.8', 'en'],
    ['fr;q=0.9, pt;q=0.5, en;q=0.4', 'pt-BR'],
    ['en;q=0.1, pt;q=0.9', 'pt-BR'],
    ['pt;q=0.5, en;q=0.5', 'pt-BR'],
    ['PT-br', 'pt-BR'],
    ['fr-FR,fr;q=0.9,de;q=0.8', 'en'],
    ['*', 'en'],
    ['pt;q=0', 'en'],
    ['pt;q=abc, en', 'en'],
    ['ptx, enx', 'en'],
    [',,;q=1,', 'en'],
    ['', 'en'],
    [undefined, 'en'],
    [null, 'en']
  ]) {
    assert.equal(negotiateLocale(header), locale, String(header));
  }
});

test('under a segment, a retired name or the spelling of the other language goes to the live page', () => {
  for (const [pathname, location] of [
    ['/en/sobre', '/en/about'],
    ['/pt-br/about', '/pt-br/sobre'],
    ['/en/produtos/maestro', '/en/products/maestro'],
    ['/en/servicos/agentes-de-ia', '/en/services/ai-agents'],
    ['/pt-br/services/ai-agents', '/pt-br/servicos/agentes-de-ia'],
    ['/en/aboutus', '/en/about'],
    ['/pt-br/blog', '/pt-br/journal'],
    ['/pt-br/blog/', '/pt-br/journal'],
    // The segment is lower case; one hop fixes case and spelling together.
    ['/PT-BR/sobre', '/pt-br/sobre'],
    ['/EN', '/en'],
    ['/En/sobre', '/en/about'],
    ['/Pt-Br/api/chat', '/pt-br/api/chat'],
    // A second segment names no page: only the case is fixed, then a 404.
    ['/EN/pt-br/sobre', '/en/pt-br/sobre']
  ]) {
    assert.deepEqual(
      resolveRedirect(onSite(pathname, { search: '?a=1' })),
      { status: 301, location: `${location}?a=1`, negotiated: false },
      pathname
    );
  }
  assert.equal(
    resolveRedirect(onSite('/en/briefing-btc', { search: '?utm_campaign=w01' })).location,
    'https://briefingbtc.merovelis.com/?utm_campaign=w01'
  );
});

test('the www name goes to the bare name in the same hop as any change of path', () => {
  const www = (pathname, extra) => resolveRedirect(onHost(`www.${SITE_HOST}`, pathname, extra));
  assert.deepEqual(www('/en/about'), {
    status: 301,
    location: `${SITE_ORIGIN}/en/about`,
    negotiated: false
  });
  assert.equal(www('/en/sobre').location, `${SITE_ORIGIN}/en/about`);
  assert.equal(www('/sobre').location, `${SITE_ORIGIN}/pt-br/sobre`);
  assert.equal(www('/robots.txt').location, `${SITE_ORIGIN}/robots.txt`);
  assert.equal(www('/sitemap.xml').location, `${SITE_ORIGIN}/sitemap.xml`);
  assert.deepEqual(www('/', { acceptLanguage: 'pt-BR' }), {
    status: 302,
    location: `${SITE_ORIGIN}/pt-br`,
    negotiated: true
  });

  // Any other name (a pod address, a preview, localhost) is left where it
  // is: a Location without a host.
  for (const host of ['localhost:5173', '10.42.0.7:8080', 'preview.example.test']) {
    assert.equal(resolveRedirect(onHost(host, '/en/about')), undefined, host);
    assert.equal(resolveRedirect(onHost(host, '/sobre')).location, '/pt-br/sobre', host);
    assert.equal(resolveRedirect(onHost(host, '/')).location, '/en', host);
  }
});

test('a request that is not a read keeps its method across the redirect', () => {
  const post = (hosts, pathname) =>
    resolveRedirect({ hosts, method: 'POST', pathname, search: '' });
  assert.deepEqual(post(['rbx.ia.br'], '/api/chat'), {
    status: 308,
    location: `${SITE_ORIGIN}/api/chat`,
    negotiated: false
  });
  assert.equal(post([SITE_HOST], '/sobre').status, 308);
  assert.equal(post([SITE_HOST], '/').status, 307);
  assert.equal(post([SITE_HOST], '/api/chat'), undefined);
  for (const method of ['GET', 'HEAD']) {
    assert.equal(resolveRedirect({ ...onSite('/sobre'), method }).status, 301, method);
    assert.equal(resolveRedirect({ ...onSite('/'), method }).status, 302, method);
  }
});

test('whatever is asked for, a redirect stays on the site, keeps the query and takes one hop', () => {
  const words = [
    'pt-br',
    'en',
    'PT-BR',
    'En',
    'sobre',
    'about',
    'produtos',
    'products',
    'servicos',
    'services',
    'robson',
    'agentes-de-ia',
    'ai-agents',
    'blog',
    'journal',
    'tag',
    'aboutus',
    'precos',
    'api',
    'chat',
    'healthz',
    'brand',
    'estudos',
    'sitemap.xml',
    'rss.xml',
    'llms.txt',
    'robots.txt',
    'briefing-btc',
    'um-post',
    'risco',
    'autor',
    '',
    '',
    '%73obre',
    '%65n',
    '%2F',
    'evil.example',
    'https:',
    'constructor',
    '__proto__',
    'a b',
    'ação'
  ];
  const hosts = [
    SITE_HOST,
    `www.${SITE_HOST}`,
    'rbx.ia.br',
    'www.rbx.ia.br',
    'rbxsystems.ch',
    'www.rbxsystems.ch',
    'localhost:5173',
    '10.42.0.7:8080'
  ];
  const searches = ['', '?a=1', '?next=//evil.example/x', '?q=%0d%0aSet-Cookie:x'];
  const headers = [undefined, 'pt-BR,pt;q=0.9', 'en', 'fr', ';;;', 'pt;q=2'];
  // A Location with a host names this site or the landing of the briefing.
  // One without a host starts with a single slash and then a locale segment,
  // a host-wide name of this site or one of the two files of the root, so it
  // is never read as another host.
  const staysOnTheSite = (location) =>
    /^https:\/\/merovelis\.com\//.test(location) ||
    /^https:\/\/briefingbtc\.merovelis\.com\/(\?|$)/.test(location) ||
    /^\/(pt-br|en)(\/|\?|$)/.test(location) ||
    (/^\/[^/]/.test(location) && isHostWidePath(location.split('?')[0])) ||
    ['/sitemap.xml', '/llms.txt'].includes(location.split('?')[0]);

  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const random = seededRandom(seed);
    for (let i = 0; i < 2500; i += 1) {
      const length = random.int(5);
      let pathname = '';
      for (let j = 0; j < length; j += 1) pathname += `/${random.pick(words)}`;
      if (pathname === '' || random.chance(0.1)) pathname += '/';
      const host = random.pick(hosts);
      const search = random.pick(searches);
      const method = random.chance(0.85) ? 'GET' : 'POST';
      const request = {
        hosts: [host],
        // Half the time the URL is the ORIGIN of the deployment of the site host.
        urlHost: random.chance(0.5) ? host : SITE_HOST,
        method,
        pathname,
        search,
        acceptLanguage: random.pick(headers)
      };
      const label = `seed ${seed}: ${method} ${host}${pathname}${search}`;
      const redirect = resolveRedirect(request);

      const legacy = host.replace(/^www\./, '') in LEGACY_HOST_LOCALE;
      if (pathname === '/healthz') {
        assert.equal(redirect, undefined, label);
        continue;
      }
      if (legacy || host.startsWith('www.')) assert.ok(redirect, `${label}: not redirected`);
      if (!redirect) continue;

      assert.ok(
        staysOnTheSite(redirect.location),
        `${label}: leaves the site: ${redirect.location}`
      );
      assert.ok(redirect.location.endsWith(search), `${label}: query lost`);
      // Nothing that would need an escape is written raw into the header.
      assert.match(redirect.location, /^[\x21-\x7e]+$/, label);
      assert.equal(redirect.negotiated, redirect.status === 302 || redirect.status === 307, label);
      assert.ok(
        (method === 'GET' ? [301, 302] : [308, 307]).includes(redirect.status),
        `${label}: ${redirect.status}`
      );

      if (redirect.location.startsWith('https://briefingbtc.')) continue;
      // The address it lands on is final: asked of the site host, it is served.
      const landed = redirect.location.slice(
        redirect.location.startsWith(SITE_ORIGIN) ? SITE_ORIGIN.length : 0,
        redirect.location.length - search.length
      );
      assert.equal(
        resolveRedirect({ ...request, hosts: [SITE_HOST], urlHost: SITE_HOST, pathname: landed }),
        undefined,
        `${label}: a second hop from ${landed}`
      );
    }
  }
});

test('the hook answers a redirect without rendering, and renders a page in the language of its path', async () => {
  const handle = loadHandleHook(createContentGateway());
  const rendered = [];
  const resolve = async (event, options) => {
    rendered.push(event.url.pathname);
    const html = options.transformPageChunk({ html: '<html lang="%sveltekit.lang%">' });
    return new Response(html, { headers: { 'content-type': 'text/html' } });
  };
  const ask = (address, options) => handle({ event: hookEvent(address, options), resolve });

  // An earlier host: permanent, bounded in the browser, nothing rendered.
  let response = await ask('https://rbxsystems.ch/sobre?utm_source=x');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), `${SITE_ORIGIN}/en/about?utm_source=x`);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
  assert.equal(response.headers.get('vary'), null);

  // The deployment of the site host, reached under an earlier name: the URL
  // is its fixed ORIGIN, the ingress forwards the name the visitor used.
  response = await ask(`${SITE_ORIGIN}/sobre`, {
    headers: { host: 'rbx.ia.br', 'x-forwarded-host': 'rbx.ia.br' }
  });
  assert.equal(response.headers.get('location'), `${SITE_ORIGIN}/pt-br/sobre`);

  // A forwarded host alone does not make a request for the site host one for
  // an earlier host: the page is rendered, not redirected to itself.
  response = await ask(`${SITE_ORIGIN}/pt-br/sobre`, {
    routeId: '/sobre',
    headers: { host: 'merovelis.com', 'x-forwarded-host': 'rbx.ia.br' }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(rendered.splice(0), ['/pt-br/sobre']);

  // The root: negotiated, so it varies and is not stored.
  response = await ask(`${SITE_ORIGIN}/`, { headers: { 'accept-language': 'pt-BR,pt;q=0.9' } });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/pt-br');
  assert.equal(response.headers.get('vary'), 'Accept-Language');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(rendered, []);

  // A permanent redirect a route sends on its own is bounded like the ones of
  // the hook. A temporary one is not stored, and a rule the route set stays.
  for (const [status, sent, expected] of [
    [301, {}, 'public, max-age=3600'],
    [308, {}, 'public, max-age=3600'],
    [302, {}, null],
    [307, {}, null],
    [301, { 'cache-control': 'no-store' }, 'no-store']
  ]) {
    response = await handle({
      event: hookEvent(`${SITE_ORIGIN}/en/blog/um-post`, { routeId: '/blog/[slug]' }),
      resolve: async () =>
        new Response(null, { status, headers: { location: '/en/blog/outro-post', ...sent } })
    });
    assert.equal(response.status, status);
    assert.equal(response.headers.get('location'), '/en/blog/outro-post');
    assert.equal(response.headers.get('cache-control'), expected, `a ${status} of a route`);
  }

  // A page: rendered once, in the language of its path.
  for (const [address, lang] of [
    [`${SITE_ORIGIN}/pt-br/sobre`, 'pt-BR'],
    [`${SITE_ORIGIN}/en/about`, 'en']
  ]) {
    response = await ask(address, { routeId: '/about' });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), `<html lang="${lang}">`);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
  }
  assert.deepEqual(rendered, ['/pt-br/sobre', '/en/about']);

  // The probe of a deployment whose ORIGIN is still an earlier host.
  response = await handle({
    event: hookEvent('https://rbx.ia.br/healthz', { headers: { host: '10.42.0.7:8080' } }),
    resolve: async () => new Response('ok')
  });
  assert.equal(response.status, 200);
});

/** Run a route endpoint with a stubbed post list and no network. */
function endpoint(route, posts = { 'pt-BR': [], en: [] }) {
  return loadTypeScriptGraph(source(`routes/${route}/+server.ts`), {
    '$lib/server/content/gateway': {
      // eslint-disable-next-line security/detect-object-injection -- locale is the argument of the route under test
      loadAllPosts: async (locale) => posts[locale]
    },
    '$lib/server/partnershipPricing': { getPartnershipExchangeRates: async () => null }
  }).GET;
}

const post = (slug, publicSlug = slug) => ({
  slug,
  publicSlug,
  title: `Title of ${slug}`,
  date: slug.slice(0, 10),
  author: 'Leandro Damasio',
  tags: ['risk'],
  excerpt: `Excerpt of ${slug}.`
});

const POSTS = {
  'pt-BR': [post('2026-02-01-post-a', '2026-02-01-artigo-a'), post('2026-01-01-only-pt')],
  en: [post('2026-02-01-post-a')]
};

test('robots.txt is one file for the host and names the pages of both languages', async () => {
  const body = await (await endpoint('robots.txt')({})).text();
  for (const line of [
    'Sitemap: https://merovelis.com/sitemap.xml',
    'Disallow: /pt-br/atelier',
    'Disallow: /en/atelier',
    'Disallow: /pt-br/blog/*?*',
    'Disallow: /en/blog/*?*',
    'Disallow: /pt-br/produtos/*?*',
    'Disallow: /en/products/*?*',
    'Disallow: /pt-br/servicos/*?*',
    'Disallow: /en/services/*?*',
    'Disallow: /pt-br/solucoes/*?*',
    'Disallow: /en/solutions/*?*',
    'Allow: /api/blog/cover/',
    'Disallow: /api/'
  ]) {
    assert.ok(body.split('\n').includes(line), `robots.txt lacks: ${line}`);
  }
  assert.doesNotMatch(body, /rbx\.ia\.br|rbxsystems\.ch/);
  // A page rule without a segment would match nothing.
  assert.doesNotMatch(body, /^Disallow: \/(atelier|blog|produtos|products|servicos|solucoes)/m);
});

test('the sitemap is an index of two, and each lists only addresses that are served', async () => {
  const GET = endpoint('sitemap.xml', POSTS);
  const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  const index = await (await GET({ url: new URL('/sitemap.xml', SITE_ORIGIN) })).text();
  assert.match(index, /<sitemapindex /);
  assert.deepEqual(locs(index), [
    `${SITE_ORIGIN}/pt-br/sitemap.xml`,
    `${SITE_ORIGIN}/en/sitemap.xml`
  ]);

  for (const locale of LOCALES) {
    // eslint-disable-next-line security/detect-object-injection -- locale iterates LOCALES
    const segment = SEGMENT[locale];
    const xml = await (await GET({ url: new URL(`${segment}/sitemap.xml`, SITE_ORIGIN) })).text();
    assert.match(xml, /<urlset /);
    const addresses = locs(xml);
    assert.ok(addresses.length > 25, `${locale}: ${addresses.length} addresses`);
    assert.equal(addresses[0], `${SITE_ORIGIN}${segment}`);
    assert.equal(new Set(addresses).size, addresses.length, `${locale}: repeated address`);
    for (const address of addresses) {
      assert.ok(address.startsWith(`${SITE_ORIGIN}${segment}`), address);
      assert.equal(resolveRedirect(onSite(pathOf(address))), undefined, `${address} redirects`);
      const route = routed(pathOf(address));
      assert.ok(
        staticPages.includes(route) ||
          /^\/(blog|journal\/tag|journal\/autor|services|servicos)\//.test(route),
        `${address} is not a route`
      );
    }
    assert.doesNotMatch(xml, /rbx\.ia\.br|rbxsystems\.ch/);
  }

  // A post names its address in each language it exists in.
  const pt = await (await GET({ url: new URL('/pt-br/sitemap.xml', SITE_ORIGIN) })).text();
  assert.ok(
    pt.includes(
      `<loc>${SITE_ORIGIN}/pt-br/blog/2026-02-01-artigo-a</loc>\n` +
        `    <xhtml:link rel="alternate" hreflang="pt-BR" href="${SITE_ORIGIN}/pt-br/blog/2026-02-01-artigo-a"/>\n` +
        `    <xhtml:link rel="alternate" hreflang="en" href="${SITE_ORIGIN}/en/blog/2026-02-01-post-a"/>`
    )
  );
  assert.ok(
    pt.includes(
      `<loc>${SITE_ORIGIN}/pt-br/blog/2026-01-01-only-pt</loc>\n` +
        `    <xhtml:link rel="alternate" hreflang="pt-BR" href="${SITE_ORIGIN}/pt-br/blog/2026-01-01-only-pt"/>\n` +
        '    <lastmod>'
    )
  );
});

test('each language has its feed and its llms.txt, with addresses under its segment', async () => {
  const feed = endpoint('rss.xml', POSTS);
  const pt = await (await feed({ url: new URL('/pt-br/rss.xml', SITE_ORIGIN) })).text();
  assert.ok(pt.includes(`<link>${SITE_ORIGIN}/pt-br/journal</link>`));
  assert.ok(pt.includes(`<link>${SITE_ORIGIN}/pt-br/blog/2026-02-01-artigo-a</link>`));
  assert.ok(pt.includes(`<atom:link href="${SITE_ORIGIN}/pt-br/rss.xml" rel="self"`));
  assert.ok(pt.includes('<language>pt-br</language>'));
  const en = await (await feed({ url: new URL('/en/rss.xml', SITE_ORIGIN) })).text();
  assert.ok(en.includes(`<link>${SITE_ORIGIN}/en/blog/2026-02-01-post-a</link>`));
  assert.ok(en.includes(`<atom:link href="${SITE_ORIGIN}/en/rss.xml" rel="self"`));
  assert.doesNotMatch(pt + en, /rbx\.ia\.br|rbxsystems\.ch/);

  const llms = endpoint('llms.txt');
  for (const [address, locale] of [
    ['/pt-br/llms.txt', 'pt-BR'],
    ['/en/llms.txt', 'en'],
    // Without a segment: the English index, at the address the convention expects.
    ['/llms.txt', 'en']
  ]) {
    const body = await (await llms({ url: new URL(address, SITE_ORIGIN) })).text();
    const links = [...body.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
    assert.ok(links.length > 15, `${address}: ${links.length} links`);
    const other = locale === 'pt-BR' ? 'en' : 'pt-BR';
    // eslint-disable-next-line security/detect-object-injection -- other is one of the two locales
    const otherIndex = `${SITE_ORIGIN}${SEGMENT[other]}/llms.txt`;
    assert.equal(links.filter((link) => link === otherIndex).length, 1, address);
    for (const link of links.filter((each) => each !== otherIndex)) {
      // eslint-disable-next-line security/detect-object-injection -- locale is one of the two locales
      assert.ok(link.startsWith(`${SITE_ORIGIN}${SEGMENT[locale]}/`), `${address}: ${link}`);
      assert.equal(resolveRedirect(onSite(pathOf(link))), undefined, `${address}: ${link}`);
    }
    assert.doesNotMatch(body, /rbx\.ia\.br|rbxsystems\.ch/);
  }
});

test('a link in stored content stays in the language of the page that shows it', async () => {
  const { s3, gateway } = createContentGateway();
  const body = [
    '---',
    "title: 'Post'",
    "date: '2026-03-01'",
    '---',
    '',
    'See the [journal](/journal), the [contact form](/contato#form), ',
    '[another post](/blog/2026-01-01-outro), the [products](/products?ref=post), ',
    'an [old address](https://rbx.ia.br/sobre), an [outside one](https://example.org/a), ',
    'a [file](/api/assets/team/a.jpg), an [anchor](#top) and <https://example.org/auto>.',
    '',
    // Stored pages carry HTML: the same rule applies to its links.
    '<p><a class="more" href="/trust">Trust</a> and <a href="/sobre?a=1&amp;b=2">about</a></p>',
    '',
    'A path quoted in code is text, not a link: `<a href="/journal">`.'
  ].join('\n');
  s3.objects.set('blog/posts/2026-03-01-links.pt-BR.md', body);
  s3.objects.set('blog/posts/2026-03-01-links.en.md', body);
  s3.objects.set('site/en/legal/index.md', "---\ntitle: 'Legal'\n---\n\n[Contact](/contato)");

  const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  const outside = [
    // An address on an earlier host names its language, whatever the page.
    '/pt-br/sobre',
    'https://example.org/a',
    '/api/assets/team/a.jpg',
    '#top',
    'https://example.org/auto'
  ];
  assert.deepEqual(hrefs((await gateway.loadPost('2026-03-01-links', 'pt-BR')).html), [
    '/pt-br/journal',
    '/pt-br/contato#form',
    '/pt-br/blog/2026-01-01-outro',
    '/pt-br/produtos?ref=post',
    ...outside,
    '/pt-br/trust',
    '/pt-br/sobre?a=1&amp;b=2'
  ]);
  const english = (await gateway.loadPost('2026-03-01-links', 'en')).html;
  assert.deepEqual(hrefs(english), [
    '/en/journal',
    '/en/contact#form',
    '/en/blog/2026-01-01-outro',
    '/en/products?ref=post',
    ...outside,
    '/en/trust',
    '/en/about?a=1&amp;b=2'
  ]);
  assert.ok(
    english.includes('&lt;a href=&quot;/journal&quot;&gt;'),
    'the code sample is as written'
  );
  assert.deepEqual(hrefs((await gateway.loadPage('legal', 'en')).html), ['/en/contact']);
});

test('links in stored HTML are read as HTML writes them', async () => {
  const { s3, gateway } = createContentGateway();
  // Stored pages carry HTML written by hand: any quoting, any case.
  const body = [
    "<p><a href='/journal'>single quotes</a></p>",
    '<p><a href=/sobre>no quotes</a></p>',
    '<p><A HREF="/journal">upper case</A></p>',
    '<p><a class="more" title="a > b" target="_blank" href="/parceria#qualificacao">after a quoted &gt;</a></p>',
    '<p><a\n  href = "/contato"\n  class="x">spaces and lines</a></p>',
    '<p><a href="/sobre" href="/second">only the first counts</a></p>',
    '<p><a name="top">no href</a> <a href>empty</a> <a href="">blank</a></p>',
    '<p><area href="/journal"> <abbr title="x">not an anchor</abbr></p>',
    '<pre><code>&lt;a href="/journal"&gt;a sample&lt;/a&gt;</code></pre>',
    // The value is read as HTML reads it: its character references decoded.
    "<p><a href='&#47;journal'>a numeric reference</a></p>",
    '<p><a href="&sol;sobre&quest;x&equals;1">named references</a></p>',
    '<p><a href="/sobre?a=1&b=2&amp;c=3">ampersands, bare and escaped</a></p>',
    '<p><a href="/sobre?a&copy=1">not a reference in an attribute</a></p>',
    '<p><a href=/sobre?x=1&y=2>a query without quotes</a></p>',
    '<p><a b"c href="/sobre">a name with a quote</a></p>',
    // And as the URL parser reads it: nothing around it, no tab inside.
    '<p><a href=" /sobre ">spaces around</a> <a href="/so\tbre">a tab inside</a></p>',
    // What is written back ends where the author's quotes end.
    "<p><a href='/journal/tag/owner%27s'>a quote in the path</a></p>",
    '<p><a href="/sobre?q=&quot;x&quot;">a quote in the query</a></p>',
    // Left as the author wrote it, byte for byte: already the address, or
    // not an address this site reads as a path of its own.
    "<p><a href='/en/about?a=1&b=2'>already there</a></p>",
    '<p><a href="/\\example.org/sobre">a backslash</a> <a href="\\sobre">another</a></p>',
    '<p><a href="//example.org/sobre">another host</a> <a href="sobre">relative</a></p>'
  ].join('\n\n');
  s3.objects.set('site/en/legal/index.md', `---\ntitle: 'Legal'\n---\n\n${body}`);
  const { html } = await gateway.loadPage('legal', 'en');
  for (const expected of [
    "<a href='/en/journal'>single quotes</a>",
    // A value without quotes is written back in double quotes.
    '<a href="/en/about">no quotes</a>',
    '<A HREF="/en/journal">upper case</A>',
    'title="a > b" target="_blank" href="/en/partnership#qualificacao">',
    'href = "/en/contact"',
    '<a href="/en/about" href="/second">',
    '<a name="top">no href</a> <a href>empty</a> <a href="">blank</a>',
    '<area href="/journal">',
    '&lt;a href="/journal"&gt;a sample&lt;/a&gt;',
    "<a href='/en/journal'>a numeric reference</a>",
    '<a href="/en/about?x=1">named references</a>',
    '<a href="/en/about?a=1&amp;b=2&amp;c=3">ampersands, bare and escaped</a>',
    '<a href="/en/about?a&amp;copy=1">not a reference in an attribute</a>',
    '<a href="/en/about?x=1&amp;y=2">a query without quotes</a>',
    '<a b"c href="/en/about">a name with a quote</a>',
    '<a href="/en/about">spaces around</a> <a href="/en/about">a tab inside</a>',
    "<a href='/en/journal/tag/owner&#39;s'>a quote in the path</a>",
    '<a href="/en/about?q=&#34;x&#34;">a quote in the query</a>',
    "<a href='/en/about?a=1&b=2'>already there</a>",
    '<a href="/\\example.org/sobre">a backslash</a> <a href="\\sobre">another</a>',
    '<a href="//example.org/sobre">another host</a> <a href="sobre">relative</a>'
  ]) {
    assert.ok(html.includes(expected), `${expected}\n in\n${html}`);
  }
});

test('whatever an address holds, stored HTML reads back the address it was rewritten to', async () => {
  const { decodeHTMLAttribute } = await import('entities');
  // An author writes a value three ways and escapes only what each needs.
  const write = {
    double: (address) => `"${address.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`,
    single: (address) => `'${address.replaceAll('&', '&amp;').replaceAll("'", '&apos;')}'`,
    bare: (address) => address.replace(/[&"'<>=`\s]/g, (c) => `&#x${c.charCodeAt(0).toString(16)};`)
  };
  const quotings = Object.keys(write);
  const paths = [
    '/sobre',
    '/journal',
    '/contato',
    '/journal/tag/owner%27s',
    '/blog/a%22b',
    '/en/about',
    '/api/chat',
    'https://rbx.ia.br/sobre',
    'https://example.org/x'
  ];
  const pieces = [
    'a',
    '1',
    '&',
    '&&',
    "'",
    '"',
    '<',
    '>',
    '=',
    '`',
    ' ',
    ';',
    '#',
    '?',
    '&amp',
    '&copy',
    '&#39;',
    '%27',
    '%22',
    'é'
  ];

  for (const seed of [11, 12, 13]) {
    const random = seededRandom(seed);
    const cases = [];
    for (let i = 0; i < 400; i += 1) {
      let tail = random.chance(0.5) ? '?' : '#';
      const length = random.int(8);
      for (let j = 0; j < length; j += 1) tail += random.pick(pieces);
      // A space that ends the value is not part of the address a browser reads.
      const address = `${random.pick(paths)}${random.chance(0.2) ? '' : tail}`.trimEnd();
      const quoting = random.pick(quotings);
      // eslint-disable-next-line security/detect-object-injection -- quoting is a key of write
      cases.push({ address, quoting, written: write[quoting](address) });
    }

    const { s3, gateway } = createContentGateway();
    const body = cases
      .map(({ written }, i) => `<p><a id=n${i} href=${written}>x</a></p>`)
      .join('\n\n');
    s3.objects.set('site/en/legal/index.md', `---\ntitle: 'Legal'\n---\n\n${body}`);
    const { html } = await gateway.loadPage('legal', 'en');

    // Read back as HTML reads a value: one in quotes ends at its next quote.
    const read = new Map();
    for (const anchor of html.matchAll(
      /<a id=n(\d+) href=(?:"([^"]*)"|'([^']*)'|([^\s"'>][^\s>]*))>x<\/a>/g
    )) {
      read.set(Number(anchor[1]), anchor);
    }
    cases.forEach(({ address, quoting, written }, i) => {
      const label = `seed ${seed}, #${i}: ${quoting} ${address}`;
      const anchor = read.get(i);
      assert.ok(anchor, `${label}: the tag does not end where its value ends`);
      const expected = alternates.siteHref('en', address);
      if (expected === address) {
        // Not rewritten: the bytes the author wrote.
        assert.ok(anchor[0].includes(` href=${written}>`), `${label}: ${anchor[0]}`);
      } else {
        assert.equal(anchor[4], undefined, `${label}: written back without quotes`);
        assert.equal(decodeHTMLAttribute(anchor[2] ?? anchor[3]), expected, label);
      }
    });
  }
});

test('reading the post lists for links costs one attempt per language, whatever the links', async () => {
  // One object of the Portuguese list cannot be read, so that list is not
  // cached. A page that links to posts reads the lists once for all its
  // links, not once per link.
  const requestsFor = async (links) => {
    const { s3, gateway } = createContentGateway();
    publishJournal(s3, 12);
    const body = links.map((slug) => `[post](/blog/${slug})`).join(' ');
    s3.objects.set('site/en/newsroom/index.md', `---\ntitle: 'Newsroom'\n---\n\n${body}`);
    s3.failWith(
      Object.assign(new Error('unreachable'), { name: 'TimeoutError' }),
      (request) => request.key === `blog/posts/${journalSlug(7)}.pt-BR.md`
    );
    const page = await gateway.loadPage('newsroom', 'en');
    assert.equal([...page.html.matchAll(/href="\/en\/blog\//g)].length, links.length);
    return s3.takeRequests().length;
  };
  const one = await requestsFor([journalSlug(1)]);
  const many = await requestsFor([1, 2, 3, 4, 5, 6].map((index) => journalSlug(index)));
  assert.equal(many, one, 'the number of links does not change the number of storage requests');
  // The page itself, one listing per language, and the posts each listing
  // reads until the Portuguese one fails.
  assert.ok(one <= 1 + 2 * (1 + 13), `${one} storage requests`);

  // A page without a link to a post reads no list at all.
  const { s3, gateway } = createContentGateway();
  publishJournal(s3, 12);
  s3.objects.set('site/en/newsroom/index.md', "---\ntitle: 'Newsroom'\n---\n\n[contact](/contato)");
  await gateway.loadPage('newsroom', 'en');
  assert.deepEqual(
    s3.takeRequests().map((request) => request.command),
    ['GetObject']
  );
});

test('a link to a post in stored content names the slug the post has in that language', async () => {
  const { s3, gateway } = createContentGateway();
  const text = (title, body, alias) =>
    [
      '---',
      `title: '${title}'`,
      "date: '2026-08-05'",
      ...(alias ? [`slugAlias: '${alias}'`] : []),
      '---',
      '',
      body
    ].join('\n');
  // The linked post: its English version has its own slug.
  s3.objects.set(
    'blog/posts/2026-08-05-o-primeiro-palmo.pt-BR.md',
    text('O primeiro palmo', 'Corpo.')
  );
  s3.objects.set(
    'blog/posts/2026-08-05-o-primeiro-palmo.en.md',
    text('The first span', 'Body.', '2026-08-05-the-first-span')
  );
  // The linking post, written once with the storage slug, the slug of the
  // other language, a query and a fragment, and a post that does not exist.
  const body = [
    '[one](/blog/2026-08-05-o-primeiro-palmo), [two](/blog/2026-08-05-the-first-span#part), ',
    '[three](/blog/2026-08-05-o-primeiro-palmo?ref=a#part), [four](/blog/2020-01-01-nao-existe) ',
    'and <a href="/blog/2026-08-05-o-primeiro-palmo">five</a>.'
  ].join('');
  s3.objects.set('blog/posts/2026-09-01-linking.pt-BR.md', text('Linking', body));
  s3.objects.set('blog/posts/2026-09-01-linking.en.md', text('Linking', body));
  s3.objects.set('site/en/newsroom/index.md', `---\ntitle: 'Newsroom'\n---\n\n${body}`);

  const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  const english = [
    '/en/blog/2026-08-05-the-first-span',
    '/en/blog/2026-08-05-the-first-span#part',
    '/en/blog/2026-08-05-the-first-span?ref=a#part',
    '/en/blog/2020-01-01-nao-existe',
    '/en/blog/2026-08-05-the-first-span'
  ];
  assert.deepEqual(hrefs((await gateway.loadPost('2026-09-01-linking', 'en')).html), english);
  assert.deepEqual(hrefs((await gateway.loadPage('newsroom', 'en')).html), english);
  assert.deepEqual(hrefs((await gateway.loadPost('2026-09-01-linking', 'pt-BR')).html), [
    '/pt-br/blog/2026-08-05-o-primeiro-palmo',
    '/pt-br/blog/2026-08-05-o-primeiro-palmo#part',
    '/pt-br/blog/2026-08-05-o-primeiro-palmo?ref=a#part',
    '/pt-br/blog/2020-01-01-nao-existe',
    '/pt-br/blog/2026-08-05-o-primeiro-palmo'
  ]);
  // A listing renders no body.
  const listed = await gateway.loadAllPosts('en');
  assert.ok(listed.length === 2 && listed.every((post) => !('html' in post)));
});

test('a post names x-default only when it has an English version', () => {
  const both = alternates.postAlternateLinks([
    { locale: 'pt-BR', publicSlug: '2026-08-05-o-primeiro-palmo' },
    { locale: 'en', publicSlug: '2026-08-05-the-first-span' }
  ]);
  assert.deepEqual(both, [
    { hreflang: 'pt-BR', href: `${SITE_ORIGIN}/pt-br/blog/2026-08-05-o-primeiro-palmo` },
    { hreflang: 'en', href: `${SITE_ORIGIN}/en/blog/2026-08-05-the-first-span` },
    { hreflang: 'x-default', href: `${SITE_ORIGIN}/en/blog/2026-08-05-the-first-span` }
  ]);
  // Only in Portuguese: no x-default, which would name Portuguese the default.
  assert.deepEqual(
    alternates.postAlternateLinks([{ locale: 'pt-BR', publicSlug: '2026-10-13-so-em-portugues' }]),
    [{ hreflang: 'pt-BR', href: `${SITE_ORIGIN}/pt-br/blog/2026-10-13-so-em-portugues` }]
  );
  assert.equal(alternates.postAlternateLinks([]), undefined);
  assert.equal(alternates.postAlternateLinks(undefined), undefined);
  // The page of a post builds its links with this function and nothing else.
  const page = readFileSync(path.join(root, 'src/routes/blog/[slug]/+page.svelte'), 'utf8');
  assert.match(page, /const alternate = \$derived\(postAlternateLinks\(data\.alternates\)\);/);
  assert.doesNotMatch(page, /x-default/);
});

test('an earlier address of a post reaches the post, with its query, through the real loader', async () => {
  // A post whose English version has its own public slug, and one that
  // exists only in Portuguese.
  const { s3, gateway, budget } = createContentGateway();
  const text = (title, alias) =>
    [
      '---',
      `title: '${title}'`,
      "date: '2026-08-05'",
      ...(alias ? [`slugAlias: '${alias}'`] : []),
      '---',
      '',
      'Body.'
    ].join('\n');
  s3.objects.set('blog/posts/2026-08-05-o-primeiro-palmo.pt-BR.md', text('O primeiro palmo'));
  s3.objects.set(
    'blog/posts/2026-08-05-o-primeiro-palmo.en.md',
    text('The first span', '2026-08-05-the-first-span')
  );
  s3.objects.set('blog/posts/2026-10-13-so-em-portugues.pt-BR.md', text('Só em português'));

  const handle = loadHandleHook({ gateway, budget });
  const kit = await import('@sveltejs/kit');
  const load = loadTypeScriptGraph(source('routes/blog/[slug]/+page.server.ts'), {
    '@sveltejs/kit': kit,
    '$lib/server/content/gateway': gateway
  }).load;

  /** Follow a request to the page it ends at: the hook, then the loader of the post. */
  async function follow(address) {
    const hops = [];
    let url = new URL(address);
    for (;;) {
      assert.ok(hops.length < 5, `${address}: too many hops: ${hops.join(' ')}`);
      let location;
      const response = await handle({
        event: hookEvent(url.href, { routeId: '/blog/[slug]' }),
        resolve: async () => {
          try {
            const data = await load({
              params: { slug: decodeURIComponent(routed(url.pathname).split('/')[2]) },
              url
            });
            return new Response(JSON.stringify(data), { headers: { 'content-type': 'text/html' } });
          } catch (thrown) {
            if (!kit.isRedirect(thrown)) throw thrown;
            return new Response(null, {
              status: thrown.status,
              headers: { location: thrown.location }
            });
          }
        }
      });
      if (response.status >= 300 && response.status < 400) {
        location = response.headers.get('location');
        // Bounded when permanent, by the hook or by the loader; not stored
        // when negotiated.
        assert.equal(
          response.headers.get('cache-control'),
          response.status === 301 ? 'public, max-age=3600' : 'private, no-store',
          `${url.href}: a ${response.status} without its cache rule`
        );
        hops.push(`${response.status} ${location}`);
        url = new URL(location, url);
        continue;
      }
      return { hops, url: url.href, data: JSON.parse(await response.text()) };
    }
  }

  // Before anything has read the post lists, a redirect cannot know the slug
  // a post has in a language: it goes out as asked and the loader of the post
  // adds its hop. That happens once: the loader reads the lists.
  let end = await follow('https://rbxsystems.ch/blog/2026-08-05-o-primeiro-palmo?utm_source=x');
  assert.deepEqual(end.hops, [
    `301 ${SITE_ORIGIN}/en/blog/2026-08-05-o-primeiro-palmo?utm_source=x`,
    '301 /en/blog/2026-08-05-the-first-span?utm_source=x'
  ]);
  assert.equal(end.data.post.title, 'The first span');

  // From here on the lists are in memory.
  // The address the earlier host served the post at: one hop.
  end = await follow('https://rbxsystems.ch/blog/2026-08-05-the-first-span?utm_source=x');
  assert.deepEqual(end.hops, [`301 ${SITE_ORIGIN}/en/blog/2026-08-05-the-first-span?utm_source=x`]);
  assert.equal(end.data.post.title, 'The first span');

  end = await follow('https://rbx.ia.br/blog/2026-08-05-o-primeiro-palmo?utm_source=x');
  assert.deepEqual(end.hops, [
    `301 ${SITE_ORIGIN}/pt-br/blog/2026-08-05-o-primeiro-palmo?utm_source=x`
  ]);
  assert.equal(end.data.post.title, 'O primeiro palmo');

  // The address an early sitemap advertised, with a trailing slash: still one hop.
  end = await follow('https://rbx.ia.br/journal/2026-08-05-o-primeiro-palmo/?utm_source=x');
  assert.deepEqual(end.hops, [
    `301 ${SITE_ORIGIN}/pt-br/blog/2026-08-05-o-primeiro-palmo?utm_source=x`
  ]);

  // A slug that is not the public slug of the post in the language of the
  // host: the storage slug, or the slug of the other language. The hook
  // completes its redirect from the post lists in memory: one hop too.
  end = await follow('https://rbxsystems.ch/blog/2026-08-05-o-primeiro-palmo?utm_source=x');
  assert.deepEqual(end.hops, [`301 ${SITE_ORIGIN}/en/blog/2026-08-05-the-first-span?utm_source=x`]);
  assert.equal(end.data.post.title, 'The first span');
  end = await follow('https://rbx.ia.br/journal/2026-08-05-the-first-span/?utm_source=x');
  assert.deepEqual(end.hops, [
    `301 ${SITE_ORIGIN}/pt-br/blog/2026-08-05-o-primeiro-palmo?utm_source=x`
  ]);
  assert.equal(end.data.post.title, 'O primeiro palmo');
  // Without a segment on the site host: negotiated, and still one hop.
  end = await follow(`${SITE_ORIGIN}/blog/2026-08-05-o-primeiro-palmo`);
  assert.deepEqual(end.hops, ['302 /en/blog/2026-08-05-the-first-span']);
  assert.deepEqual(end.data.alternates, [
    { locale: 'pt-BR', publicSlug: '2026-08-05-o-primeiro-palmo' },
    { locale: 'en', publicSlug: '2026-08-05-the-first-span' }
  ]);

  // On the site host the same request is the loader's one hop.
  end = await follow(`${SITE_ORIGIN}/en/blog/2026-08-05-o-primeiro-palmo?utm_source=x`);
  assert.deepEqual(end.hops, ['301 /en/blog/2026-08-05-the-first-span?utm_source=x']);

  // A post with one language names only that one.
  end = await follow(`${SITE_ORIGIN}/pt-br/blog/2026-10-13-so-em-portugues`);
  assert.deepEqual(end.hops, []);
  assert.deepEqual(end.data.alternates, [
    { locale: 'pt-BR', publicSlug: '2026-10-13-so-em-portugues' }
  ]);
});

test('a redirect to a post never reads storage, never waits and leaves nothing pending', async () => {
  const address = 'https://rbxsystems.ch/blog/2026-08-05-o-primeiro-palmo?utm_source=x';
  const asAsked = `${SITE_ORIGIN}/en/blog/2026-08-05-o-primeiro-palmo?utm_source=x`;
  const completed = `${SITE_ORIGIN}/en/blog/2026-08-05-the-first-span?utm_source=x`;
  const publish = (s3) => {
    const text = (title, alias) =>
      [
        '---',
        `title: '${title}'`,
        "date: '2026-08-05'",
        ...(alias ? [`slugAlias: '${alias}'`] : []),
        '---',
        '',
        'Body.'
      ].join('\n');
    s3.objects.set('blog/posts/2026-08-05-o-primeiro-palmo.pt-BR.md', text('O primeiro palmo'));
    s3.objects.set(
      'blog/posts/2026-08-05-o-primeiro-palmo.en.md',
      text('The first span', '2026-08-05-the-first-span')
    );
  };
  const redirect = async (handle) => {
    const response = await handle({
      event: hookEvent(address),
      resolve: async () => assert.fail('a redirect renders nothing')
    });
    assert.equal(response.status, 301);
    return response.headers.get('location');
  };

  // The lists are not in memory: the redirect goes out as the pure function
  // decided it, and asks storage nothing. The loader of the post completes it.
  const cold = createContentGateway();
  publish(cold.s3);
  assert.equal(await redirect(loadHandleHook(cold)), asAsked);
  assert.deepEqual(cold.s3.takeRequests(), []);

  // Storage that stays silent, and storage that rejects: the same answer, at
  // once, for any number of redirects, and still not one request. Nothing is
  // started that could be left waiting.
  for (const fail of [(s3) => s3.hold(), (s3) => s3.failWith(new Error('unreachable'))]) {
    const down = createContentGateway();
    publish(down.s3);
    fail(down.s3);
    const handle = loadHandleHook(down);
    const started = Date.now();
    for (let i = 0; i < 3000; i += 1) assert.equal(await redirect(handle), asAsked);
    assert.ok(Date.now() - started < 5000, 'three thousand redirects did not wait on storage');
    assert.deepEqual(down.s3.takeRequests(), []);
  }

  // Once the lists are in memory the redirect is completed from them, and
  // goes on being completed when storage stops answering afterwards.
  const warm = createContentGateway();
  publish(warm.s3);
  await warm.gateway.resolvePostSlug('2026-08-05-o-primeiro-palmo', 'en');
  warm.s3.takeRequests();
  const handle = loadHandleHook(warm);
  assert.equal(await redirect(handle), completed);
  warm.s3.hold();
  for (let i = 0; i < 100; i += 1) assert.equal(await redirect(handle), completed);
  assert.deepEqual(warm.s3.takeRequests(), []);

  // One list in memory is not enough to know a post: no guess is made.
  const half = createContentGateway();
  publish(half.s3);
  await half.gateway.loadAllPosts('en');
  half.s3.takeRequests();
  assert.equal(await redirect(loadHandleHook(half)), asAsked);
  assert.deepEqual(half.s3.takeRequests(), []);
});

test('a post list that cannot be read is reported, once and not per request', async (t) => {
  const warnings = t.mock.method(console, 'warn', () => {});
  const absorbed = () =>
    warnings.mock.calls
      .map((call) => call.arguments)
      .filter(([message]) => message === '[content-gateway] post list unavailable, read as empty')
      .map(([, detail]) => JSON.parse(detail));

  // The listing itself is refused: both lists are read as empty, and each says so.
  const { s3, gateway } = createContentGateway();
  publishJournal(s3, 3);
  s3.failWith(Object.assign(new Error('connect ECONNREFUSED'), { name: 'NetworkError' }));
  assert.equal(await gateway.resolvePostSlug(journalSlug(1), 'en'), null);
  assert.deepEqual(
    absorbed().map(({ detail, failures, total }) => [detail, failures, total]),
    [
      ['pt-BR', 1, 1],
      ['en', 1, 1]
    ]
  );
  assert.match(absorbed()[0].error, /503|unavailable/);
  // The same failure again, at once: counted, not written again.
  for (let i = 0; i < 20; i += 1) await gateway.resolvePostSlug(journalSlug(1), 'en');
  assert.equal(absorbed().length, 2);

  // One object of one list cannot be read: that list is read as empty and
  // reported; the other answers.
  const partial = createContentGateway();
  publishJournal(partial.s3, 3);
  partial.s3.failWith(
    new Error('unreachable'),
    (request) => request.key === `blog/posts/${journalSlug(2)}.pt-BR.md`
  );
  const before = absorbed().length;
  const resolved = await partial.gateway.resolvePostSlug(journalSlug(1), 'en');
  assert.deepEqual(resolved.alternates, [{ locale: 'en', publicSlug: journalSlug(1) }]);
  assert.deepEqual(
    absorbed()
      .slice(before)
      .map(({ detail }) => detail),
    ['pt-BR']
  );
});

test('every tag of the published posts exists in both languages', async () => {
  // A tag page is the same address in both languages, so the language switch
  // of a tag page lands on a page only if posts of the other language carry
  // the tag too. Tags are written per language; `TAG_ALIASES` is what makes
  // "entrada" and "entry" one tag. A tag left out of it has a page in one
  // language and a missing page in the other.
  const { canonicalTag } = loadTypeScriptGraph(source('lib/journal/tags.ts'));
  const yaml = await import('js-yaml');
  const tags = { 'pt-BR': new Set(), en: new Set() };
  const posts = readdirSync(path.join(root, 'blog-posts')).filter((name) => name.endsWith('.md'));
  assert.ok(posts.length > 50, 'the published posts were read');
  for (const name of posts) {
    const locale = name.endsWith('.pt-BR.md') ? 'pt-BR' : name.endsWith('.en.md') ? 'en' : null;
    assert.ok(locale, `${name} names no language`);
    const frontmatter = readFileSync(path.join(root, 'blog-posts', name), 'utf8').split(
      /^---\r?\n/m
    )[1];
    // eslint-disable-next-line security/detect-object-injection -- locale is 'pt-BR' or 'en'
    for (const tag of yaml.load(frontmatter).tags ?? []) tags[locale].add(canonicalTag(tag));
  }
  const missing = (from, to) => [...from].filter((tag) => !to.has(tag)).sort();
  assert.deepEqual(missing(tags['pt-BR'], tags.en), [], 'tags only in Portuguese posts');
  assert.deepEqual(missing(tags.en, tags['pt-BR']), [], 'tags only in English posts');
});

/** Every file under src/ with one of the given extensions. */
function sourceFiles(extensions, dir = path.join(root, 'src')) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(extensions, full));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) files.push(full);
  }
  return files;
}

test('no origin is trusted to submit a form to the site', () => {
  // The framework refuses a form from another origin before the hook, so such
  // a request is never redirected. The ADR states that policy; a change here
  // is a change of it.
  const config = readFileSync(path.join(root, 'svelte.config.js'), 'utf8');
  assert.match(config, /csrf:\s*\{\s*trustedOrigins:\s*\[\]\s*\}/);
  assert.doesNotMatch(config, /checkOrigin/);
  // And nothing in the site takes a form: no action, no endpoint that reads one.
  const takesForm = /export const actions\b|\.formData\(\)/;
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
    );
  const offenders = walk(path.join(root, 'src'))
    .filter((file) => /\.(ts|js|svelte)$/.test(file))
    .filter((file) => takesForm.test(readFileSync(file, 'utf8')))
    .map((file) => path.relative(root, file));
  assert.deepEqual(offenders, []);
});

test('the two earlier hosts are named only where they are meant', () => {
  const naming = sourceFiles(['.ts', '.js', '.svelte', '.html', '.json', '.css'])
    .filter((file) => /rbx\.ia\.br|rbxsystems\.ch/.test(readFileSync(file, 'utf8')))
    .map((file) => path.relative(root, file))
    .sort();
  assert.deepEqual(naming, [
    // Documentation of the Plausible settings and of its host.
    'src/lib/analytics/index.ts',
    // The two public names of each service, one per language.
    'src/lib/api/commerce.ts',
    'src/lib/api/comms.ts',
    // The contact address shown in the form: its own decision.
    'src/lib/design/components/PartnershipForm.svelte',
    // The table of the earlier hosts and the comments that explain it.
    'src/lib/seo/redirects.ts',
    'src/lib/seo/site.ts'
  ]);
});

test('no component writes an internal link by hand', () => {
  // A link to a page goes through siteHref or localizedHref, which give it
  // the locale segment. A literal path would leave the language and take a
  // redirect to come back.
  const helper = /\b(siteHref|localizedHref|localeSwitchHref|href)\(/;
  const offenders = [];
  for (const file of sourceFiles(['.svelte'])) {
    const text = readFileSync(file, 'utf8');
    const name = path.relative(root, file);
    // href="/path" and href="/path/{slug}"
    for (const match of text.matchAll(/href="(\/[^"]*)"/g)) {
      const target = match[1].split(/[?#{]/)[0];
      if (!isHostWidePath(target)) offenders.push(`${name}: ${match[0]}`);
    }
    // href={...} with a path literal in it and no helper around it
    for (const match of text.matchAll(/href=\{([^}]*)\}/g)) {
      const literal = match[1].match(/['"`](\/[^'"`]*)['"`]/);
      if (!literal || helper.test(match[1])) continue;
      if (!isHostWidePath(literal[1].split(/[?#$]/)[0])) offenders.push(`${name}: ${match[0]}`);
    }
  }
  assert.deepEqual(offenders, []);
});
