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
  '/journal': { 'pt-BR': '/journal', en: '/journal' },
  '/cases': { 'pt-BR': '/cases', en: '/cases' },
  '/contato': { 'pt-BR': '/contato', en: '/contact' },
  '/contact': { 'pt-BR': '/contato', en: '/contact' },
  '/newsroom': { 'pt-BR': '/newsroom', en: '/newsroom' },
  '/changelog': { 'pt-BR': '/changelog', en: '/changelog' },
  '/atelier': { 'pt-BR': '/atelier', en: '/atelier' },
  '/trust': { 'pt-BR': '/trust', en: '/trust' }
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
