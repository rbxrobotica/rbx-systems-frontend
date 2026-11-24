import type { Handle } from '@sveltejs/kit';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { resolveRedirect } from '$lib/seo/redirects';
import { SITE_ORIGIN } from '$lib/seo/site';
import { cachedPublicPostSlug } from '$lib/server/content/gateway';
import { withStorageBudget } from '$lib/server/content/request-budget';

const POST_ADDRESS = /^\/(pt-br|en)\/blog\/([a-z0-9-]+)$/;

// A browser stores a permanent redirect without limit unless it is bounded:
// one hour keeps a wrong mapping correctable.
const PERMANENT_REDIRECT_CACHE = 'public, max-age=3600';

/**
 * A redirect that lands on a post is completed with the slug the post has in
 * that language. The slug may differ per language (`slugAlias`), and an
 * earlier host was also asked for a post by its storage slug or by the slug
 * of the other language; left to the loader of the post, that would be a
 * second hop.
 *
 * The slug comes from the post lists that are already in memory, and only
 * from them. A redirect reads nothing from storage, waits for nothing and
 * leaves nothing pending, whatever storage is doing. When the lists are not
 * in memory yet (a pod that has served no post and no Journal page since it
 * started), the redirect goes out as it was decided and the loader of the
 * post, which reads the lists, redirects from there: two hops, once.
 */
function toPublicPostSlug(location: string): string {
  const origin = location.startsWith(SITE_ORIGIN) ? SITE_ORIGIN : '';
  const cut = location.indexOf('?', origin.length);
  const pathname = location.slice(origin.length, cut === -1 ? undefined : cut);
  const post = POST_ADDRESS.exec(pathname);
  if (!post) return location;
  const [, segment, slug] = post;
  const publicSlug = cachedPublicPostSlug(slug, segment === 'en' ? 'en' : 'pt-BR');
  if (!publicSlug || publicSlug === slug) return location;
  return `${origin}/${segment}/blog/${publicSlug}${cut === -1 ? '' : location.slice(cut)}`;
}

/**
 * Redirects first (see `$lib/seo/redirects`): the two earlier hosts, page
 * paths without a locale segment, earlier names of a page, an address that is
 * not written the one way, and the www name. Each goes to the final address
 * in one hop and keeps the query string. A form submitted from another origin
 * does not get here: the framework answers it with 403 first.
 *
 * Then emit conservative cache headers on public HTML responses so the future
 * RBX edge / reverse-proxy layer (ADR-0002, Phase 4+) can serve cached content
 * off the origin. The in-process Content Gateway uses a TTL-only cache, so a
 * short max-age keeps the publish→live window within the configured TTL.
 */
export const handle: Handle = async ({ event, resolve }) => {
  // event.url, not request.url: on a data request it is the address of the
  // page, so a client-side navigation is redirected like a full one.
  const { url, request } = event;

  const redirect = resolveRedirect({
    hosts: [request.headers.get('x-forwarded-host'), request.headers.get('host')],
    urlHost: url.hostname,
    method: request.method,
    pathname: url.pathname,
    search: url.search,
    acceptLanguage: request.headers.get('accept-language')
  });
  if (redirect) {
    const location = toPublicPostSlug(redirect.location);
    return new Response(null, {
      status: redirect.status,
      headers: {
        Location: location,
        // A negotiated answer depends on the browser and is not stored.
        ...(redirect.negotiated
          ? { Vary: 'Accept-Language', 'Cache-Control': 'private, no-store' }
          : { 'Cache-Control': PERMANENT_REDIRECT_CACHE })
      }
    });
  }

  const locale = detectLocaleFromUrl(url);

  // Each handled request is one storage request budget operation (guardrail
  // 1.1). The route id, not the path, names it: bounded and never user-authored.
  const response = await withStorageBudget(
    `${event.request.method} ${event.route.id ?? 'unmatched'}`,
    async () =>
      resolve(event, {
        // app.html ships %sveltekit.lang%; fill it with the locale of the path.
        transformPageChunk: ({ html }) => html.replaceAll('%sveltekit.lang%', locale)
      })
  );

  if (event.request.method === 'GET' && response.status === 200) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      response.headers.set('Cache-Control', 'public, max-age=60');
    }
  }

  // A permanent redirect a route sends on its own (the loader of a post asked
  // for by another slug, of a tag asked for by an alias) is bounded like the
  // ones decided above.
  if (
    (response.status === 301 || response.status === 308) &&
    !response.headers.has('Cache-Control')
  ) {
    response.headers.set('Cache-Control', PERMANENT_REDIRECT_CACHE);
  }

  // Security headers (safe, reversible)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS: intentionally disabled by default. Enable only after explicit operator
  // authorization and confirming all subdomains serve HTTPS.
  // response.headers.set(
  //   'Strict-Transport-Security',
  //   'max-age=63072000; includeSubDomains; preload'
  // );

  return response;
};
