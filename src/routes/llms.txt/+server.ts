import type { RequestHandler } from '@sveltejs/kit';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { t } from '$lib/i18n/translate';
import { SERVICE_ROUTES, servicePublicPath } from '$lib/services/catalog';
import {
  formatPartnershipPrice,
  partnershipTerms,
  partnershipContent
} from '$lib/content/partnership';
import type { Locale } from '$types/content';

const siteUrlByLocale: Record<Locale, string> = {
  'pt-BR': 'https://rbx.ia.br',
  en: 'https://rbxsystems.ch'
};

const servicesByLocale = (locale: Locale) =>
  SERVICE_ROUTES.map((service) => ({
    key: service.key,
    path: servicePublicPath(locale, service)
  }));

const institutionalByLocale: Record<Locale, { label: string; path: string; note: string }[]> = {
  'pt-BR': [
    { label: 'Sobre', path: '/sobre', note: 'quem é a RBX Systems' },
    { label: 'História', path: '/historia', note: 'trajetória da RBX Systems' },
    { label: 'Carreiras', path: '/carreiras', note: 'como trabalhar com a RBX Systems' },
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
    { label: 'History', path: '/history', note: 'the RBX Systems trajectory' },
    { label: 'Careers', path: '/careers', note: 'how to work with RBX Systems' },
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
  Record<'services' | 'partnership' | 'products' | 'institutional' | 'journal', string>
> = {
  'pt-BR': {
    services: 'Serviços',
    partnership: 'Parceria de engenharia',
    products: 'Produtos',
    institutional: 'Institucional',
    journal: 'Journal'
  },
  en: {
    services: 'Services',
    partnership: 'Engineering partnership',
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

  const serviceLinks = servicesByLocale(locale).map((service) =>
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
          link('Satwake / Briefing BTC', '/produtos/briefing-btc', t(locale, 'briefing.headline'))
        ]
      : [
          link('Robson', '/products/robson', t(locale, 'robson.headline')),
          link('Satwake / Briefing BTC', '/products/briefing-btc', t(locale, 'briefing.headline'))
        ];

  const partnershipLink =
    locale === 'pt-BR'
      ? link(
          'RBX Engineering Partnership',
          '/parceria#qualificacao',
          `${formatPartnershipPrice(locale)}/mês, em reais (BRL), por ${partnershipTerms.monthlyHours} horas mensais de capacidade técnica liderada pelo fundador com assistência de IA para um produto. Implementação, revisão, testes e comunicação assíncrona incluídos nessa capacidade. Infraestrutura e consumo de APIs do cliente têm orçamento separado. A qualificação inicia pelo formulário; escopo, disponibilidade e início são confirmados por uma pessoa da RBX por e-mail. Não é contratação automática. Contextos para avaliação: ${partnershipContent[locale].fitCards.map((card) => card.title).join('; ')}. Condições de referência: ${partnershipTerms.version}.`
        )
      : link(
          'RBX Engineering Partnership',
          '/partnership#qualificacao',
          `${formatPartnershipPrice(locale)}/month, in Brazilian reais (BRL), for ${partnershipTerms.monthlyHours} monthly hours of founder-led technical capacity with AI assistance for one product. Implementation, review, testing and asynchronous communication share that capacity. Infrastructure and the client's API consumption have a separate budget. Qualification starts with the form; an RBX team member confirms scope, availability and start date by email. This is not automatic contracting. Contexts for assessment: ${partnershipContent[locale].fitCards.map((card) => card.title).join('; ')}. Reference terms: ${partnershipTerms.version}.`
        );

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

## ${h.partnership}

${partnershipLink}

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
