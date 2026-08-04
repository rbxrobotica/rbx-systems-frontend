import type { RequestHandler } from '@sveltejs/kit';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { Locale } from '$types/content';

const siteUrlByLocale: Record<Locale, string> = {
  'pt-BR': 'https://rbx.ia.br',
  en: 'https://rbxsystems.ch'
};

export const GET: RequestHandler = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  const siteUrl = siteUrlByLocale[locale];

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
Disallow: /atelier

# Avoid parameter variants being indexed
Disallow: /blog/*?*
Disallow: /solucoes/*?*
Disallow: /produtos/*?*
Disallow: /servicos/*?*

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
