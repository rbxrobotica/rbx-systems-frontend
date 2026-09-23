import type { Handle } from '@sveltejs/kit';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { LOCALE_PATH_MAP } from '$lib/seo/alternates';

/**
 * Legacy URLs from the previous company sites (rbx-site 2023,
 * rbx_frontend_new 2024) that still receive crawler and backlink traffic.
 * Keys are the pt-BR legacy paths; destinations resolve per locale through
 * LOCALE_PATH_MAP (e.g. /aboutus -> /sobre on .ia.br, /about on .ch). Live
 * routes that now exist for real (/about, /history, /careers, /team, ...) are
 * deliberately absent.
 */
const LEGACY_REDIRECTS: Record<string, string> = {
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
 * Emit conservative cache headers on public HTML responses so the future RBX
 * edge / reverse-proxy layer (ADR-0002, Phase 4+) can serve cached content off
 * the origin. The in-process Content Gateway uses a TTL-only cache, so a short
 * max-age keeps the publish→live window within the configured TTL.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const url = new URL(event.request.url);
  const locale = detectLocaleFromUrl(url);

  // Legacy 301 redirects first, preserving the query string. The hostname is
  // also normalized to apex here so www + legacy never causes a double hop.
  const legacyTarget = LEGACY_REDIRECTS[url.pathname.replace(/\/$/, '') || '/'];
  if (legacyTarget) {
    url.hostname = url.hostname.replace(/^www\./, '');
    url.pathname = LOCALE_PATH_MAP[legacyTarget]?.[locale] ?? legacyTarget;
    return new Response(null, {
      status: 301,
      headers: { Location: url.toString() }
    });
  }

  // Redirect www → apex (SEO: avoid duplicate content)
  const host = event.request.headers.get('host') ?? '';
  if (host.startsWith('www.')) {
    const apex = host.replace(/^www\./, '');
    url.hostname = apex;
    return new Response(null, {
      status: 301,
      headers: { Location: url.toString() }
    });
  }

  // The conversion landing moved to its own host (rbx-landing-briefing-btc).
  // Legacy links (W01 campaign posts, chat deep-links, bookmarks) keep their
  // attribution: the query string travels with the redirect.
  if (url.pathname === '/briefing-btc') {
    const landing = new URL('https://briefingbtc.merovelis.com/');
    landing.search = url.search;
    return new Response(null, {
      status: 301,
      headers: { Location: landing.toString() }
    });
  }

  const response = await resolve(event, {
    // app.html ships %sveltekit.lang%; fill it with the host-detected locale.
    transformPageChunk: ({ html }) => html.replaceAll('%sveltekit.lang%', locale)
  });

  if (event.request.method === 'GET' && response.status === 200) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      response.headers.set('Cache-Control', 'public, max-age=60');
    }
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
