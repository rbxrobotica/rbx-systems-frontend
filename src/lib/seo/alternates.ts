/**
 * Generate hreflang alternate links between pt-BR (rbx.ia.br) and en (rbxsystems.ch).
 */
import type { Locale } from '$types/content';

const PT_BASE = 'https://rbx.ia.br';
const EN_BASE = 'https://rbxsystems.ch';

const LOCALE_PATH_MAP: Record<string, { 'pt-BR': string; en: string }> = {
  '/': { 'pt-BR': '/', en: '/' },
  '/sobre': { 'pt-BR': '/sobre', en: '/about' },
  '/about': { 'pt-BR': '/sobre', en: '/about' },
  '/leandro-damasio': { 'pt-BR': '/leandro-damasio', en: '/leandro-damasio' },
  '/solucoes': { 'pt-BR': '/solucoes', en: '/solutions' },
  '/solutions': { 'pt-BR': '/solucoes', en: '/solutions' },
  '/produtos': { 'pt-BR': '/produtos', en: '/products' },
  '/products': { 'pt-BR': '/produtos', en: '/products' },
  '/equipe': { 'pt-BR': '/equipe', en: '/team' },
  '/team': { 'pt-BR': '/equipe', en: '/team' },
  '/parceria': { 'pt-BR': '/parceria', en: '/partnership' },
  '/partnership': { 'pt-BR': '/parceria', en: '/partnership' },
  '/diagnostico': { 'pt-BR': '/diagnostico', en: '/diagnostic' },
  '/diagnostic': { 'pt-BR': '/diagnostico', en: '/diagnostic' },
  '/briefing-btc': { 'pt-BR': '/briefing-btc', en: '/briefing-btc' },
  '/produtos/robson': { 'pt-BR': '/produtos/robson', en: '/products/robson' },
  '/products/robson': { 'pt-BR': '/produtos/robson', en: '/products/robson' },
  '/produtos/briefing-btc': { 'pt-BR': '/produtos/briefing-btc', en: '/products/briefing-btc' },
  '/products/briefing-btc': { 'pt-BR': '/produtos/briefing-btc', en: '/products/briefing-btc' },
  '/servicos/engenharia-de-ia': {
    'pt-BR': '/servicos/engenharia-de-ia',
    en: '/services/ai-engineering'
  },
  '/services/ai-engineering': {
    'pt-BR': '/servicos/engenharia-de-ia',
    en: '/services/ai-engineering'
  },
  '/servicos/llmops': { 'pt-BR': '/servicos/llmops', en: '/services/llmops' },
  '/services/llmops': { 'pt-BR': '/servicos/llmops', en: '/services/llmops' },
  '/servicos/agentes-de-ia': { 'pt-BR': '/servicos/agentes-de-ia', en: '/services/ai-agents' },
  '/services/ai-agents': { 'pt-BR': '/servicos/agentes-de-ia', en: '/services/ai-agents' },
  '/servicos/devops-cloud': { 'pt-BR': '/servicos/devops-cloud', en: '/services/devops-cloud' },
  '/services/devops-cloud': { 'pt-BR': '/servicos/devops-cloud', en: '/services/devops-cloud' },
  '/servicos/software-financeiro': {
    'pt-BR': '/servicos/software-financeiro',
    en: '/services/financial-software'
  },
  '/services/financial-software': {
    'pt-BR': '/servicos/software-financeiro',
    en: '/services/financial-software'
  },
  '/servicos/software-para-logistica': {
    'pt-BR': '/servicos/software-para-logistica',
    en: '/services/logistics-software'
  },
  '/services/logistics-software': {
    'pt-BR': '/servicos/software-para-logistica',
    en: '/services/logistics-software'
  },
  '/servicos/observabilidade': {
    'pt-BR': '/servicos/observabilidade',
    en: '/services/observability'
  },
  '/services/observability': {
    'pt-BR': '/servicos/observabilidade',
    en: '/services/observability'
  },
  '/journal': { 'pt-BR': '/journal', en: '/journal' },
  '/cases': { 'pt-BR': '/cases', en: '/cases' },
  '/contato': { 'pt-BR': '/contato', en: '/contact' },
  '/contact': { 'pt-BR': '/contato', en: '/contact' },
  '/newsroom': { 'pt-BR': '/newsroom', en: '/newsroom' },
  '/changelog': { 'pt-BR': '/changelog', en: '/changelog' },
  '/atelier': { 'pt-BR': '/atelier', en: '/atelier' },
  '/trust': { 'pt-BR': '/trust', en: '/trust' },
  '/legal': { 'pt-BR': '/legal', en: '/legal' }
};

export interface Alternate {
  hreflang: string;
  href: string;
}

export function getAlternates(locale: Locale, pathname: string): Alternate[] | undefined {
  const normalized = pathname.replace(/\/$/, '') || '/';
  const mapping = LOCALE_PATH_MAP[normalized];
  if (!mapping) return undefined;

  return [
    { hreflang: 'pt-BR', href: `${PT_BASE}${mapping['pt-BR']}` },
    { hreflang: 'en', href: `${EN_BASE}${mapping.en}` },
    { hreflang: 'x-default', href: `${EN_BASE}${mapping.en}` }
  ];
}
