import type { Handle } from '@sveltejs/kit';

/**
 * Emit conservative cache headers on public HTML responses so the future RBX
 * edge / reverse-proxy layer (ADR-0002, Phase 4+) can serve cached content off
 * the origin. The in-process Content Gateway already bounds staleness through
 * its TTL + stale-while-revalidate cache, so a short max-age keeps the
 * publish→live window within the configured TTL.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  if (event.request.method === 'GET' && response.status === 200) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      response.headers.set(
        'Cache-Control',
        'public, max-age=60, stale-while-revalidate=300'
      );
    }
  }

  return response;
};
