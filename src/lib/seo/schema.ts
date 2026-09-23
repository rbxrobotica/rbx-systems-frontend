/**
 * JSON-LD schema generators for RBX Systems public pages.
 * All IDs are canonical and stable; they should match the canonical URL
 * of the page where they are embedded.
 */
import type { Locale } from '$types/content';

const RBX_NAME = 'RBX Systems';
const RBX_ALTERNATE_NAMES = ['RBX', 'RBX Robótica'];
const RBX_LOGO = '/brand/rbx-mark.svg';
const RBX_DESCRIPTION_PT =
  'Engenharia de sistemas, automação operacional, IA aplicada e infraestrutura em nuvem para operações de alta exigência.';
const RBX_DESCRIPTION_EN =
  'Systems engineering, operational automation, applied AI and cloud infrastructure for high-demand operations.';

const LEANDRO_NAME = 'Leandro Damasio';
const LEANDRO_JOB_TITLE_PT = 'Fundador e CEO, RBX Systems';
const LEANDRO_JOB_TITLE_EN = 'Founder & CEO, RBX Systems';
const LEANDRO_LINKEDIN = 'https://www.linkedin.com/in/ldamasio/';
const LEANDRO_GITHUB = 'https://github.com/ldamasio';

const ORG_ID_PT = 'https://rbx.ia.br/#organization';
const ORG_ID_EN = 'https://rbxsystems.ch/#organization';
const WEBSITE_ID_PT = 'https://rbx.ia.br/#website';
const WEBSITE_ID_EN = 'https://rbxsystems.ch/#website';
const PERSON_ID_PT = 'https://rbx.ia.br/#leandro-damasio';
const PERSON_ID_EN = 'https://rbxsystems.ch/#leandro-damasio';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function orgSameAs(locale: Locale): string[] {
  const sameAs = [
    'https://github.com/rbxrobotica',
    'https://www.linkedin.com/in/ldamasio/',
    'https://rbx.ia.br',
    'https://rbxsystems.ch',
    'https://merovelis.com',
    'https://strategos.gr'
  ];
  return sameAs;
}

function orgId(locale: Locale): string {
  return locale === 'pt-BR' ? ORG_ID_PT : ORG_ID_EN;
}

function websiteId(locale: Locale): string {
  return locale === 'pt-BR' ? WEBSITE_ID_PT : WEBSITE_ID_EN;
}

function personId(locale: Locale): string {
  return locale === 'pt-BR' ? PERSON_ID_PT : PERSON_ID_EN;
}

function siteUrl(locale: Locale): string {
  return locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch';
}

export function organizationSchema(locale: Locale = 'pt-BR'): Record<string, unknown> {
  const url = siteUrl(locale);
  return {
    '@type': 'Organization',
    '@id': orgId(locale),
    name: RBX_NAME,
    alternateName: RBX_ALTERNATE_NAMES,
    url,
    logo: `${url}${RBX_LOGO}`,
    sameAs: orgSameAs(locale),
    founder: { '@id': personId(locale) },
    description: locale === 'pt-BR' ? RBX_DESCRIPTION_PT : RBX_DESCRIPTION_EN,
    areaServed: 'Worldwide',
    knowsAbout: [
      'AI Engineering',
      'LLMOps',
      'Agentic Systems',
      'DevOps',
      'Cloud Computing',
      'Web Development',
      'Mobile Application Development',
      'Custom Software Development',
      'Technical Consulting',
      'Process Automation',
      'API Integration',
      'Software Maintenance',
      'UX/UI Design',
      'Financial Software',
      'Logistics Software',
      'Observability'
    ]
  };
}

export function personSchema(locale: Locale = 'pt-BR'): Record<string, unknown> {
  const url = siteUrl(locale);
  return {
    '@type': 'Person',
    '@id': personId(locale),
    name: LEANDRO_NAME,
    jobTitle: locale === 'pt-BR' ? LEANDRO_JOB_TITLE_PT : LEANDRO_JOB_TITLE_EN,
    url: `${url}/leandro-damasio`,
    sameAs: [LEANDRO_LINKEDIN, LEANDRO_GITHUB],
    worksFor: { '@id': orgId(locale) },
    knowsAbout: [
      'AI Engineering',
      'LLMOps',
      'Agentic Systems',
      'DevOps',
      'Cloud-Native Systems',
      'Software Architecture',
      'Strategic Decision Systems'
    ]
  };
}

/**
 * Data-driven Person node for team pages other than the founder's. The @id
 * follows the same site-level fragment convention as personSchema, so every
 * locale host mints its own stable entity id.
 */
export function personSchemaFor(
  locale: Locale,
  slug: string,
  name: string,
  jobTitle: string,
  sameAs: string[] = []
): Record<string, unknown> {
  const url = siteUrl(locale);
  const schema: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${url}/#${slug}`,
    name,
    jobTitle,
    url: `${url}/${slug}`,
    worksFor: { '@id': orgId(locale) }
  };
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }
  return schema;
}

export function websiteSchema(locale: Locale = 'pt-BR'): Record<string, unknown> {
  const url = siteUrl(locale);
  return {
    '@type': 'WebSite',
    '@id': websiteId(locale),
    name: RBX_NAME,
    url,
    publisher: { '@id': orgId(locale) },
    inLanguage: locale === 'pt-BR' ? 'pt-BR' : 'en'
  };
}

export function webPageSchema(
  locale: Locale = 'pt-BR',
  pageUrl: string,
  title: string,
  description: string,
  aboutId?: string
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description,
    isPartOf: { '@id': websiteId(locale) },
    inLanguage: locale === 'pt-BR' ? 'pt-BR' : 'en'
  };
  if (aboutId) {
    schema.about = { '@id': aboutId };
  }
  return schema;
}

export function serviceSchema(
  locale: Locale = 'pt-BR',
  pageUrl: string,
  serviceName: string,
  description: string
): Record<string, unknown> {
  return {
    '@type': 'Service',
    '@id': `${pageUrl}#service`,
    serviceType: serviceName,
    provider: { '@id': orgId(locale) },
    areaServed: 'Worldwide',
    description,
    url: pageUrl
  };
}

export function softwareApplicationSchema(
  locale: Locale = 'pt-BR',
  pageUrl: string,
  name: string,
  description: string,
  category = 'BusinessApplication'
): Record<string, unknown> {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${pageUrl}#product`,
    name,
    applicationCategory: category,
    operatingSystem: 'Any',
    description,
    url: pageUrl,
    provider: { '@id': orgId(locale) },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };
}

export function blogPostingSchema(
  locale: Locale = 'pt-BR',
  pageUrl: string,
  post: {
    title: string;
    excerpt: string;
    date: string;
    author?: string;
    authorRole?: string;
    cover?: string;
  }
): Record<string, unknown> {
  const authorName = post.author ?? 'RBX Systems';
  const isLeandro = authorName.toLowerCase().includes('leandro');
  return {
    '@type': 'BlogPosting',
    '@id': `${pageUrl}#article`,
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': isLeandro ? 'Person' : 'Organization',
      '@id': isLeandro ? personId(locale) : orgId(locale),
      name: authorName
    },
    publisher: { '@id': orgId(locale) },
    datePublished: post.date,
    dateModified: post.date,
    image: post.cover ? `${siteUrl(locale)}${post.cover}` : undefined,
    url: pageUrl,
    inLanguage: locale === 'pt-BR' ? 'pt-BR' : 'en',
    articleSection: 'Journal'
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path (e.g. '/journal'); absolutized against the locale host. */
  path: string;
}

/**
 * BreadcrumbList for a page. Every item, including the current page, carries
 * its absolute URL; the item paths must be real URLs on the site.
 */
export function breadcrumbSchema(
  locale: Locale,
  pageUrl: string,
  items: BreadcrumbItem[]
): Record<string, unknown> {
  const base = siteUrl(locale);
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`
    }))
  };
}

/**
 * CollectionPage for listing pages. When the listed entries are known at
 * load time, pass them as items to emit an ItemList as mainEntity.
 */
export function collectionPageSchema(
  locale: Locale,
  pageUrl: string,
  name: string,
  description: string,
  items: { name: string; url: string }[] = []
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#collection`,
    url: pageUrl,
    name,
    description,
    isPartOf: { '@id': websiteId(locale) },
    inLanguage: locale === 'pt-BR' ? 'pt-BR' : 'en'
  };
  if (items.length > 0) {
    schema.mainEntity = {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: item.url,
        name: item.name
      }))
    };
  }
  return schema;
}

/**
 * FAQPage for a page with a visible FAQ section. The questions and answers
 * must be rendered on the page itself; this only mirrors them for crawlers.
 */
export function faqPageSchema(
  pageUrl: string,
  faqs: { question: string; answer: string }[]
): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer }
    }))
  };
}

export function buildGraph(
  locale: Locale,
  pageUrl: string,
  title: string,
  description: string,
  nodes: Record<string, unknown>[] = [],
  aboutId?: string
): Record<string, unknown> {
  const graph = [
    organizationSchema(locale),
    personSchema(locale),
    websiteSchema(locale),
    webPageSchema(locale, pageUrl, title, description, aboutId),
    ...nodes
  ];
  return {
    '@context': 'https://schema.org',
    '@graph': graph
  };
}
