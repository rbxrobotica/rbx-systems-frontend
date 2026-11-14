#!/usr/bin/env node
// Asks the built application what the unit tests cannot see: what the router
// and the adapter answer before the handle hook runs, what a client-side
// navigation is told, and every address a rendered page names.
//
//   pnpm build && pnpm check:built
//
// It starts the build three times, on loopback ports, against an in-memory
// copy of the content: the posts under blog-posts/, the pages under
// site-content/ and the rescued copy under site-content-recovery/. No
// credentials, no network, nothing written.
//
//   A  the deployment of the site host: ORIGIN is the site host and the
//      ingress forwards the name the visitor used
//   B  a deployment whose ORIGIN is still an earlier host
//   C  no ORIGIN: the Host header is the address, as on a developer's machine
import { createServer, request as httpRequest } from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeHTMLAttribute } from 'entities';
import { loadTypeScriptGraph } from './test-support/load-typescript-graph.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const SITE = 'https://merovelis.com';
const LANDING = 'https://briefingbtc.merovelis.com/';

// What a page is expected to say about itself comes from the modules the
// site builds it with, not from a second copy of their rules.
const { LOCALE_PATH_MAP, getAlternates, postAlternateLinks } = loadTypeScriptGraph(
  new URL('../src/lib/seo/alternates.ts', import.meta.url)
);
const { serviceContentSlug } = loadTypeScriptGraph(
  new URL('../src/lib/services/catalog.ts', import.meta.url)
);
const dictionary = (locale) =>
  JSON.parse(readFileSync(path.join(root, `src/lib/i18n/${locale}.json`), 'utf8'));

// ---- content fixture --------------------------------------------------------

const objects = new Map();
function addTree(dir, prefix) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) addTree(full, `${prefix}${name}/`);
    else objects.set(`${prefix}${name}`, readFileSync(full));
  }
}
const rescue = path.join(root, 'site-content-recovery/2026-11-07-cache-rescue');
addTree(path.join(rescue, 'blog/covers'), 'blog/covers/');
addTree(path.join(rescue, 'assets'), 'assets/');
addTree(path.join(rescue, 'site'), 'site/');
addTree(path.join(root, 'site-content/pt-BR'), 'site/pt-BR/');
addTree(path.join(root, 'site-content/en'), 'site/en/');
for (const name of readdirSync(path.join(root, 'blog-posts'))) {
  if (name.endsWith('.md')) {
    objects.set(`blog/posts/${name}`, readFileSync(path.join(root, 'blog-posts', name)));
  }
}
// A post whose English version has its own public slug.
const aliased = [...objects.keys()]
  .filter((key) => key.endsWith('.en.md'))
  .map((key) => {
    const alias = objects
      .get(key)
      .toString('utf8')
      .match(/^slugAlias:\s*'?([a-z0-9-]+)'?\s*$/m);
    return alias && { slug: key.slice('blog/posts/'.length, -'.en.md'.length), alias: alias[1] };
  })
  .find(Boolean);
if (!aliased) throw new Error('The fixture has no post with a slugAlias in English.');
// A post that exists in one language only (the published ones all have
// both), with links as an author writes them: an earlier name of a page, a
// spelling, the landing, and a post by the slug it has in the other language.
const ONLY_PT = '2020-01-01-so-em-portugues';
objects.set(
  `blog/posts/${ONLY_PT}.pt-BR.md`,
  Buffer.from(
    [
      '---',
      "title: 'Só em português'",
      "date: '2020-01-01'",
      "excerpt: 'Um post sem versão em inglês.'",
      '---',
      '',
      'Veja o [Journal](/blog), a [parceria](/partnership#qualificacao), o ',
      `[briefing](/briefing-btc?utm_campaign=w01) e [outro post](/blog/${aliased.alias}#parte).`,
      '',
      // HTML written by hand, as stored pages carry it: any quoting, any case.
      '<p><a href=\'/about\'>aspas simples</a>, <a HREF="/journal/tag/risco">maiúsculas</a> e ',
      '<a class=more href=/contact>sem aspas</a>.</p>',
      '',
      // Character references, a query without quotes, spaces around the value.
      "<p><a href='&#47;about?de=o&#39;post'>referências</a>, ",
      '<a href=/contact?assunto=parceria&origem=post>consulta sem aspas</a> e ',
      '<a href=" /about ">espaços</a>.</p>',
      '',
      // Addresses written in full: an earlier host names its language.
      'O [site antigo](https://rbx.ia.br/sobre/), a página [em inglês](https://rbxsystems.ch/sobre) ',
      'e um [endereço de fora](https://example.org/x).'
    ].join('\n')
  )
);

// The rescued copy does not hold the page of /robson, whose canonical is the
// one exception the check knows: a small page stands in for it.
for (const locale of ['pt-BR', 'en']) {
  objects.set(
    `site/${locale}/robson/index.md`,
    Buffer.from("---\ntitle: 'Robson'\ndescription: 'Robson.'\n---\n\nRobson.\n")
  );
}

const servers = [];
const children = [];
function listen(server) {
  servers.push(server);
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}
async function freePort() {
  const reservation = createServer();
  const port = await listen(reservation);
  await new Promise((resolve) => reservation.close(resolve));
  return port;
}
function stop() {
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
  for (const server of servers) server.close();
}

const storagePort = await listen(
  createServer((req, res) => {
    const url = new URL(req.url, 'http://storage');
    const [, ...keyParts] = url.pathname.split('/').filter(Boolean);
    if (keyParts.length === 0 && url.searchParams.get('list-type') === '2') {
      const prefix = url.searchParams.get('prefix') ?? '';
      const keys = [...objects.keys()].filter((key) => key.startsWith(prefix)).sort();
      res.writeHead(200, { 'Content-Type': 'application/xml' });
      res.end(
        `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><Name>rbx-content</Name><Prefix>${prefix}</Prefix><KeyCount>${keys.length}</KeyCount><IsTruncated>false</IsTruncated>${keys
          .map(
            (key) => `<Contents><Key>${key}</Key><Size>${objects.get(key).length}</Size></Contents>`
          )
          .join('')}</ListBucketResult>`
      );
      return;
    }
    const body = objects.get(decodeURIComponent(keyParts.join('/')));
    if (!body) {
      res.writeHead(404, { 'Content-Type': 'application/xml' });
      res.end('<Error><Code>NoSuchKey</Code></Error>');
      return;
    }
    res.writeHead(200, { 'Content-Length': body.length });
    res.end(body);
  })
);

// ---- the three applications -------------------------------------------------

const base = {
  PATH: process.env.PATH,
  NODE_ENV: 'production',
  HOST: '127.0.0.1',
  CONTABO_S3_ENDPOINT: `http://127.0.0.1:${storagePort}`,
  CONTABO_S3_CONTENT_BUCKET: 'rbx-content',
  CONTABO_S3_ACCESS_KEY: 'local-fixture',
  CONTABO_S3_SECRET_KEY: 'local-fixture',
  AWS_EC2_METADATA_DISABLED: 'true'
};
const forwarded = { PROTOCOL_HEADER: 'x-forwarded-proto', HOST_HEADER: 'x-forwarded-host' };
const apps = new Map([
  ['A', { env: { ...base, ...forwarded, ORIGIN: SITE } }],
  ['B', { env: { ...base, ...forwarded, ORIGIN: 'https://rbx.ia.br' } }],
  ['C', { env: { ...base } }]
]);
if (!existsSync(path.join(root, 'build/index.js'))) {
  console.error('No build to check. Run `pnpm build` first.');
  process.exit(1);
}
// What the applications write to stderr (a line for each 404, the storage
// budget of a cold cache) is kept and shown only when a check fails.
const stderr = [];
for (const [label, app] of apps) {
  app.port = await freePort();
  const child = spawn(process.execPath, [path.join(root, 'build/index.js')], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...app.env, PORT: String(app.port) }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr.push(`[${label}] ${chunk}`);
    if (stderr.length > 400) stderr.shift();
  });
  children.push(child);
}

function get(app, pathname, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        hostname: '127.0.0.1',
        port: apps.get(app).port,
        path: pathname,
        method,
        headers,
        timeout: 20000
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8')
          })
        );
      }
    );
    req.once('timeout', () => req.destroy(new Error(`No answer for ${pathname}`)));
    req.once('error', reject);
    req.end();
  });
}

for (const app of apps.keys()) {
  let ready = false;
  for (let attempt = 0; attempt < 150 && !ready; attempt += 1) {
    try {
      ready = (await get(app, '/healthz')).status === 200;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  if (!ready) {
    stop();
    console.error(stderr.join(''));
    throw new Error(`Application ${app} did not start.`);
  }
}

// ---- checks -------------------------------------------------------------------

const failures = [];
let passed = 0;
function check(label, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed += 1;
    return;
  }
  failures.push(
    `${label}\n    got      ${JSON.stringify(actual)}\n    expected ${JSON.stringify(expected)}`
  );
}

// Traefik passes the Host header on and repeats it as the forwarded host.
const ingress = (host) => ({ host, 'x-forwarded-host': host, 'x-forwarded-proto': 'https' });
const site = ingress('merovelis.com');
const hop = async (app, pathname, headers, method) => {
  const res = await get(app, pathname, headers, method);
  return [res.status, res.headers.location ?? null];
};

/**
 * Follow a request to where it ends, as a browser would: every hop, then the
 * final status. An address on the site host is asked of the same application,
 * under the name of the site host.
 */
const unbounded = [];
async function follow(app, headers, pathname) {
  const hops = [];
  let request = { app, headers, pathname };
  for (;;) {
    if (hops.length > 5) return { hops, status: 'too many hops' };
    const res = await get(request.app, request.pathname, request.headers);
    const location = res.headers.location;
    if (res.status < 300 || res.status >= 400 || !location) return { hops, status: res.status };
    // A permanent redirect is bounded in the browser, whoever sends it: the
    // hook or the loader of a route.
    if (
      (res.status === 301 || res.status === 308) &&
      res.headers['cache-control'] !== 'public, max-age=3600'
    ) {
      unbounded.push(`${request.app} ${request.pathname}: ${res.headers['cache-control']}`);
    }
    hops.push(`${res.status} ${location}`);
    if (location.startsWith(LANDING)) return { hops, status: 'landing' };
    request = location.startsWith(`${SITE}/`)
      ? {
          app,
          headers: app === 'C' ? { host: 'merovelis.com' } : site,
          pathname: location.slice(SITE.length)
        }
      : { ...request, pathname: location };
  }
}

// The site host.
check('A /healthz', await hop('A', '/healthz', site), [200, null]);
check('A / without a language', await hop('A', '/', site), [302, '/en']);
check(
  'A / for a Portuguese browser',
  await hop('A', '/', { ...site, 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8' }),
  [302, '/pt-br']
);
{
  const res = await get('A', '/', { ...site, 'accept-language': 'pt-BR' });
  check(
    'A / a negotiated answer varies and is not stored',
    [res.headers.vary, res.headers['cache-control']],
    ['Accept-Language', 'private, no-store']
  );
}
check('A /sobre', await hop('A', '/sobre?utm_source=x', site), [301, '/pt-br/sobre?utm_source=x']);
check('A /about', await hop('A', '/about', site), [301, '/en/about']);
check('A /en/sobre', await hop('A', '/en/sobre', site), [301, '/en/about']);
check('A /PT-BR/sobre', await hop('A', '/PT-BR/sobre', site), [301, '/pt-br/sobre']);
check('A /pt-br/aboutus', await hop('A', '/pt-br/aboutus', site), [301, '/pt-br/sobre']);
check('A /briefing-btc', await hop('A', '/briefing-btc?utm_campaign=w01', site), [
  301,
  `${LANDING}?utm_campaign=w01`
]);
check('A www', await hop('A', '/en/about', ingress('www.merovelis.com')), [
  301,
  `${SITE}/en/about`
]);
// The router would answer these two on its own, before the hook, if a route
// let it: the hook does, in one hop and with its own headers.
check('A /en/about/ (trailing slash)', await hop('A', '/en/about/?a=1', site), [
  301,
  '/en/about?a=1'
]);
check('A /en/sobre/ (slash and spelling)', await hop('A', '/en/sobre/', site), [301, '/en/about']);
check('A /en/ (slash on a home page)', await hop('A', '/en/', site), [301, '/en']);
check('A /robots.txt/ (slash on an endpoint)', await hop('A', '/robots.txt/', site), [
  301,
  '/robots.txt'
]);
check('A /en/%73obre (escape)', await hop('A', '/en/%73obre', site), [301, '/en/about']);
check('A /en/%61bout (escape)', await hop('A', '/en/%61bout', site), [301, '/en/about']);
check('A /%65n/about (escape in the segment)', await hop('A', '/%65n/about', site), [
  301,
  '/en/about'
]);
check('A /en/journal/tag/risco', await hop('A', '/en/journal/tag/risco', site), [
  301,
  '/en/journal/tag/risk'
]);
check('A /pt-br/journal/{slug}', await hop('A', `/pt-br/journal/${aliased.slug}?a=1`, site), [
  301,
  `/pt-br/blog/${aliased.slug}?a=1`
]);
for (const pathname of [
  '/en/robots.txt',
  '/en/healthz',
  '/en/nowhere',
  '/en/pt-br/sobre',
  '/en/%'
]) {
  const [status] = await hop('A', pathname, site);
  check(`A ${pathname} is not an address`, status === 404 || status === 400, true);
}
check(
  'A POST /en/api/chat is not an address',
  (await hop('A', '/en/api/chat', site, 'POST'))[0],
  404
);
{
  const res = await get('A', '/sobre/__data.json', site);
  check(
    'A a client-side navigation to /sobre is sent to /pt-br/sobre',
    [res.status, JSON.parse(res.body)],
    [200, { type: 'redirect', location: '/pt-br/sobre' }]
  );
}

// The two earlier hosts, reaching the deployment of the site host.
const br = ingress('rbx.ia.br');
const ch = ingress('rbxsystems.ch');
check('rbx.ia.br /', await hop('A', '/', br), [301, `${SITE}/pt-br`]);
check('rbx.ia.br /sobre?x=1', await hop('A', '/sobre?x=1', br), [301, `${SITE}/pt-br/sobre?x=1`]);
check('rbxsystems.ch /sobre', await hop('A', '/sobre', ch), [301, `${SITE}/en/about`]);
check(
  'www.rbxsystems.ch /products/robson',
  await hop('A', '/products/robson', ingress('www.rbxsystems.ch')),
  [301, `${SITE}/en/products/robson`]
);
check('rbx.ia.br /sitemap.xml', await hop('A', '/sitemap.xml', br), [
  301,
  `${SITE}/pt-br/sitemap.xml`
]);
check('rbx.ia.br /robots.txt', await hop('A', '/robots.txt', br), [301, `${SITE}/robots.txt`]);
check('rbx.ia.br POST /api/chat', await hop('A', '/api/chat', br, 'POST'), [
  308,
  `${SITE}/api/chat`
]);
check('rbx.ia.br /healthz', await hop('A', '/healthz', br), [200, null]);

// A browser sends an Origin with a request that is not a read. A script that
// posts JSON reaches the hook and is redirected with its method.
const fromBr = { ...br, origin: 'https://rbx.ia.br' };
const FORM = 'application/x-www-form-urlencoded';
check(
  'rbx.ia.br POST /api/chat, as a script on a page of rbx.ia.br sends it',
  await hop('A', '/api/chat', { ...fromBr, 'content-type': 'application/json' }, 'POST'),
  [308, `${SITE}/api/chat`]
);
// A form is another matter. The framework refuses one submitted from another
// origin before the hook runs, and the origin of a deployment is its ORIGIN.
// The deployment of the site host refuses a form of an earlier host: it is
// not redirected, and no origin is trusted.
for (const type of [FORM, 'multipart/form-data; boundary=x', 'text/plain']) {
  check(
    `A refuses a form (${type}) that a page of rbx.ia.br submits to rbx.ia.br`,
    await hop('A', '/api/chat', { ...fromBr, 'content-type': type }, 'POST'),
    [403, null]
  );
}
check(
  'A refuses a form with no Origin',
  await hop('A', '/api/chat', { ...br, 'content-type': FORM }, 'POST'),
  [403, null]
);
check(
  'A refuses a form another site submits to the site host',
  await hop(
    'A',
    '/pt-br/parceria',
    { ...site, origin: 'https://example.org', 'content-type': FORM },
    'POST'
  ),
  [403, null]
);
check(
  'A refuses a form an earlier host submits to the site host',
  await hop(
    'A',
    '/pt-br/parceria',
    { ...site, origin: 'https://rbx.ia.br', 'content-type': FORM },
    'POST'
  ),
  [403, null]
);
// A form of the site host itself passes the check and reaches the page,
// which takes no form.
check(
  'A lets a form of the site host through to the page, which has no action',
  await hop('A', '/pt-br/parceria', { ...site, origin: SITE, 'content-type': FORM }, 'POST'),
  [405, null]
);
// A deployment whose ORIGIN is the earlier host: there the form is of the
// same origin, reaches the hook and is redirected with its method.
check(
  'B redirects a form that a page of rbx.ia.br submits to rbx.ia.br',
  await hop('B', '/api/chat', { ...fromBr, 'content-type': FORM }, 'POST'),
  [308, `${SITE}/api/chat`]
);
check(
  'B refuses a form another site submits to rbx.ia.br',
  await hop(
    'B',
    '/api/chat',
    { ...br, origin: 'https://example.org', 'content-type': FORM },
    'POST'
  ),
  [403, null]
);
{
  const res = await get('A', '/sobre', br);
  check(
    'rbx.ia.br a permanent redirect is bounded in the browser',
    res.headers['cache-control'],
    'public, max-age=3600'
  );
}
// A static file that exists is served by the adapter on any host: an image
// an old page or an old preview points at keeps answering.
check('rbx.ia.br /favicon.svg is served', (await hop('A', '/favicon.svg', br))[0], 200);
check('rbx.ia.br /brand/rbx-og.jpg is served', (await hop('A', '/brand/rbx-og.jpg', br))[0], 200);

// One hop from an earlier address to the page, whatever needs fixing on the way.
for (const [label, headers, pathname, landing] of [
  ['rbx.ia.br /sobre/?a=1', br, '/sobre/?a=1', `${SITE}/pt-br/sobre?a=1`],
  ['rbxsystems.ch /sobre/', ch, '/sobre/', `${SITE}/en/about`],
  ['rbxsystems.ch /%73obre', ch, '/%73obre', `${SITE}/en/about`],
  ['rbx.ia.br /aboutus/', br, '/aboutus/', `${SITE}/pt-br/sobre`],
  ['rbx.ia.br /journal/tag/risco/', br, '/journal/tag/risco/', `${SITE}/pt-br/journal/tag/risk`],
  [
    'rbx.ia.br /journal/{slug}',
    br,
    `/journal/${aliased.slug}`,
    `${SITE}/pt-br/blog/${aliased.slug}`
  ],
  [
    'rbx.ia.br /blog/{slug}?utm',
    br,
    `/blog/${aliased.slug}?utm_source=x`,
    `${SITE}/pt-br/blog/${aliased.slug}?utm_source=x`
  ],
  [
    'rbxsystems.ch /blog/{its slug}?utm',
    ch,
    `/blog/${aliased.alias}?utm_source=x`,
    `${SITE}/en/blog/${aliased.alias}?utm_source=x`
  ],
  ['rbx.ia.br /sitemap.xml/', br, '/sitemap.xml/', `${SITE}/pt-br/sitemap.xml`]
]) {
  check(label, await follow('A', headers, pathname), { hops: [`301 ${landing}`], status: 200 });
}
// A post asked of an earlier host by a slug that is not its public slug
// there. The hook completes the redirect from the post lists in memory, so
// this is one hop too: the pages above already had the lists read.
check(
  'rbxsystems.ch /blog/{the slug of the other language}?utm',
  await follow('A', ch, `/blog/${aliased.slug}?utm_source=x`),
  { hops: [`301 ${SITE}/en/blog/${aliased.alias}?utm_source=x`], status: 200 }
);
check(
  'rbx.ia.br /journal/{the slug of the other language}/',
  await follow('A', br, `/journal/${aliased.alias}/`),
  { hops: [`301 ${SITE}/pt-br/blog/${aliased.slug}`], status: 200 }
);
// Asked of the site host under its segment, the same post is the loader's one hop.
check(
  'A /en/blog/{the slug of the other language}?utm',
  await follow('A', site, `/en/blog/${aliased.slug}?utm_source=x`),
  { hops: [`301 /en/blog/${aliased.alias}?utm_source=x`], status: 200 }
);
// Application C has served nothing yet, so it holds no post list. A redirect
// reads nothing from storage: it goes out as asked, and the loader of the
// post adds its hop. That happens once per started application.
check(
  'a redirect before any post list was read takes the hop of the loader, once',
  [
    await follow('C', { host: 'rbxsystems.ch' }, `/blog/${aliased.slug}`),
    await follow('C', { host: 'rbxsystems.ch' }, `/blog/${aliased.slug}`)
  ],
  [
    { hops: [`301 ${SITE}/en/blog/${aliased.slug}`, `301 /en/blog/${aliased.alias}`], status: 200 },
    { hops: [`301 ${SITE}/en/blog/${aliased.alias}`], status: 200 }
  ]
);

// A deployment whose ORIGIN is still an earlier host.
check('B probe by pod address', await hop('B', '/healthz', { host: '10.42.0.9:8080' }), [
  200,
  null
]);
check('B /', await hop('B', '/', br), [301, `${SITE}/pt-br`]);
check('B asked for the site host serves it', (await hop('B', '/pt-br/sobre', site))[0], 200);
check(
  'A a forwarded host alone does not send the site host to itself',
  (await hop('A', '/pt-br/sobre', { ...site, 'x-forwarded-host': 'rbx.ia.br' }))[0],
  200
);

// No ORIGIN: the Host header is the address.
check('C localhost /', await hop('C', '/', { host: 'localhost:5173' }), [302, '/en']);
check('C localhost /sobre', await hop('C', '/sobre', { host: 'localhost:5173' }), [
  301,
  '/pt-br/sobre'
]);
check('C Host rbxsystems.ch /', await hop('C', '/', { host: 'rbxsystems.ch' }), [
  301,
  `${SITE}/en`
]);

// The files of the host and the files of a language.
for (const [pathname, type, needle] of [
  ['/robots.txt', 'text/plain', `Sitemap: ${SITE}/sitemap.xml`],
  ['/sitemap.xml', 'application/xml', `<loc>${SITE}/pt-br/sitemap.xml</loc>`],
  ['/pt-br/sitemap.xml', 'application/xml', `<loc>${SITE}/pt-br/sobre</loc>`],
  ['/en/sitemap.xml', 'application/xml', `<loc>${SITE}/en/about</loc>`],
  ['/pt-br/rss.xml', 'application/xml', `<link>${SITE}/pt-br/journal</link>`],
  ['/en/rss.xml', 'application/xml', `<atom:link href="${SITE}/en/rss.xml"`],
  ['/llms.txt', 'text/plain', `(${SITE}/en/about)`],
  ['/pt-br/llms.txt', 'text/plain', `(${SITE}/pt-br/sobre)`],
  [
    '/estudos/criminalidade-sp',
    'text/html',
    `<link rel="canonical" href="${SITE}/estudos/criminalidade-sp">`
  ]
]) {
  const res = await get('A', pathname, site);
  check(
    `A ${pathname}`,
    [res.status, (res.headers['content-type'] ?? '').split(';')[0], res.body.includes(needle)],
    [200, type, true]
  );
}

// ---- every address a page names ------------------------------------------------

const hostWide =
  /^\/(api|_app|brand|estudos|products\/evidence)\/|^\/(favicon\.svg|robots\.txt|rss-style\.xsl|healthz)$/;
const earlierHost = /^https?:\/\/(www\.)?(rbx\.ia\.br|rbxsystems\.ch)(\/|$|\?|#)/i;
const problems = [];
const named = new Map(); // an address some page names, and the first page that names it
const answered = new Map(); // the status of an address asked of the site host
const name = (address, from) => {
  if (!named.has(address)) named.set(address, from);
};

// The posts of the fixture: the public slug of each in each language.
const variants = new Map(); // storage slug -> Map(locale -> public slug)
const storageSlugOf = new Map(); // `${locale}:${public slug}` -> storage slug
for (const [key, body] of objects) {
  const post = key.match(/^blog\/posts\/(.+)\.(pt-BR|en)\.md$/);
  if (!post) continue;
  const alias = body.toString('utf8').match(/^slugAlias:\s*'?([a-z0-9-]+)'?\s*$/m)?.[1];
  if (!variants.has(post[1])) variants.set(post[1], new Map());
  variants.get(post[1]).set(post[2], alias ?? post[1]);
  storageSlugOf.set(`${post[2]}:${alias ?? post[1]}`, post[1]);
}

// The content key each route reads, for the routes that answer 404 without
// it, read from their loaders. A route that falls back to built-in copy when
// the content is missing (`loadPageOrNull`) is not here: it always answers.
const contentKeyOfRoute = new Map();
(function readLoaders(dir, route) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = path.join(dir, entry.name);
    const loader = path.join(child, '+page.server.ts');
    const key =
      existsSync(loader) && readFileSync(loader, 'utf8').match(/\bloadPage\(\s*'([^']+)'/)?.[1];
    if (key) contentKeyOfRoute.set(`${route}/${entry.name}`, key);
    readLoaders(child, `${route}/${entry.name}`);
  }
})(path.join(root, 'src/routes'), '');
contentKeyOfRoute.set('/', 'home');

/**
 * Whether an address may answer 404 because the fixture does not hold what
 * it serves: the content of a page, a cover, an asset. Nothing else may. A
 * page the fixture does hold, a post, a tag and an author must answer.
 */
function absentFromFixture(lang, rest) {
  const cover = rest.match(/^\/api\/blog\/cover\/(.+)$/);
  if (cover) return !objects.has(`blog/covers/${cover[1]}`);
  const asset = rest.match(/^\/api\/assets\/(.+)$/);
  if (asset) return !objects.has(`assets/${asset[1]}`);
  let key = contentKeyOfRoute.get(rest);
  const product = rest.match(/^\/(?:produtos|products)\/([^/]+)$/);
  const service = rest.match(/^\/(?:servicos|services)\/([^/]+)$/);
  if (!key && product) key = `products/${product[1]}`;
  if (!key && service) key = `services/${serviceContentSlug(lang, service[1])}`;
  return key !== undefined && !objects.has(`site/${lang}/${key}/index.md`);
}

/** The hreflang links a page must carry, from the rules the site builds them with. */
function expectedAlternates(lang, rest) {
  if (Object.hasOwn(LOCALE_PATH_MAP, rest)) return getAlternates(lang, rest);
  const post = rest.match(/^\/blog\/([a-z0-9-]+)$/);
  const storageSlug = post && storageSlugOf.get(`${lang}:${post[1]}`);
  if (!storageSlug) return [];
  return postAlternateLinks(
    ['pt-BR', 'en']
      .filter((locale) => variants.get(storageSlug).has(locale))
      .map((locale) => ({ locale, publicSlug: variants.get(storageSlug).get(locale) }))
  );
}

/** The canonical a page must carry: its own address, with the exceptions the site declares. */
function expectedCanonical(pathname) {
  // /robson is a second door to the product page and names it as canonical.
  if (pathname === '/pt-br/robson') return `${SITE}/pt-br/produtos/robson`;
  if (pathname === '/en/robson') return `${SITE}/en/products/robson`;
  return `${SITE}${pathname}`;
}

/**
 * Every `<a>` start tag with the address of its href, read as HTML reads it:
 * any case, any quoting, the character references of the value decoded.
 */
function anchorsOf(html) {
  const anchors = [];
  for (const tag of html.matchAll(/<a(?=[\s/>])(?:"[^"]*"|'[^']*'|[^>"'])*>/gi)) {
    const href = tag[0].match(/[\s"'/]href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>][^\s>]*))/i);
    if (href) {
      anchors.push({
        href: decodeHTMLAttribute(href[1] ?? href[2] ?? href[3]),
        tag: tag[0],
        at: tag.index
      });
    }
  }
  return anchors;
}

/** The addresses of this site a JSON-LD node gives as its own or as a target. */
function addressesOf(node, found = []) {
  if (Array.isArray(node)) for (const item of node) addressesOf(item, found);
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string') {
        if (earlierHost.test(value)) found.push({ key, value, earlier: true });
        else if (key !== '@id' && value.startsWith(SITE)) found.push({ key, value });
      } else addressesOf(value, found);
    }
  }
  return found;
}

let pages = 0;
let links = 0;
for (const [segment, lang] of [
  ['/pt-br', 'pt-BR'],
  ['/en', 'en']
]) {
  const other = segment === '/en' ? '/pt-br' : '/en';
  // Start from every route the site maps, not only from what the home links
  // to: a page that disappeared, with every link to it, is still asked for.
  const queue = [
    ...new Set([
      segment,
      ...Object.values(LOCALE_PATH_MAP)
        // eslint-disable-next-line security/detect-object-injection -- lang is 'pt-BR' or 'en'
        .map((mapping) => mapping[lang])
        .filter((route) => route !== '/')
        .map((route) => `${segment}${route}`),
      `${segment}/robson`,
      ...(lang === 'pt-BR' ? [`${segment}/blog/${ONLY_PT}`] : [])
    ])
  ];
  const seen = new Set(queue);
  for (const seed of queue) name(seed, 'the routes the site maps');
  while (queue.length > 0) {
    const pathname = queue.shift();
    const res = await get('A', pathname, site);
    answered.set(pathname, res.status);
    pages += 1;
    if (res.status !== 200 || !(res.headers['content-type'] ?? '').startsWith('text/html'))
      continue;
    const html = res.body;
    const rest = pathname === segment ? '/' : pathname.slice(segment.length);

    const htmlLang = html.match(/<html lang="([^"]*)"/)?.[1];
    if (htmlLang !== lang) problems.push(`${pathname}: <html lang> is ${htmlLang}`);

    // The canonical: there is one, and it is the address of the page.
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
    if (canonicals.length !== 1 || canonicals[0] !== expectedCanonical(pathname)) {
      problems.push(`${pathname}: canonical is ${JSON.stringify(canonicals)}`);
    } else name(canonicals[0].slice(SITE.length), pathname);

    // The hreflang links: exactly the set the page must carry. The page each
    // one names is read in its own turn and must carry the same set, which
    // is what makes them reciprocal.
    const alternates = [
      ...html.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)
    ].map((m) => ({ hreflang: m[1], href: m[2] }));
    const expected = expectedAlternates(lang, rest) ?? [];
    if (JSON.stringify(alternates) !== JSON.stringify(expected)) {
      problems.push(
        `${pathname}: hreflang is ${JSON.stringify(alternates)}, expected ${JSON.stringify(expected)}`
      );
    }
    for (const { href } of alternates) name(href.slice(SITE.length), pathname);

    for (const ld of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      for (const { key, value, earlier } of addressesOf(JSON.parse(ld[1]))) {
        if (earlier) problems.push(`${pathname}: structured data ${key} names ${value}`);
        else name(value.slice(SITE.length).split('#')[0] || '/', pathname);
      }
    }

    const body = html.replace(/<script[\s\S]*?<\/script>/g, '');
    // Stored content is what an author wrote. A link there may name the other
    // language on purpose; everywhere else only the language switch does.
    const proseStart = body.indexOf('<article class="prose');
    const proseEnd = proseStart === -1 ? -1 : body.indexOf('</article>', proseStart);
    for (const { href, tag, at } of anchorsOf(body)) {
      links += 1;
      if (earlierHost.test(href)) {
        problems.push(`${pathname}: a link to an earlier host: ${href}`);
        continue;
      }
      // An address of the site written in full is read like any other.
      const address =
        href.startsWith(`${SITE}/`) || href === SITE ? href.slice(SITE.length) || '/' : href;
      if (!address.startsWith('/') || address.startsWith('//')) continue;
      const target = address.split(/[?#]/)[0];
      if (hostWide.test(target)) continue;
      if (target === other || target.startsWith(`${other}/`)) {
        const authored = at > proseStart && at < proseEnd;
        if (authored || /\shreflang="/.test(tag)) name(target, pathname);
        else problems.push(`${pathname}: a link to the other language: ${href}`);
        continue;
      }
      if (!(target === segment || target.startsWith(`${segment}/`))) {
        problems.push(`${pathname}: a link without a locale segment: ${href}`);
        continue;
      }
      name(target, pathname);
      if (!seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
}

// Every address a page named is served as it is named. The only ones that
// may answer 404 are those whose content the fixture does not hold; a
// redirect, or a 404 for something the fixture holds, is a problem.
let notHeld = 0;
for (const [address, from] of named) {
  if (!answered.has(address)) answered.set(address, (await get('A', address, site)).status);
  const status = answered.get(address);
  if (status === 200) continue;
  const lang = address === '/en' || address.startsWith('/en/') ? 'en' : 'pt-BR';
  const rest = address.replace(/^\/(pt-br|en)(?=\/|$)/, '') || '/';
  if (status === 404 && absentFromFixture(lang, rest)) notHeld += 1;
  else problems.push(`${from}: names ${address}, which answers ${status}`);
}
check(
  'every page names itself, its alternates and its links by addresses that are served',
  problems,
  []
);
check('the crawl reached both languages', pages > 150 && links > 5000, true);

// The dictionary of the components that read svelte-i18n follows the path,
// request by request. The two languages are asked for at the same time, many
// times: the locale of one request must not show in the answer to another.
{
  const expected = {
    '/pt-br/contato': dictionary('pt-BR').contact.form,
    '/en/contact': dictionary('en').contact.form
  };
  const asked = [];
  for (let round = 0; round < 12; round += 1) asked.push('/pt-br/contato', '/en/contact');
  const answers = await Promise.all(asked.map((pathname) => get('A', pathname, site)));
  const wrong = [];
  answers.forEach((res, index) => {
    // eslint-disable-next-line security/detect-object-injection -- index is the position in this script's own list
    const pathname = asked[index];
    // eslint-disable-next-line security/detect-object-injection -- pathname is one of the two keys above
    const form = expected[pathname];
    // Without the markers the renderer leaves between pieces of text.
    const text = res.body.replace(/<!--[\s\S]*?-->/g, '');
    const label = text.match(/<label[^>]*\sfor="contact-name"[^>]*>([^<*]*)/)?.[1].trim();
    if (res.status !== 200 || label !== form.name || !res.body.includes(form.submit)) {
      wrong.push(
        `${pathname} (#${index}): status ${res.status}, name label ${JSON.stringify(label)}`
      );
    }
  });
  check('the dictionary follows the language of each request, also side by side', wrong, []);
  check(
    'the two dictionaries differ in what is asserted',
    expected['/pt-br/contato'].name !== expected['/en/contact'].name,
    true
  );
}

// The post that exists in one language only.
{
  const html = (await get('A', `/pt-br/blog/${ONLY_PT}`, site)).body;
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]*)"/g)].map(
    (m) => m[1]
  );
  check('a post in one language names no x-default', alternates, ['pt-BR']);
  const toEnglish = anchorsOf(html).find(({ tag }) => /\shreflang="en"/.test(tag))?.href;
  check('its language switch goes to the Journal of the other language', toEnglish, '/en/journal');
  const start = html.indexOf('<article class="prose');
  const prose = anchorsOf(html.slice(start, html.indexOf('</article>', start))).map(
    ({ href }) => href
  );
  check('links in its stored text go to where each page lives', prose, [
    '/pt-br/journal',
    '/pt-br/parceria#qualificacao',
    `${LANDING}?utm_campaign=w01`,
    `/pt-br/blog/${aliased.slug}#parte`,
    '/pt-br/sobre',
    '/pt-br/journal/tag/risk',
    '/pt-br/contato',
    "/pt-br/sobre?de=o'post",
    '/pt-br/contato?assunto=parceria&origem=post',
    '/pt-br/sobre',
    '/pt-br/sobre',
    '/en/about',
    'https://example.org/x'
  ]);
  check(
    'a rewritten link is written so that HTML reads the same address back',
    [
      html.includes("href='/pt-br/sobre?de=o&#39;post'"),
      html.includes('href="/pt-br/contato?assunto=parceria&amp;origem=post"')
    ],
    [true, true]
  );
}
// The post whose slug differs per language.
{
  const html = (await get('A', `/pt-br/blog/${aliased.slug}`, site)).body;
  const toEnglish = anchorsOf(html).find(({ tag }) => /\shreflang="en"/.test(tag))?.href;
  check(
    'the language switch of a post names its slug in that language',
    toEnglish,
    `/en/blog/${aliased.alias}`
  );
}

// The loader of a post redirects a slug that is not the public one. Its
// redirect is permanent and bounded like the ones the hook decides.
{
  const res = await get('A', `/en/blog/${aliased.slug}`, site);
  check(
    'the redirect of the loader of a post is bounded in the browser',
    [res.status, res.headers.location, res.headers['cache-control']],
    [301, `/en/blog/${aliased.alias}`, 'public, max-age=3600']
  );
}
check('every permanent redirect that was followed is bounded in the browser', unbounded, []);

stop();
console.log(
  `${passed} checks passed. ${pages} pages read, ${links} links, ${named.size} addresses named, ` +
    `${notHeld} of them without content in the fixture.`
);
if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n`);
  for (const failure of failures) console.error(`  ${failure}\n`);
  console.error('What the applications wrote to stderr:\n');
  console.error(stderr.join(''));
  process.exit(1);
}
