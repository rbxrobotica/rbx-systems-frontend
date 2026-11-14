/**
 * JSON-LD schema generators for RBX Systems public pages.
 * All IDs are canonical and stable; they should match the canonical URL
 * of the page where they are embedded.
 *
 * Both languages live on one host, so the organization, the site and each
 * person have one id each, the same in both languages. What a node says in a
 * language (description, job title, the address of a page) differs per page.
 */
import type { Locale } from '$types/content';
import { localizedUrl } from './alternates';
import { SITE_ORIGIN } from './site';

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

const ORG_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const PERSON_ID = `${SITE_ORIGIN}/#leandro-damasio`;

// Other places that identify the organization. The two earlier hosts are not
// among them: they redirect here.
const ORG_SAME_AS = [
  'https://github.com/rbxrobotica',
  'https://www.linkedin.com/in/ldamasio/',
  'https://strategos.gr'
];

export function organizationSchema(locale: Locale = 'pt-BR'): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: RBX_NAME,
    alternateName: RBX_ALTERNATE_NAMES,
    // The home page in the language of the page: the root itself answers
    // with a redirect, and an address in structured data is one that is served.
    url: localizedUrl(locale, '/'),
    logo: `${SITE_ORIGIN}${RBX_LOGO}`,
    sameAs: ORG_SAME_AS,
    founder: { '@id': PERSON_ID },
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
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: LEANDRO_NAME,
    jobTitle: locale === 'pt-BR' ? LEANDRO_JOB_TITLE_PT : LEANDRO_JOB_TITLE_EN,
    url: localizedUrl(locale, '/leandro-damasio'),
    sameAs: [LEANDRO_LINKEDIN, LEANDRO_GITHUB],
    worksFor: { '@id': ORG_ID },
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
 * follows the same site-level fragment convention as personSchema: one stable
 * entity id per person, the same in both languages.
 */
export function personSchemaFor(
  locale: Locale,
  slug: string,
  name: string,
  jobTitle: string,
  sameAs: string[] = []
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${SITE_ORIGIN}/#${slug}`,
    name,
    jobTitle,
    url: localizedUrl(locale, `/${slug}`),
    worksFor: { '@id': ORG_ID }
  };
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }
  return schema;
}

/**
 * The one site, in its two languages. The node is the same on every page;
 * its address is the English home page, the default of the site, because the
 * root answers with a redirect.
 */
export function websiteSchema(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: RBX_NAME,
    url: localizedUrl('en', '/'),
    publisher: { '@id': ORG_ID },
    inLanguage: ['pt-BR', 'en']
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
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: locale === 'pt-BR' ? 'pt-BR' : 'en'
  };
  if (aboutId) {
    schema.about = { '@id': aboutId };
  }
  return schema;
}

export function serviceSchema(
  pageUrl: string,
  serviceName: string,
  description: string
): Record<string, unknown> {
  return {
    '@type': 'Service',
    '@id': `${pageUrl}#service`,
    serviceType: serviceName,
    provider: { '@id': ORG_ID },
    areaServed: 'Worldwide',
    description,
    url: pageUrl
  };
}

export function softwareApplicationSchema(
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
    provider: { '@id': ORG_ID },
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
      '@id': isLeandro ? PERSON_ID : ORG_ID,
      name: authorName
    },
    publisher: { '@id': ORG_ID },
    datePublished: post.date,
    dateModified: post.date,
    image: post.cover ? `${SITE_ORIGIN}${post.cover}` : undefined,
    url: pageUrl,
    inLanguage: locale === 'pt-BR' ? 'pt-BR' : 'en',
    articleSection: 'Journal'
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Path on the site, with its locale segment (e.g. '/en/journal'). */
  path: string;
}

/**
 * BreadcrumbList for a page. Every item, including the current page, carries
 * its absolute URL; the item paths must be real URLs on the site.
 */
export function breadcrumbSchema(
  pageUrl: string,
  items: BreadcrumbItem[]
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_ORIGIN}${item.path}`
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
    isPartOf: { '@id': WEBSITE_ID },
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
    websiteSchema(),
    webPageSchema(locale, pageUrl, title, description, aboutId),
    ...nodes
  ];
  return {
    '@context': 'https://schema.org',
    '@graph': graph
  };
}

/**
 * Serialize a JSON-LD document for inlining in a `<script>` element.
 * `JSON.stringify` leaves "<" untouched, so a value containing `</script>`
 * would close the element and the rest would be parsed as HTML. `\u003c` is
 * the same character to a JSON parser and inert to the HTML parser.
 */
export function serializeJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify({ '@context': 'https://schema.org', ...schema }).replace(/</g, '\\u003c');
}
