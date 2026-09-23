import type { Locale } from '$types/content';

export interface ServiceRoute {
  key: string;
  storageSlug: string;
  'pt-BR': string;
  en: string;
}

/**
 * Canonical service catalog.
 *
 * Public slugs are localized, while CMS objects keep one stable storage slug
 * across locales. This mirrors the existing S3 layout and prevents translated
 * URLs from becoming content identifiers.
 */
export const SERVICE_ROUTES: ServiceRoute[] = [
  {
    key: 'aiEngineering',
    storageSlug: 'ai-engineering',
    'pt-BR': 'engenharia-de-ia',
    en: 'ai-engineering'
  },
  { key: 'llmops', storageSlug: 'llmops', 'pt-BR': 'llmops', en: 'llmops' },
  {
    key: 'aiAgents',
    storageSlug: 'ai-agents',
    'pt-BR': 'agentes-de-ia',
    en: 'ai-agents'
  },
  {
    key: 'devopsCloud',
    storageSlug: 'devops-cloud',
    'pt-BR': 'devops-cloud',
    en: 'devops-cloud'
  },
  {
    key: 'financialSoftware',
    storageSlug: 'financial-software',
    'pt-BR': 'software-financeiro',
    en: 'financial-software'
  },
  {
    key: 'logisticsSoftware',
    storageSlug: 'logistics-software',
    'pt-BR': 'software-para-logistica',
    en: 'logistics-software'
  },
  {
    key: 'observability',
    storageSlug: 'observability',
    'pt-BR': 'observabilidade',
    en: 'observability'
  },
  {
    key: 'webDevelopment',
    storageSlug: 'web-development',
    'pt-BR': 'desenvolvimento-web',
    en: 'web-development'
  },
  {
    key: 'mobileApps',
    storageSlug: 'mobile-apps',
    'pt-BR': 'aplicativos-mobile',
    en: 'mobile-apps'
  },
  {
    key: 'customSystems',
    storageSlug: 'custom-systems',
    'pt-BR': 'sistemas-personalizados',
    en: 'custom-systems'
  },
  {
    key: 'technicalConsulting',
    storageSlug: 'technical-consulting',
    'pt-BR': 'consultoria-tecnica',
    en: 'technical-consulting'
  },
  {
    key: 'processAutomation',
    storageSlug: 'process-automation',
    'pt-BR': 'automacao-de-processos',
    en: 'process-automation'
  },
  {
    key: 'apiIntegration',
    storageSlug: 'api-integration',
    'pt-BR': 'integracao-de-apis',
    en: 'api-integration'
  },
  {
    key: 'systemMaintenance',
    storageSlug: 'system-maintenance',
    'pt-BR': 'manutencao-de-sistemas',
    en: 'system-maintenance'
  },
  {
    key: 'uxUiDesign',
    storageSlug: 'ux-ui-design',
    'pt-BR': 'design-ux-ui',
    en: 'ux-ui-design'
  },
  {
    key: 'cloudSolutions',
    storageSlug: 'cloud-solutions',
    'pt-BR': 'solucoes-em-nuvem',
    en: 'cloud-solutions'
  }
];

export function servicePublicPath(locale: Locale, service: ServiceRoute): string {
  const prefix = locale === 'pt-BR' ? '/servicos' : '/services';
  return `${prefix}/${service[locale]}`;
}

export function serviceContentSlug(locale: Locale, publicSlug: string): string {
  return (
    SERVICE_ROUTES.find((service) => service[locale] === publicSlug)?.storageSlug ?? publicSlug
  );
}
