import type { Locale } from '$types/content';

/**
 * The language of a request is the first segment of its path: /pt-br/... or
 * /en/.... A path without that segment has no language of its own; the server
 * redirects it (see `$lib/seo/redirects`) and the few routes that are served
 * without a prefix (robots.txt, the sitemap index, the API) fall back to
 * DEFAULT_LOCALE.
 */
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_PREFIX: Record<Locale, string> = { 'pt-BR': '/pt-br', en: '/en' };

const PREFIXES: [prefix: string, locale: Locale][] = [
  ['/pt-br', 'pt-BR'],
  ['/en', 'en']
];

/** The locale a path names in its first segment, if it names one. */
export function localeOfPath(pathname: string): Locale | undefined {
  for (const [prefix, locale] of PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return locale;
  }
  return undefined;
}

/**
 * A path without its trailing slashes; the root stays `/`. A loop and not a
 * pattern: the path comes from the request, and this takes one pass whatever
 * it holds.
 */
export function trimTrailingSlashes(pathname: string): string {
  let end = pathname.length;
  while (end > 1 && pathname.charCodeAt(end - 1) === 47) end -= 1;
  return pathname.slice(0, end) || '/';
}

/**
 * A path as the router reads it: an escape of a character that needs none is
 * undone, an escape of a reserved character stays. Throws URIError on a
 * malformed escape, as the router does.
 */
export function decodePath(pathname: string): string {
  return pathname.split('%25').map(decodeURI).join('%25');
}

/** The one way a decoded path is written in an address. Throws URIError on a lone surrogate. */
export function encodePath(path: string): string {
  return path
    .split('%25')
    .map((part) => encodeURI(part).replace(/%25([0-9A-Fa-f]{2})/g, '%$1'))
    .join('%25');
}

/** A `.` or `..` segment. A parsed URL never has one; a path that does is not ours to rewrite. */
export function hasDotSegment(path: string): boolean {
  return path.split('/').some((segment) => segment === '.' || segment === '..');
}

/**
 * The locale segment is lower case. /pt-BR/sobre is read as /pt-br/sobre,
 * which is how the locale is usually written.
 */
export function lowerLocaleSegment(pathname: string): string {
  const end = pathname.indexOf('/', 1);
  const first = end === -1 ? pathname : pathname.slice(0, end);
  const lower = first.toLowerCase();
  if (lower === first || localeOfPath(lower) === undefined) return pathname;
  return `${lower}${pathname.slice(first.length)}`;
}

/** The path without its locale segment: /en/about is /about, /pt-br is /. */
export function stripLocalePrefix(pathname: string): string {
  for (const [prefix] of PREFIXES) {
    if (pathname === prefix) return '/';
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname;
}

/**
 * Paths that belong to the host and not to a language: the API, the build
 * assets, the health probe, two files, the standalone study and the static
 * files. They are served without a locale segment and do not exist under one.
 * Every top-level entry of `static/` must be listed here, and no page may
 * live at one of these paths: under a locale segment they match no route.
 */
const HOST_WIDE_ROOTS = [
  '/api',
  '/_app',
  '/healthz',
  '/robots.txt',
  '/rss-style.xsl',
  '/estudos',
  '/brand',
  '/favicon.svg',
  '/products/evidence'
];

export function isHostWidePath(pathname: string): boolean {
  return HOST_WIDE_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

export function detectLocaleFromUrl(url: URL): Locale {
  return localeOfPath(url.pathname) ?? DEFAULT_LOCALE;
}
