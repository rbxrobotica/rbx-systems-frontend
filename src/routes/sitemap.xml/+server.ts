import type { RequestHandler } from '@sveltejs/kit';
import { localeOfPath } from '$lib/i18n/locale';
import { loadAllPosts } from '$lib/server/content/gateway';
import { authorSlugFor } from '$lib/journal/authors';
import { collectCanonicalTags } from '$lib/journal/tags';
import { localizedUrl } from '$lib/seo/alternates';
import { SERVICE_ROUTES, servicePublicPath } from '$lib/services/catalog';
import type { Locale } from '$types/content';

// Trailing slashes are dropped by the handle hook, not by the router.
export const trailingSlash = 'ignore';

interface SitemapEntry {
  /** Site path without the locale segment, in the spelling of the language. */
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
  // Omitted for static pages: a fabricated lastmod is ignored by Google, so
  // only posts carry one (their frontmatter date).
  lastmod?: string;
  alternates?: { hreflang: string; href: string }[];
}

function serviceEntries(locale: Locale): SitemapEntry[] {
  return SERVICE_ROUTES.map((service) => ({
    path: servicePublicPath(locale, service),
    changefreq: 'monthly',
    priority: '0.8'
  }));
}

const entriesByLocale: Record<Locale, SitemapEntry[]> = {
  'pt-BR': [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/sobre', changefreq: 'monthly', priority: '0.9' },
    { path: '/equipe', changefreq: 'monthly', priority: '0.9' },
    { path: '/leandro-damasio', changefreq: 'monthly', priority: '0.9' },
    { path: '/caue-alencar', changefreq: 'monthly', priority: '0.9' },
    { path: '/flavia-ribeiro', changefreq: 'monthly', priority: '0.9' },
    { path: '/solucoes', changefreq: 'weekly', priority: '0.9' },
    { path: '/produtos', changefreq: 'weekly', priority: '0.9' },
    { path: '/parceria', changefreq: 'monthly', priority: '0.9' },
    { path: '/diagnostico', changefreq: 'monthly', priority: '0.9' },
    { path: '/produtos/robson', changefreq: 'monthly', priority: '0.8' },
    { path: '/produtos/briefing-btc', changefreq: 'monthly', priority: '0.8' },
    ...serviceEntries('pt-BR'),
    { path: '/journal', changefreq: 'weekly', priority: '0.8' },
    { path: '/cases', changefreq: 'weekly', priority: '0.8' },
    { path: '/newsroom', changefreq: 'weekly', priority: '0.7' },
    { path: '/changelog', changefreq: 'weekly', priority: '0.7' },
    { path: '/manifesto', changefreq: 'monthly', priority: '0.6' },
    { path: '/historia', changefreq: 'monthly', priority: '0.6' },
    { path: '/contato', changefreq: 'monthly', priority: '0.7' },
    { path: '/trust', changefreq: 'monthly', priority: '0.6' },
    { path: '/carreiras', changefreq: 'monthly', priority: '0.5' },
    { path: '/legal', changefreq: 'monthly', priority: '0.5' }
  ],
  en: [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/about', changefreq: 'monthly', priority: '0.9' },
    { path: '/team', changefreq: 'monthly', priority: '0.9' },
    { path: '/leandro-damasio', changefreq: 'monthly', priority: '0.9' },
    { path: '/caue-alencar', changefreq: 'monthly', priority: '0.9' },
    { path: '/flavia-ribeiro', changefreq: 'monthly', priority: '0.9' },
    { path: '/solutions', changefreq: 'weekly', priority: '0.9' },
    { path: '/products', changefreq: 'weekly', priority: '0.9' },
    { path: '/partnership', changefreq: 'monthly', priority: '0.9' },
    { path: '/diagnostic', changefreq: 'monthly', priority: '0.9' },
    { path: '/products/robson', changefreq: 'monthly', priority: '0.8' },
    { path: '/products/briefing-btc', changefreq: 'monthly', priority: '0.8' },
    ...serviceEntries('en'),
    { path: '/journal', changefreq: 'weekly', priority: '0.8' },
    { path: '/cases', changefreq: 'weekly', priority: '0.8' },
    { path: '/newsroom', changefreq: 'weekly', priority: '0.7' },
    { path: '/changelog', changefreq: 'weekly', priority: '0.7' },
    { path: '/manifesto', changefreq: 'monthly', priority: '0.6' },
    { path: '/history', changefreq: 'monthly', priority: '0.6' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    { path: '/trust', changefreq: 'monthly', priority: '0.6' },
    { path: '/careers', changefreq: 'monthly', priority: '0.5' },
    { path: '/legal', changefreq: 'monthly', priority: '0.5' }
  ]
};

const LOCALES: Locale[] = ['pt-BR', 'en'];

const xml = (body: string) =>
  new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });

/**
 * Without a locale segment this is the index of the two sitemaps, the one
 * address robots.txt and Search Console are given. Under a segment it is the
 * sitemap of that language.
 */
export const GET: RequestHandler = async ({ url }) => {
  const locale = localeOfPath(url.pathname);
  if (!locale) {
    return xml(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${LOCALES.map(
  (each) => `  <sitemap>
    <loc>${localizedUrl(each, '/sitemap.xml')}</loc>
  </sitemap>`
).join('\n')}
</sitemapindex>`);
  }
  // eslint-disable-next-line security/detect-object-injection -- locale is 'pt-BR' or 'en', from localeOfPath
  const entries = entriesByLocale[locale];

  let postEntries: SitemapEntry[] = [];
  let taxonomyEntries: SitemapEntry[] = [];
  try {
    const posts = await loadAllPosts(locale);
    // Alternate-locale public slugs for xhtml:link alternates. A failure
    // here degrades to entries without alternates, never to a missing map.
    const otherLocale: Locale = locale === 'pt-BR' ? 'en' : 'pt-BR';
    let otherByCanonical = new Map<string, string>();
    try {
      const otherPosts = await loadAllPosts(otherLocale);
      otherByCanonical = new Map(otherPosts.map((post) => [post.slug, post.publicSlug]));
    } catch {
      // Keep the primary locale's entries.
    }
    postEntries = posts.map((post) => {
      const alternates = [
        { hreflang: locale, href: localizedUrl(locale, `/blog/${post.publicSlug}`) }
      ];
      const otherSlug = otherByCanonical.get(post.slug);
      if (otherSlug) {
        alternates.push({
          hreflang: otherLocale,
          href: localizedUrl(otherLocale, `/blog/${otherSlug}`)
        });
      }
      return {
        path: `/blog/${post.publicSlug}`,
        changefreq: 'monthly' as const,
        priority: '0.6',
        lastmod: post.date || undefined,
        alternates
      };
    });

    // Tag and author listing pages, derived from what the posts actually use.
    const tagEntries: SitemapEntry[] = collectCanonicalTags(posts).map((tag) => ({
      path: `/journal/tag/${tag}`,
      changefreq: 'weekly',
      priority: '0.4'
    }));
    const authorSlugs = [
      ...new Set(
        posts
          .map((post) => authorSlugFor(post.author))
          .filter((slug): slug is string => slug !== null)
      )
    ].sort();
    const authorEntries: SitemapEntry[] = authorSlugs.map((slug) => ({
      path: `/journal/autor/${slug}`,
      changefreq: 'weekly',
      priority: '0.4'
    }));
    taxonomyEntries = [...tagEntries, ...authorEntries];
  } catch {
    // If the post list is unavailable, emit the static sitemap only.
  }

  const allEntries = [...entries, ...postEntries, ...taxonomyEntries];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allEntries
  .map((entry) => {
    const alternateLinks = (entry.alternates ?? [])
      .map(
        (alt) => `\n    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`
      )
      .join('');
    const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
    return `  <url>
    <loc>${localizedUrl(locale, entry.path)}</loc>${alternateLinks}${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return xml(body);
};
