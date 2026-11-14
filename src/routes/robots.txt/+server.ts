import type { RequestHandler } from '@sveltejs/kit';
import { localizedHref, localizedUrl, withLocalePrefix } from '$lib/seo/alternates';
import { SITE_ORIGIN } from '$lib/seo/site';
import type { Locale } from '$types/content';

// Trailing slashes are dropped by the handle hook, not by the router.
export const trailingSlash = 'ignore';

const LOCALES: Locale[] = ['pt-BR', 'en'];

/** One rule per language: a page lives under its locale segment, in its spelling. */
const perLocale = (rule: (href: string) => string, pathname: string) =>
  LOCALES.map((locale) => rule(localizedHref(locale, pathname))).join('\n');

/**
 * One rule per language for the posts. They live under /blog, which is not a
 * page itself (alone it is a retired name of the Journal), so the prefix is
 * written as it is under each segment.
 */
const posts = LOCALES.map((locale) => `Disallow: ${withLocalePrefix(locale, '/blog')}/*?*`).join(
  '\n'
);

// One file for the host. It has no language, so it is served without a
// locale segment and names the pages of both.
export const GET: RequestHandler = async () => {
  const body = `User-agent: *
Allow: /

# Public media proxies must stay crawlable: og:image points at
# /api/blog/cover/ and social crawlers (facebookexternalhit / WhatsApp)
# honor robots.txt for image fetches. More-specific Allow beats the
# broader Disallow below.
Allow: /api/blog/cover/
Allow: /api/assets/

# Private / internal surfaces
Disallow: /api/
Disallow: /console
Disallow: /app
Disallow: /admin
Disallow: /staging
Disallow: /healthz
${perLocale((href) => `Disallow: ${href}`, '/atelier')}

# Avoid parameter variants being indexed
${posts}
${perLocale((href) => `Disallow: ${href}/*?*`, '/solucoes')}
${perLocale((href) => `Disallow: ${href}/*?*`, '/produtos')}
${perLocale((href) => `Disallow: ${href}/*?*`, '/servicos')}

# LLM-readable site index available at ${SITE_ORIGIN}/llms.txt
# and, in Portuguese, at ${localizedUrl('pt-BR', '/llms.txt')}

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
