import type { RequestHandler } from '@sveltejs/kit';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { loadAllPosts } from '$lib/server/content/gateway';
import { t } from '$lib/i18n/translate';
import type { Locale } from '$types/content';

const siteUrlByLocale: Record<Locale, string> = {
  'pt-BR': 'https://rbx.ia.br',
  en: 'https://rbxsystems.ch'
};

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function rfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

export const GET: RequestHandler = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  const siteUrl = siteUrlByLocale[locale];

  let posts: Awaited<ReturnType<typeof loadAllPosts>> = [];
  try {
    posts = await loadAllPosts(locale);
  } catch {
    // Content gateway unavailable: serve an empty but valid feed instead of a 500.
  }

  const items = posts
    .map((post) => {
      const link = `${siteUrl}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(post.date)}</pubDate>
      <description>${escapeXml(post.excerpt ?? '')}</description>
    </item>`;
    })
    .join('\n');

  const lastBuildDate = posts.length > 0 ? rfc822(posts[0].date) : new Date().toUTCString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/rss-style.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(t(locale, 'journal.metaTitle'))}</title>
    <link>${siteUrl}/journal</link>
    <description>${escapeXml(t(locale, 'journal.metaDescription'))}</description>
    <language>${locale === 'pt-BR' ? 'pt-br' : 'en'}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      // application/xml (not rss+xml) so browsers apply the xml-stylesheet
      // and render the subscribe page; readers accept either type.
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
