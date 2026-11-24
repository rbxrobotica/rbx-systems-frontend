/**
 * Every redirect this application decides before it renders anything, as one
 * pure function of the request, so the whole table can be tested without a
 * server.
 *
 * Four kinds of request are redirected:
 *
 * 1. A request for one of the two earlier hosts. Each path goes, in one hop,
 *    to the same page on the site host: rbx.ia.br/sobre to /pt-br/sobre,
 *    rbxsystems.ch/sobre to /en/about. The host names the language.
 * 2. A page path without a locale segment on the site host. A spelling that
 *    belongs to one language goes to that language (/sobre to /pt-br/sobre);
 *    any other is negotiated from Accept-Language, English when nothing
 *    matches (/ to /en, /journal to /pt-br/journal for a Portuguese browser).
 * 3. A path under a locale segment that names its page in an earlier way or
 *    in the spelling of the other language (/en/sobre to /en/about,
 *    /en/journal/tag/risco to /en/journal/tag/risk).
 * 4. A path that is not written the one way an address is written: a
 *    trailing slash, the segment in another case, a character escaped that
 *    needs no escape (/en/about/, /EN/about, /en/%61bout).
 *
 * Whatever applies is applied together: the answer is the final address,
 * never a step towards it. One thing this function does not know is which
 * slug a post has in a language (see `livePath`). The handle hook completes
 * a redirect that lands on a post with that slug, from the post lists, so
 * that such a request also takes one hop.
 *
 * Three things are decided before this function is called. The adapter
 * serves a static file that exists, on any host, without asking the
 * application. The router would redirect a trailing slash on its own, before
 * the hook; every route declares `trailingSlash = 'ignore'` so that it does
 * not, and the slash is dropped here, in the same hop as the rest. And the
 * framework refuses a form submitted from another origin with 403: such a
 * request is never redirected (`csrf` in svelte.config.js).
 *
 * The health probe is never redirected, on any host.
 */
import type { Locale } from '$types/content';
import {
  DEFAULT_LOCALE,
  decodePath,
  encodePath,
  hasDotSegment,
  isHostWidePath,
  localeOfPath,
  lowerLocaleSegment,
  stripLocalePrefix,
  trimTrailingSlashes
} from '$lib/i18n/locale';
import { localeOfSpelling, spelledPath, withLocalePrefix } from './alternates';
import {
  BRIEFING_LANDING,
  BRIEFING_PATH,
  LEGACY_HOST_LOCALE,
  SITE_HOST,
  SITE_ORIGIN
} from './site';

/**
 * Files that depend on the language. Under a locale segment each is the file
 * of that language. Without one, on the site host, /sitemap.xml is the index
 * of the two sitemaps and /llms.txt is the English file, at the address the
 * convention expects.
 */
const LOCALE_FILES = new Set(['/sitemap.xml', '/rss.xml', '/llms.txt']);
const ROOT_FILES = new Set(['/sitemap.xml', '/llms.txt']);

export interface RedirectInput {
  /**
   * The names the request itself carries for its host: the forwarded host
   * and the Host header.
   */
  hosts: (string | null | undefined)[];
  /**
   * The host of the request URL. Behind the ingress it is the fixed ORIGIN of
   * the deployment, so it does not say which name the visitor asked for and
   * is read only when the request carries no known name.
   */
  urlHost?: string | null;
  method: string;
  pathname: string;
  /** The query string with its question mark, or empty. */
  search: string;
  acceptLanguage?: string | null;
}

export interface RedirectTarget {
  status: 301 | 302 | 307 | 308;
  /** Absolute when the host changes, a path on the same host otherwise. */
  location: string;
  /** The answer was chosen from Accept-Language. */
  negotiated: boolean;
}

/** A host name as sent: first of a forwarded list, lower case, no port. */
function hostName(value: string | null | undefined): string {
  return (value ?? '').split(',')[0].trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

type NamedHost = { legacy: Locale } | { www: boolean };

/**
 * Which host the request is for.
 *
 * The names the request carries are read first, and among them the site host
 * wins: a request is one for an earlier host only when none of its own names
 * is the site host. The host of the URL is read last. Any other name (a pod
 * address, a preview, localhost) says nothing, and a request with no known
 * name at all is treated as one for the site host.
 *
 * Two things follow. A deployment whose ORIGIN is still an earlier host
 * serves the site host when it is asked for it, instead of redirecting it to
 * itself without end. And a forwarded-host header that names an earlier host
 * cannot turn a request for the site host into a redirect to the address it
 * already has, which a cache in front could then store.
 */
function namedHost(input: RedirectInput): NamedHost {
  const sent = input.hosts.map(hostName);
  if (sent.includes(SITE_HOST)) return { www: false };
  if (sent.includes(`www.${SITE_HOST}`)) return { www: true };
  for (const name of [...sent, hostName(input.urlHost)]) {
    const bare = name.replace(/^www\./, '');
    // eslint-disable-next-line security/detect-object-injection -- guarded by Object.hasOwn on a table of two host names
    if (Object.hasOwn(LEGACY_HOST_LOCALE, bare)) return { legacy: LEGACY_HOST_LOCALE[bare] };
  }
  return { www: false };
}

/**
 * The language a browser asks for: the first of its Accept-Language ranges,
 * by weight, that is Portuguese or English, and English when none is.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  const ranges = (acceptLanguage ?? '')
    .split(',', 32)
    .map((part, index) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const weight = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
      const q = weight === undefined ? 1 : Number(weight.slice(2));
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((range) => range.tag !== '' && range.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of ranges) {
    if (tag === 'pt' || tag.startsWith('pt-')) return 'pt-BR';
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
  }
  return DEFAULT_LOCALE;
}

/** The href of a page path in a language: where the page lives, spelled, under the segment. */
function pageHref(locale: Locale, path: string): string {
  return withLocalePrefix(locale, spelledPath(locale, path));
}

export function resolveRedirect(input: RedirectInput): RedirectTarget | undefined {
  try {
    return resolve(input);
  } catch (error) {
    // A malformed escape: the router answers 400 to it.
    if (error instanceof URIError) return undefined;
    throw error;
  }
}

function resolve(input: RedirectInput): RedirectTarget | undefined {
  const { search } = input;
  // A liveness probe that is redirected fails, and the pod is restarted.
  if (input.pathname === '/healthz') return undefined;

  // The router matches a path decoded, so one page could be asked for under
  // many spellings of its escapes. The path is read here the way the router
  // reads it and written back in one way only.
  const decoded = decodePath(input.pathname);
  if (hasDotSegment(decoded)) return undefined;

  const safe = input.method === 'GET' || input.method === 'HEAD';
  // 301 and 302 let a client turn a POST into a GET; 308 and 307 do not.
  const moved = (location: string): RedirectTarget => ({
    status: safe ? 301 : 308,
    location,
    negotiated: false
  });

  const pathname = lowerLocaleSegment(decoded);
  // The whole path and the part after the locale segment, without a trailing slash.
  const whole = trimTrailingSlashes(pathname);
  const segment = localeOfPath(pathname);
  const rest = stripLocalePrefix(pathname);
  const path = trimTrailingSlashes(rest);
  // A second locale segment names no page. Like a host-wide path under a
  // segment, it keeps its address and the router answers 404.
  const unroutable =
    isHostWidePath(rest) || (segment !== undefined && localeOfPath(rest) !== undefined);

  if (path === BRIEFING_PATH) return moved(`${BRIEFING_LANDING}${search}`);

  const host = namedHost(input);
  if ('legacy' in host) {
    const locale = segment ?? host.legacy;
    if (unroutable) return moved(`${SITE_ORIGIN}${encodePath(whole)}${search}`);
    if (LOCALE_FILES.has(path)) {
      return moved(`${SITE_ORIGIN}${withLocalePrefix(locale, path)}${search}`);
    }
    return moved(`${SITE_ORIGIN}${encodePath(pageHref(locale, path))}${search}`);
  }

  // The www name of the site host goes to the bare name, in the same hop as
  // any change of path. Any other host (a pod address, a preview) is left
  // alone and gets a path-only Location.
  const { www } = host;
  const origin = www ? SITE_ORIGIN : '';

  // Where the request belongs on the site host. The same as asked means served.
  let target = whole;
  if (unroutable) {
    // Served as it is when it is host-wide, and a 404 under a locale segment.
  } else if (segment) {
    target = pageHref(segment, path);
  } else if (!ROOT_FILES.has(path)) {
    // A page path without a locale segment is never served.
    const spelling = localeOfSpelling(path);
    if (spelling) return moved(`${origin}${encodePath(pageHref(spelling, path))}${search}`);
    return {
      status: safe ? 302 : 307,
      location: `${origin}${encodePath(pageHref(negotiateLocale(input.acceptLanguage), path))}${search}`,
      negotiated: true
    };
  }

  const written = encodePath(target);
  if (written === input.pathname && !www) return undefined;
  return moved(`${origin}${written}${search}`);
}
