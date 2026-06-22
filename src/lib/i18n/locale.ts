import type { Locale } from '$types/content';

export function detectLocaleFromUrl(url: URL): Locale {
  const host = url.hostname;
  if (host.endsWith('.ia.br')) return 'pt-BR';
  if (host.endsWith('.ch')) return 'en';
  return 'pt-BR';
}
