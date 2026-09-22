import type { RequestHandler } from '@sveltejs/kit';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { t } from '$lib/i18n/translate';
import type { Locale } from '$types/content';

const siteUrlByLocale: Record<Locale, string> = {
  'pt-BR': 'https://rbx.ia.br',
  en: 'https://rbxsystems.ch'
};

const servicesByLocale: Record<Locale, { key: string; path: string }[]> = {
  'pt-BR': [
    { key: 'aiEngineering', path: '/servicos/engenharia-de-ia' },
    { key: 'llmops', path: '/servicos/llmops' },
    { key: 'aiAgents', path: '/servicos/agentes-de-ia' },
    { key: 'devopsCloud', path: '/servicos/devops-cloud' },
    { key: 'financialSoftware', path: '/servicos/software-financeiro' },
    { key: 'logisticsSoftware', path: '/servicos/software-para-logistica' },
    { key: 'observability', path: '/servicos/observabilidade' }
  ],
  en: [
    { key: 'aiEngineering', path: '/services/ai-engineering' },
    { key: 'llmops', path: '/services/llmops' },
    { key: 'aiAgents', path: '/services/ai-agents' },
    { key: 'devopsCloud', path: '/services/devops-cloud' },
    { key: 'financialSoftware', path: '/services/financial-software' },
    { key: 'logisticsSoftware', path: '/services/logistics-software' },
    { key: 'observability', path: '/services/observability' }
  ]
};

const institutionalByLocale: Record<Locale, { label: string; path: string; note: string }[]> = {
  'pt-BR': [
    { label: 'Sobre', path: '/sobre', note: 'quem é a RBX Systems' },
    { label: 'Equipe', path: '/equipe', note: 'time de engenharia e liderança' },
    {
      label: 'Leandro Damasio',
      path: '/leandro-damasio',
      note: 'fundador e CEO'
    },
    { label: 'Manifesto', path: '/manifesto', note: 'princípios de engenharia' },
    { label: 'Trust', path: '/trust', note: 'segurança, privacidade e conformidade' },
    { label: 'Legal', path: '/legal', note: 'aviso legal' }
  ],
  en: [
    { label: 'About', path: '/about', note: 'who RBX Systems is' },
    { label: 'Team', path: '/team', note: 'engineering and leadership team' },
    {
      label: 'Leandro Damasio',
      path: '/leandro-damasio',
      note: 'founder & CEO'
    },
    { label: 'Manifesto', path: '/manifesto', note: 'engineering principles' },
    { label: 'Trust', path: '/trust', note: 'security, privacy and compliance' },
    { label: 'Legal', path: '/legal', note: 'legal notice' }
  ]
};

const headings: Record<
  Locale,
  Record<'services' | 'products' | 'institutional' | 'journal', string>
> = {
  'pt-BR': {
    services: 'Serviços',
    products: 'Produtos',
    institutional: 'Institucional',
    journal: 'Journal'
  },
  en: {
    services: 'Services',
    products: 'Products',
    institutional: 'Institutional',
    journal: 'Journal'
  }
};

export const GET: RequestHandler = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  const siteUrl = siteUrlByLocale[locale];
  const h = headings[locale];

  const summary =
    locale === 'pt-BR'
      ? 'Engenharia de sistemas, automação operacional, IA aplicada e infraestrutura em nuvem para operações de alta exigência.'
      : 'Systems engineering, operational automation, applied AI and cloud infrastructure for high-demand operations.';

  const link = (label: string, path: string, note: string) =>
    `- [${label}](${siteUrl}${path}): ${note}`;

  const serviceLinks = servicesByLocale[locale].map((service) =>
    link(
      t(locale, `services.${service.key}.headline`),
      service.path,
      t(locale, `services.${service.key}.metaDescription`)
    )
  );

  const productLinks =
    locale === 'pt-BR'
      ? [
          link('Robson', '/produtos/robson', t(locale, 'robson.headline')),
          link('Briefing BTC', '/produtos/briefing-btc', t(locale, 'briefing.headline'))
        ]
      : [
          link('Robson', '/products/robson', t(locale, 'robson.headline')),
          link('Briefing BTC', '/products/briefing-btc', t(locale, 'briefing.headline'))
        ];

  const institutionalLinks = institutionalByLocale[locale].map((page) =>
    link(page.label, page.path, page.note)
  );

  const journalLinks =
    locale === 'pt-BR'
      ? [
          link('RBX Journal', '/journal', t(locale, 'journal.metaDescription')),
          link('RSS do Journal', '/rss.xml', 'feed RSS com todos os artigos')
        ]
      : [
          link('RBX Journal', '/journal', t(locale, 'journal.metaDescription')),
          link('Journal RSS', '/rss.xml', 'RSS feed with every article')
        ];

  const body = `# RBX Systems

> ${summary}

## ${h.services}

${serviceLinks.join('\n')}

## ${h.products}

${productLinks.join('\n')}

## ${h.institutional}

${institutionalLinks.join('\n')}

## ${h.journal}

${journalLinks.join('\n')}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
