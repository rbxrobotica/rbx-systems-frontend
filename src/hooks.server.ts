import type { Handle } from '@sveltejs/kit';

/**
 * Emit conservative cache headers on public HTML responses so the future RBX
 * edge / reverse-proxy layer (ADR-0002, Phase 4+) can serve cached content off
 * the origin. The in-process Content Gateway uses a TTL-only cache, so a short
 * max-age keeps the publish→live window within the configured TTL.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const host = event.request.headers.get('host') ?? '';
  const url = new URL(event.request.url);

  // Redirect www → apex (SEO: avoid duplicate content)
  if (host.startsWith('www.')) {
    const apex = host.replace(/^www\./, '');
    url.hostname = apex;
    return new Response(null, {
      status: 301,
      headers: { Location: url.toString() }
    });
  }

  const response = await resolve(event);

  if (event.request.method === 'GET' && response.status === 200) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      response.headers.set(
        'Cache-Control',
        'public, max-age=60'
      );
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
