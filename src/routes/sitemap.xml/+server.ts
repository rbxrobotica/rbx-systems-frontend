import type { RequestHandler } from '@sveltejs/kit';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { Locale } from '$types/content';

interface SitemapEntry {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}

const entriesByLocale: Record<Locale, SitemapEntry[]> = {
  'pt-BR': [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/sobre', changefreq: 'monthly', priority: '0.9' },
    { path: '/leandro-damasio', changefreq: 'monthly', priority: '0.9' },
    { path: '/solucoes', changefreq: 'weekly', priority: '0.9' },
    { path: '/produtos', changefreq: 'weekly', priority: '0.9' },
    { path: '/parceria', changefreq: 'monthly', priority: '0.9' },
    { path: '/diagnostico', changefreq: 'monthly', priority: '0.9' },
    { path: '/produtos/robson', changefreq: 'monthly', priority: '0.8' },
    { path: '/produtos/briefing-btc', changefreq: 'monthly', priority: '0.8' },
    { path: '/servicos/engenharia-de-ia', changefreq: 'monthly', priority: '0.8' },
    { path: '/servicos/llmops', changefreq: 'monthly', priority: '0.8' },
    { path: '/servicos/agentes-de-ia', changefreq: 'monthly', priority: '0.8' },
    { path: '/servicos/devops-cloud', changefreq: 'monthly', priority: '0.8' },
    { path: '/servicos/software-financeiro', changefreq: 'monthly', priority: '0.8' },
    { path: '/servicos/software-para-logistica', changefreq: 'monthly', priority: '0.8' },
    { path: '/servicos/observabilidade', changefreq: 'monthly', priority: '0.8' },
    { path: '/journal', changefreq: 'weekly', priority: '0.8' },
    { path: '/cases', changefreq: 'weekly', priority: '0.8' },
    { path: '/newsroom', changefreq: 'weekly', priority: '0.7' },
    { path: '/changelog', changefreq: 'weekly', priority: '0.7' },
    { path: '/contato', changefreq: 'monthly', priority: '0.7' }
  ],
  en: [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/about', changefreq: 'monthly', priority: '0.9' },
    { path: '/leandro-damasio', changefreq: 'monthly', priority: '0.9' },
    { path: '/solutions', changefreq: 'weekly', priority: '0.9' },
    { path: '/products', changefreq: 'weekly', priority: '0.9' },
    { path: '/partnership', changefreq: 'monthly', priority: '0.9' },
    { path: '/diagnostic', changefreq: 'monthly', priority: '0.9' },
    { path: '/products/robson', changefreq: 'monthly', priority: '0.8' },
    { path: '/products/briefing-btc', changefreq: 'monthly', priority: '0.8' },
    { path: '/services/ai-engineering', changefreq: 'monthly', priority: '0.8' },
    { path: '/services/llmops', changefreq: 'monthly', priority: '0.8' },
    { path: '/services/ai-agents', changefreq: 'monthly', priority: '0.8' },
    { path: '/services/devops-cloud', changefreq: 'monthly', priority: '0.8' },
    { path: '/services/financial-software', changefreq: 'monthly', priority: '0.8' },
    { path: '/services/logistics-software', changefreq: 'monthly', priority: '0.8' },
    { path: '/services/observability', changefreq: 'monthly', priority: '0.8' },
    { path: '/journal', changefreq: 'weekly', priority: '0.8' },
    { path: '/cases', changefreq: 'weekly', priority: '0.8' },
    { path: '/newsroom', changefreq: 'weekly', priority: '0.7' },
    { path: '/changelog', changefreq: 'weekly', priority: '0.7' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7' }
  ]
};

const siteUrlByLocale: Record<Locale, string> = {
  'pt-BR': 'https://rbx.ia.br',
  en: 'https://rbxsystems.ch'
};

export const GET: RequestHandler = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  const siteUrl = siteUrlByLocale[locale];
  const entries = entriesByLocale[locale];
  const today = new Date().toISOString().split('T')[0];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${siteUrl}${entry.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
