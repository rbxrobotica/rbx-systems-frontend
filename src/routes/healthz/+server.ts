import type { RequestHandler } from './$types';

// Trailing slashes are dropped by the handle hook, not by the router.
export const trailingSlash = 'ignore';

// Cheap liveness/readiness probe target (does not render a page).
export const GET: RequestHandler = () =>
  new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } });
