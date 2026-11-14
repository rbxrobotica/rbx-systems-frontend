import type { RequestHandler } from '@sveltejs/kit';
import stylesheet from '$lib/server/rss/rss-style.xsl?raw';

// Trailing slashes are dropped by the handle hook, not by the router.
export const trailingSlash = 'ignore';

// Served via an endpoint (not static/) to control the Content-Type: the static
// handler labels .xsl as text/html, and with X-Content-Type-Options: nosniff
// at the edge the browser then refuses to apply the stylesheet to /rss.xml.
export const GET: RequestHandler = () => {
  return new Response(stylesheet, {
    headers: {
      'Content-Type': 'application/xslt+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
