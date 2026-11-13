/**
 * The spelling of each route in each language, and the addresses built from
 * it: the href of a page in a language, its absolute URL and its hreflang
 * alternates. Both languages live on one host, under /pt-br and /en.
 *
 * Paths in LOCALE_PATH_MAP and in the arguments of these functions are site
 * paths without the locale segment. A path that arrives with the segment is
 * accepted and read without it.
 *
 * Every address these functions build is one the server answers directly:
 * a retired name, an old post address or a tag alias is resolved to the live
 * page here, with the same rules the server redirects by.
 */
import type { Locale, PostAlternate } from '$types/content';
import {
  LOCALE_PREFIX,
  decodePath,
  encodePath,
  hasDotSegment,
  isHostWidePath,
  localeOfPath,
  lowerLocaleSegment,
  stripLocalePrefix,
  trimTrailingSlashes
} from '$lib/i18n/locale';
import { canonicalTag } from '$lib/journal/tags';
import { SERVICE_ROUTES, servicePublicPath } from '$lib/services/catalog';
import {
  BRIEFING_LANDING,
  BRIEFING_PATH,
  LEGACY_HOST_LOCALE,
  SITE_HOST,
  SITE_ORIGIN
} from './site';

const SERVICE_PATH_MAP = Object.fromEntries(
  SERVICE_ROUTES.flatMap((service) => {
    const mapping = {
      'pt-BR': servicePublicPath('pt-BR', service),
      en: servicePublicPath('en', service)
    };
    return [
      [mapping['pt-BR'], mapping],
      [mapping.en, mapping]
    ];
  })
) as Record<string, { 'pt-BR': string; en: string }>;

export const LOCALE_PATH_MAP: Record<string, { 'pt-BR': string; en: string }> = {
  '/': { 'pt-BR': '/', en: '/' },
  '/sobre': { 'pt-BR': '/sobre', en: '/about' },
  '/about': { 'pt-BR': '/sobre', en: '/about' },
  '/historia': { 'pt-BR': '/historia', en: '/history' },
  '/history': { 'pt-BR': '/historia', en: '/history' },
  '/carreiras': { 'pt-BR': '/carreiras', en: '/careers' },
  '/careers': { 'pt-BR': '/carreiras', en: '/careers' },
  '/leandro-damasio': { 'pt-BR': '/leandro-damasio', en: '/leandro-damasio' },
  '/caue-alencar': { 'pt-BR': '/caue-alencar', en: '/caue-alencar' },
  '/flavia-ribeiro': { 'pt-BR': '/flavia-ribeiro', en: '/flavia-ribeiro' },
  '/solucoes': { 'pt-BR': '/solucoes', en: '/solutions' },
  '/solutions': { 'pt-BR': '/solucoes', en: '/solutions' },
  '/produtos': { 'pt-BR': '/produtos', en: '/products' },
  '/products': { 'pt-BR': '/produtos', en: '/products' },
  '/equipe': { 'pt-BR': '/equipe', en: '/team' },
  '/team': { 'pt-BR': '/equipe', en: '/team' },
  '/parceria': { 'pt-BR': '/parceria', en: '/partnership' },
  '/partnership': { 'pt-BR': '/parceria', en: '/partnership' },
  '/diagnostico': { 'pt-BR': '/diagnostico', en: '/diagnostic' },
  '/diagnostic': { 'pt-BR': '/diagnostico', en: '/diagnostic' },
  '/produtos/robson': { 'pt-BR': '/produtos/robson', en: '/products/robson' },
  '/products/robson': { 'pt-BR': '/produtos/robson', en: '/products/robson' },
  '/produtos/briefing-btc': { 'pt-BR': '/produtos/briefing-btc', en: '/products/briefing-btc' },
  '/products/briefing-btc': { 'pt-BR': '/produtos/briefing-btc', en: '/products/briefing-btc' },
  ...SERVICE_PATH_MAP,
  '/journal': { 'pt-BR': '/journal', en: '/journal' },
  '/cases': { 'pt-BR': '/cases', en: '/cases' },
  '/contato': { 'pt-BR': '/contato', en: '/contact' },
  '/contact': { 'pt-BR': '/contato', en: '/contact' },
  '/newsroom': { 'pt-BR': '/newsroom', en: '/newsroom' },
  '/changelog': { 'pt-BR': '/changelog', en: '/changelog' },
  '/manifesto': { 'pt-BR': '/manifesto', en: '/manifesto' },
  '/atelier': { 'pt-BR': '/atelier', en: '/atelier' },
  '/trust': { 'pt-BR': '/trust', en: '/trust' },
  '/legal': { 'pt-BR': '/legal', en: '/legal' }
};

export interface Alternate {
  hreflang: string;
  href: string;
}

/** English route prefixes whose slugs carry over, with their pt-BR spelling. */
export const PREFIX_PAIRS: [en: string, pt: string][] = [
  ['/products', '/produtos'],
  ['/services', '/servicos']
];

/** A site path without the locale segment and without a trailing slash. */
export function sitePath(pathname: string): string {
  return trimTrailingSlashes(stripLocalePrefix(pathname));
}

/**
 * Retired paths of the previous company sites (rbx-site 2023,
 * rbx_frontend_new 2024) that still receive crawler and backlink traffic.
 * Keys are the retired paths; destinations are canonical pt-BR routes and are
 * spelled for the language of the request. Live routes that now exist for
 * real (/about, /history, /careers, /team, ...) are deliberately absent.
 */
export const RETIRED_PATHS: Record<string, string> = {
  '/aboutus': '/sobre',
  '/corporate': '/sobre',
  '/privacy': '/legal',
  '/terms': '/legal',
  '/contacts': '/contato',
  '/precos': '/produtos',
  '/bots-instagram': '/produtos',
  '/gerador-leads': '/produtos',
  '/robo-trader': '/produtos/robson',
  // Exact path only: /blog/[slug] remains the live post route.
  '/blog': '/journal'
};

/**
 * The pages that live directly under /journal. Any other single segment
 * there is a post asked for at the address an early sitemap advertised,
 * /journal/{slug}; the post lives at /blog/{slug}.
 */
export const JOURNAL_PAGES = ['tag', 'autor'];

/**
 * The path a page lives at today, for a path that names it in an earlier
 * way: a retired name, a post under /journal, a tag by an alias. A path that
 * names nothing of the kind comes back as it is. No lookup in storage: which
 * slug a post has in a language is known to the post lists, and is resolved
 * by the code that has them (the handle hook for a redirect, the Content
 * Gateway for a link in stored content, the loader of the post otherwise).
 */
export function livePath(pathname: string): string {
  const path = sitePath(pathname);
  // eslint-disable-next-line security/detect-object-injection -- guarded by Object.hasOwn
  if (Object.hasOwn(RETIRED_PATHS, path)) return RETIRED_PATHS[path];
  const [, first, second, third, ...rest] = path.split('/');
  if (first !== 'journal' || second === undefined) return path;
  if (third === undefined) return JOURNAL_PAGES.includes(second) ? path : `/blog/${second}`;
  if (second === 'tag' && rest.length === 0) return `/journal/tag/${canonicalTag(third)}`;
  return path;
}

/**
 * The spelling of any path in a language: the mapped route when there is one,
 * and otherwise the path with a slug-carrying prefix respelled
 * (/produtos/x is /products/x in English, and /servicos alone is /services).
 * A slug of one language under the prefix of the other
 * (/services/agentes-de-ia) is still the mapped route.
 * Paths that are the same in both languages, such as /blog/x, come back as
 * they are. A path that names a page in an earlier way is resolved first
 * (see `livePath`), so the result is always where the page lives.
 */
export function spelledPath(locale: Locale, pathname: string): string {
  const normalized = livePath(pathname);
  // eslint-disable-next-line security/detect-object-injection -- normalized is a site path starting with '/', which no inherited property name does; locale is 'pt-BR' or 'en'
  const mapped = LOCALE_PATH_MAP[normalized]?.[locale];
  if (mapped) return mapped;
  for (const [en, pt] of PREFIX_PAIRS) {
    for (const [from, to] of [
      [en, pt],
      [pt, en]
    ]) {
      if (normalized !== from && !normalized.startsWith(`${from}/`)) continue;
      const slug = normalized.slice(from.length);
      // eslint-disable-next-line security/detect-object-injection -- the key starts with a prefix of PREFIX_PAIRS, which no inherited property name does; locale is 'pt-BR' or 'en'
      return LOCALE_PATH_MAP[`${to}${slug}`]?.[locale] ?? `${locale === 'en' ? en : pt}${slug}`;
    }
  }
  return normalized;
}

/**
 * The language a path is spelled in, when the spelling belongs to one
 * language only: /sobre is Portuguese, /about and /products/x are English,
 * /journal and /blog/x are neither.
 */
export function localeOfSpelling(pathname: string): Locale | undefined {
  const normalized = sitePath(pathname);
  // eslint-disable-next-line security/detect-object-injection -- normalized is a site path starting with '/', which no inherited property name does
  const mapping = LOCALE_PATH_MAP[normalized];
  if (mapping) {
    if (mapping['pt-BR'] === mapping.en) return undefined;
    return mapping.en === normalized ? 'en' : 'pt-BR';
  }
  for (const [en, pt] of PREFIX_PAIRS) {
    if (normalized === en || normalized.startsWith(`${en}/`)) return 'en';
    if (normalized === pt || normalized.startsWith(`${pt}/`)) return 'pt-BR';
  }
  return undefined;
}

/** Put the locale segment in front of a site path: /about is /en/about, / is /en. */
export function withLocalePrefix(locale: Locale, pathname: string): string {
  const normalized = sitePath(pathname);
  // eslint-disable-next-line security/detect-object-injection -- locale is 'pt-BR' or 'en'
  return `${LOCALE_PREFIX[locale]}${normalized === '/' ? '' : normalized}`;
}

/** The href of a page in a language: locale segment plus the route in that language. */
export function localizedHref(locale: Locale, pathname: string): string {
  return withLocalePrefix(locale, spelledPath(locale, pathname));
}

/**
 * Where a link to this site leads, for a link as an author or a data file
 * wrote it: `/parceria#qualificacao` is `/en/partnership#qualificacao` in
 * English. Use it wherever a link comes from data, from stored content or
 * from a literal.
 *
 * The address is read the way a request for it would be (see
 * `./redirects`) and written as the address the server answers directly, so
 * the link never lands on a redirect: an earlier name of a page is resolved,
 * the spelling follows the language, a needless escape or a trailing slash
 * goes, the query and the fragment stay. A link that names its language
 * keeps it: a locale segment (`/en/sobre` is `/en/about`, also from a
 * Portuguese page), or an absolute address on an earlier host (`/sobre` on
 * the Portuguese one is `/pt-br/sobre`). The path of the briefing landing
 * becomes the address of the landing.
 *
 * What is not a page of this site comes back unchanged: another host,
 * `mailto:`, a fragment alone, a host-wide path such as `/api/assets/x`, a
 * path the router would not read.
 */
export function siteHref(locale: Locale, href: string): string {
  let named: Locale | undefined;
  let address = href;
  const absolute = /^https?:\/\/([^/?#]+)(.*)$/i.exec(href);
  if (absolute) {
    const host = absolute[1].toLowerCase().replace(/^www\./, '');
    // eslint-disable-next-line security/detect-object-injection -- guarded by Object.hasOwn on a table of two host names
    if (Object.hasOwn(LEGACY_HOST_LOCALE, host)) named = LEGACY_HOST_LOCALE[host];
    else if (host !== SITE_HOST) return href;
    address = absolute[2].startsWith('/') ? absolute[2] : `/${absolute[2]}`;
  } else if (!href.startsWith('/') || href.startsWith('//')) {
    return href;
  }

  const cut = address.search(/[?#]/);
  const tail = cut === -1 ? '' : address.slice(cut);
  const written = cut === -1 ? address : address.slice(0, cut);
  // A browser reads a backslash in a path as a slash, so the request for this
  // address carries another path than the one written here.
  if (written.includes('\\')) return href;
  try {
    const path = lowerLocaleSegment(decodePath(written));
    if (hasDotSegment(path)) return href;
    const segment = localeOfPath(path);
    const rest = stripLocalePrefix(path);
    if (segment && (isHostWidePath(rest) || localeOfPath(rest))) return href;
    if (isHostWidePath(rest)) return `${encodePath(trimTrailingSlashes(rest))}${tail}`;
    if (sitePath(rest) === BRIEFING_PATH) return `${BRIEFING_LANDING}${tail}`;
    return `${encodePath(localizedHref(segment ?? named ?? locale, rest))}${tail}`;
  } catch (error) {
    // A malformed escape: not an address the router reads.
    if (error instanceof URIError) return href;
    throw error;
  }
}

/** The absolute URL of a page in a language. */
export function localizedUrl(locale: Locale, pathname: string): string {
  return `${SITE_ORIGIN}${localizedHref(locale, pathname)}`;
}

/**
 * The hreflang links of a post, from the languages it exists in. `x-default`
 * is the English address, so a post that has no English version has none:
 * pointing it at another language would name that language the default.
 */
export function postAlternateLinks(
  alternates: PostAlternate[] | undefined
): Alternate[] | undefined {
  if (!alternates || alternates.length === 0) return undefined;
  const links: Alternate[] = alternates.map((alt) => ({
    hreflang: alt.locale,
    href: localizedUrl(alt.locale, `/blog/${alt.publicSlug}`)
  }));
  const english = links.find((link) => link.hreflang === 'en');
  return english ? [...links, { hreflang: 'x-default', href: english.href }] : links;
}

export function getAlternates(locale: Locale, pathname: string): Alternate[] | undefined {
  const normalized = sitePath(pathname);
  // eslint-disable-next-line security/detect-object-injection -- normalized is a site path starting with '/', which no inherited property name does
  const mapping = LOCALE_PATH_MAP[normalized];
  if (!mapping) return undefined;

  const pt = `${SITE_ORIGIN}${withLocalePrefix('pt-BR', mapping['pt-BR'])}`;
  const en = `${SITE_ORIGIN}${withLocalePrefix('en', mapping.en)}`;
  return [
    { hreflang: 'pt-BR', href: pt },
    { hreflang: 'en', href: en },
    { hreflang: 'x-default', href: en }
  ];
}
