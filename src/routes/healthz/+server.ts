import type { RequestHandler } from './$types';

// Cheap liveness/readiness probe target (does not render a page).
export const GET: RequestHandler = () =>
  new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } });
