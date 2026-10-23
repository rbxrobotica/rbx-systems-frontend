import type { RequestHandler } from './$types';
import html from '$lib/server/studies/criminalidade-sp.html?raw';

// A self-contained academic snapshot: no external requests or server-side state.
export const GET: RequestHandler = () =>
  new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Content-Security-Policy': "default-src 'none'; script-src 'sha256-bRD/wzhAOsv0ayGEq7xA2w2sVXfkopesTz6sWCaAHE4='; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
      'X-PI-IV-Release': '0754ddfe1288'
    }
  });
