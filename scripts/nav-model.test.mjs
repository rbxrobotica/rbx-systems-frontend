import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTypeScriptGraph } from './test-support/load-typescript-graph.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (rel) => new URL(`../src/${rel}`, import.meta.url);

// nav.ts and what it imports through the `$lib` alias are loaded as real
// modules. They hold no state, so each graph is as good as another.
const alternates = loadTypeScriptGraph(source('lib/seo/alternates.ts'));
const nav = loadTypeScriptGraph(source('lib/design/nav.ts'));
const { LOCALE_PREFIX, stripLocalePrefix } = loadTypeScriptGraph(source('lib/i18n/locale.ts'));

const LOCALES = ['pt-BR', 'en'];

/** Every route that renders a page through the layout (has a +page.svelte). */
function pageRoutes(dir = path.join(root, 'src/routes'), prefix = '') {
  const routes = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const route = `${prefix}/${entry.name}`;
    const child = path.join(dir, entry.name);
    if (existsSync(path.join(child, '+page.svelte'))) routes.push(route);
    routes.push(...pageRoutes(child, route));
  }
  return routes;
}

const routes = pageRoutes();
const staticRoutes = routes.filter((route) => !route.includes('['));

test('the home page has no breadcrumb and no section', () => {
  for (const locale of LOCALES) {
    assert.deepEqual(nav.resolveNav(locale, '/'), { trail: [] });
  }
});

// Either spelling of a route resolves in either language (the server sends a
// request to the spelling of its language before it renders), so every static
// page is checked under both locales, not only under the one that owns its
// spelling.
for (const locale of LOCALES) {
  test(`${locale}: every static page has a trail that ends in the current page`, () => {
    assert.ok(staticRoutes.length > 30, 'route discovery found too few pages');
    for (const route of staticRoutes) {
      const { trail } = nav.resolveNav(locale, route, 'Page title');
      assert.ok(trail.length > 0, `${route} has no breadcrumb`);
      assert.equal(trail.at(-1).href, undefined, `${route} does not end in the current page`);
      for (const crumb of trail.slice(0, -1)) {
        assert.ok(crumb.href, `${route}: ancestor "${crumb.label}" is not linked`);
        // eslint-disable-next-line security/detect-object-injection -- locale iterates LOCALES
        assert.ok(crumb.href.startsWith(LOCALE_PREFIX[locale]), `${route}: ${crumb.href}`);
        assert.ok(
          staticRoutes.includes(stripLocalePrefix(crumb.href)),
          `${route}: ${crumb.href} is not a route`
        );
      }
    }
  });
}

test('every navigation href is a real route under the segment and in the spelling of its language', () => {
  for (const locale of LOCALES) {
    const items = [
      ...nav.NAV_SECTIONS,
      ...nav.NAV_SECTIONS.flatMap((section) => section.children),
      ...nav.STANDALONE_PAGES
    ];
    for (const item of [...items, ...items.flatMap((entry) => entry.pages ?? [])]) {
      const href = alternates.localizedHref(locale, item.path);
      // eslint-disable-next-line security/detect-object-injection -- locale iterates LOCALES
      assert.ok(href.startsWith(`${LOCALE_PREFIX[locale]}/`), `${locale}: ${href}`);
      assert.ok(
        staticRoutes.includes(stripLocalePrefix(href)),
        `${locale}: ${href} is not a route`
      );
    }
  }
  assert.equal(alternates.localizedHref('en', '/sobre'), '/en/about');
  assert.equal(alternates.localizedHref('pt-BR', '/about'), '/pt-br/sobre');
  assert.equal(alternates.localizedHref('en', '/'), '/en');
});

test('a route requested in the spelling of the other language resolves the same way', () => {
  const ptOnEn = nav.resolveNav('en', '/carreiras');
  assert.equal(ptOnEn.section.key, 'company');
  assert.deepEqual(ptOnEn.trail, [{ label: 'Company', href: '/en/about' }, { label: 'Careers' }]);

  const enOnPt = nav.resolveNav('pt-BR', '/careers');
  assert.equal(enOnPt.section.key, 'company');
  assert.deepEqual(enOnPt.trail, [
    { label: 'Empresa', href: '/pt-br/sobre' },
    { label: 'Carreiras' }
  ]);

  assert.deepEqual(nav.resolveNav('en', '/sobre').trail, [{ label: 'Company' }]);
  assert.deepEqual(nav.resolveNav('pt-BR', '/about').trail, [{ label: 'Empresa' }]);
});

test('a path resolves the same with and without its locale segment', () => {
  // The address a page is served at carries the segment; the model does not.
  for (const [locale, address, bare] of [
    ['en', '/en/careers', '/careers'],
    ['pt-BR', '/pt-br/carreiras', '/carreiras'],
    ['en', '/en/blog/a-post/', '/blog/a-post'],
    ['pt-BR', '/pt-br', '/']
  ]) {
    assert.deepEqual(
      nav.resolveNav(locale, address, 'Title'),
      nav.resolveNav(locale, bare, 'Title'),
      address
    );
    assert.deepEqual(
      nav.breadcrumbItems(locale, address, 'Title'),
      nav.breadcrumbItems(locale, bare, 'Title'),
      address
    );
  }
});

test('pages known only by their parent are named from the page title', () => {
  const post = nav.resolveNav('pt-BR', '/blog/um-post', 'Um post');
  assert.equal(post.section.key, 'journal');
  assert.equal(post.item, undefined);
  assert.deepEqual(post.trail, [
    { label: 'Journal', href: '/pt-br/journal' },
    { label: 'Um post' }
  ]);

  assert.deepEqual(nav.resolveNav('pt-BR', '/journal/tag/risk', 'risk').trail, [
    { label: 'Journal', href: '/pt-br/journal' },
    { label: 'risk' }
  ]);
  assert.deepEqual(nav.resolveNav('en', '/services/llmops', 'LLMOps').trail, [
    { label: 'Solutions', href: '/en/solutions' },
    { label: 'LLMOps' }
  ]);
  for (const spelling of ['/products/strategos', '/produtos/strategos']) {
    assert.deepEqual(nav.resolveNav('en', spelling, 'Strategos').trail, [
      { label: 'Products', href: '/en/products' },
      { label: 'Strategos' }
    ]);
  }

  const landing = nav.resolveNav('pt-BR', '/robson', 'Robson, o motor');
  assert.equal(landing.item.path, '/produtos/robson');
  assert.deepEqual(landing.trail, [
    { label: 'Produtos', href: '/pt-br/produtos' },
    { label: 'Robson', href: '/pt-br/produtos/robson' },
    { label: 'Robson, o motor' }
  ]);
});

test('without a page title the trail stops at the linked parent', () => {
  assert.deepEqual(nav.resolveNav('pt-BR', '/blog/um-post').trail, [
    { label: 'Journal', href: '/pt-br/journal' }
  ]);
});

test('person pages and the Strategos form are known pages under their parent', () => {
  const person = nav.resolveNav('pt-BR', '/leandro-damasio', 'ignored CMS title');
  assert.equal(person.item.path, '/equipe');
  assert.deepEqual(person.trail, [
    { label: 'Empresa', href: '/pt-br/sobre' },
    { label: 'Equipe', href: '/pt-br/equipe' },
    { label: 'Leandro Damasio' }
  ]);
  assert.deepEqual(nav.resolveNav('en', '/contact/strategos').trail, [
    { label: 'Contact', href: '/en/contact' },
    { label: 'Strategos Founder Plan' }
  ]);
});

test('leafTitle reads the title the loaders expose, in a fixed order', () => {
  assert.equal(nav.leafTitle({ post: { title: 'Post' }, page: { title: 'Page' } }), 'Post');
  assert.equal(nav.leafTitle({ author: { name: 'Autor' }, posts: [] }), 'Autor');
  assert.equal(nav.leafTitle({ tag: 'risk', posts: [] }), 'risk');
  assert.equal(nav.leafTitle({ page: { title: 'Page' }, slug: 'slug' }), 'Page');
  assert.equal(nav.leafTitle({ page: null, slug: 'slug' }), 'slug');
  assert.equal(nav.leafTitle({ page: { title: '  ' } }), undefined);
  assert.equal(nav.leafTitle(undefined), undefined);
});

test('leafTitle drops the site name that CMS titles carry', () => {
  // Titles as stored for service and product pages in both languages.
  assert.equal(nav.leafTitle({ page: { title: 'LLMOps — RBX Systems' } }), 'LLMOps');
  assert.equal(
    nav.leafTitle({ page: { title: 'API Integration · RBX Systems' } }),
    'API Integration'
  );
  assert.equal(nav.leafTitle({ page: { title: 'RBX Maestro — RBX Systems' } }), 'RBX Maestro');
  assert.equal(
    nav.leafTitle({ page: { title: ' DevOps & Cloud — RBX Systems ' } }),
    'DevOps & Cloud'
  );
  // The site name inside a title is part of it.
  assert.equal(
    nav.leafTitle({ page: { title: 'Carreiras na RBX Systems' } }),
    'Carreiras na RBX Systems'
  );
  assert.equal(nav.leafTitle({ page: { title: 'RBX Systems History' } }), 'RBX Systems History');
  assert.deepEqual(
    nav.breadcrumbItems(
      'en',
      '/services/llmops',
      nav.leafTitle({ page: { title: 'LLMOps — RBX Systems' } })
    ),
    [
      { name: 'Home', path: '/en' },
      { name: 'Solutions', path: '/en/solutions' },
      { name: 'LLMOps', path: '/en/services/llmops' }
    ]
  );
});

test('breadcrumbItems is the visible trail with Home first and the page path last', () => {
  assert.deepEqual(nav.breadcrumbItems('pt-BR', '/carreiras', 'ignored CMS title'), [
    { name: 'Início', path: '/pt-br' },
    { name: 'Empresa', path: '/pt-br/sobre' },
    { name: 'Carreiras', path: '/pt-br/carreiras' }
  ]);
  assert.deepEqual(nav.breadcrumbItems('en', '/blog/a-post/', 'A post'), [
    { name: 'Home', path: '/en' },
    { name: 'Journal', path: '/en/journal' },
    { name: 'A post', path: '/en/blog/a-post' }
  ]);
  for (const locale of LOCALES) {
    for (const route of staticRoutes) {
      const { trail } = nav.resolveNav(locale, route, 'Page title');
      const items = nav.breadcrumbItems(locale, route, 'Page title');
      assert.deepEqual(
        items.slice(1).map((item) => item.name),
        trail.map((crumb) => crumb.label),
        `${locale} ${route}: structured data and visible trail differ`
      );
    }
  }
});

test('the language switch lands on the same page under the other segment, in its spelling', () => {
  assert.equal(nav.localeSwitchHref('pt-BR', 'pt-BR', '/pt-br/sobre'), '/pt-br/sobre');
  assert.equal(nav.localeSwitchHref('pt-BR', 'en', '/pt-br/sobre'), '/en/about');
  assert.equal(nav.localeSwitchHref('en', 'pt-BR', '/en/about'), '/pt-br/sobre');
  assert.equal(nav.localeSwitchHref('pt-BR', 'en', '/pt-br'), '/en');
  assert.equal(nav.localeSwitchHref('en', 'pt-BR', '/en'), '/pt-br');
  assert.equal(
    nav.localeSwitchHref('pt-BR', 'en', '/pt-br/produtos/strategos'),
    '/en/products/strategos'
  );
  assert.equal(
    nav.localeSwitchHref('en', 'pt-BR', '/en/products/strategos'),
    '/pt-br/produtos/strategos'
  );
  assert.equal(nav.localeSwitchHref('pt-BR', 'en', '/pt-br/blog/um-post'), '/en/blog/um-post');
});

test('on a post the language switch goes to the address the post has in that language', () => {
  // What the loader of a post resolves: its public slug in each language it
  // exists in. The slug may differ, and a language may be missing.
  const both = [
    { locale: 'pt-BR', publicSlug: '2026-08-05-o-primeiro-palmo' },
    { locale: 'en', publicSlug: '2026-08-05-the-first-span' }
  ];
  assert.equal(
    nav.localeSwitchHref('pt-BR', 'en', '/pt-br/blog/2026-08-05-o-primeiro-palmo', both),
    '/en/blog/2026-08-05-the-first-span'
  );
  assert.equal(
    nav.localeSwitchHref('en', 'pt-BR', '/en/blog/2026-08-05-the-first-span', both),
    '/pt-br/blog/2026-08-05-o-primeiro-palmo'
  );
  assert.equal(
    nav.localeSwitchHref('en', 'en', '/en/blog/2026-08-05-the-first-span', both),
    '/en/blog/2026-08-05-the-first-span'
  );
  // No version in the other language: the Journal of that language, not a
  // missing page.
  const onlyPt = [{ locale: 'pt-BR', publicSlug: '2026-10-13-so-em-portugues' }];
  assert.equal(
    nav.localeSwitchHref('pt-BR', 'en', '/pt-br/blog/2026-10-13-so-em-portugues', onlyPt),
    '/en/journal'
  );
  // Page data of another page carries no alternates, and nothing changes for it.
  assert.equal(nav.localeSwitchHref('pt-BR', 'en', '/pt-br/sobre', undefined), '/en/about');
  assert.equal(nav.localeSwitchHref('pt-BR', 'en', '/pt-br/sobre', both), '/en/about');
});

test('a service under the prefix of the other language switches to its own page', () => {
  // A slug of one language under the prefix of the other is still the one
  // mapped service, whichever way it is written.
  for (const mixed of ['/services/agentes-de-ia', '/servicos/ai-agents']) {
    assert.equal(nav.canonicalPath(mixed), '/servicos/agentes-de-ia');
    assert.equal(nav.localeSwitchHref('pt-BR', 'en', mixed), '/en/services/ai-agents');
    assert.equal(nav.localeSwitchHref('en', 'pt-BR', mixed), '/pt-br/servicos/agentes-de-ia');
    assert.deepEqual(nav.resolveNav('pt-BR', mixed, 'Agentes de IA').trail, [
      { label: 'Soluções', href: '/pt-br/solucoes' },
      { label: 'Agentes de IA' }
    ]);
  }
  // An unknown slug keeps its own spelling, respelled only by prefix.
  assert.equal(nav.canonicalPath('/services/nao-existe'), '/servicos/nao-existe');
  assert.equal(nav.canonicalPath('/servicos/nao-existe'), '/servicos/nao-existe');
});

test('every loader shape names its page in the trail and in BreadcrumbList', () => {
  // The objects the +page.server.ts loaders return, merged with layout data.
  const layout = { locale: 'pt-BR', analytics: null };
  const post = { slug: '2026-01-01-um-post', publicSlug: '2026-01-01-um-post', title: 'Um post' };
  const cases = [
    ['/blog/2026-01-01-um-post', { ...layout, post, publicSlug: post.publicSlug }, 'Um post'],
    [
      '/journal/autor/leandro',
      { ...layout, author: { name: 'Leandro Damasio' }, posts: [] },
      'Leandro Damasio'
    ],
    ['/journal/tag/risk', { ...layout, tag: 'risk', posts: [] }, 'risk'],
    [
      '/produtos/maestro',
      { ...layout, page: { title: 'RBX Maestro — RBX Systems' }, slug: 'maestro' },
      'RBX Maestro'
    ],
    ['/produtos/sem-pagina', { ...layout, page: null, slug: 'sem-pagina' }, 'sem-pagina'],
    [
      '/servicos/llmops',
      { ...layout, page: { title: 'LLMOps — RBX Systems' }, slug: 'llmops' },
      'LLMOps'
    ],
    // A post saved with a blank title is named by its public slug.
    [
      '/blog/2026-01-01-um-post',
      { ...layout, post: { ...post, title: ' ' }, publicSlug: post.publicSlug },
      '2026-01-01-um-post'
    ]
  ];
  for (const [path, data, expected] of cases) {
    const leaf = nav.leafTitle(data);
    assert.equal(leaf, expected, path);
    const trail = nav.resolveNav('pt-BR', path, leaf).trail;
    assert.deepEqual(trail[trail.length - 1], { label: expected }, path);
    const items = nav.breadcrumbItems('pt-BR', path, leaf);
    assert.deepEqual(items[items.length - 1], { name: expected, path: `/pt-br${path}` }, path);
  }
  // Layout data alone (an error page) names nothing.
  assert.equal(nav.leafTitle(layout), undefined);
});

test('no source or static file still draws the retired disc mark', () => {
  const retired = '151.64585';
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(svelte|svg|ts|css|html)$/.test(entry.name)) {
        if (readFileSync(full, 'utf8').includes(retired)) offenders.push(path.relative(root, full));
      }
    }
  };
  walk(path.join(root, 'src'));
  walk(path.join(root, 'static'));
  assert.deepEqual(offenders, []);
});
