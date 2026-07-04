import type { Locale } from '$types/content';
import ptBR from './pt-BR.json';
import en from './en.json';

const messages: Record<Locale, Record<string, unknown>> = {
  'pt-BR': ptBR,
  en
};

export function t(locale: Locale, key: string): string {
  const value = key.split('.').reduce<unknown>((obj, segment) => {
    if (obj && typeof obj === 'object' && segment in obj) {
      return (obj as Record<string, unknown>)[segment];
    }
    return undefined;
  }, messages[locale]);

  return typeof value === 'string' ? value : key;
}
