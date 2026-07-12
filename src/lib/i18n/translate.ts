import type { Locale } from '$types/content';
import ptBR from './pt-BR.json';
import en from './en.json';

const messages: Record<Locale, Record<string, unknown>> = {
  'pt-BR': ptBR,
  en
};

function lookup(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, obj);
}

export function t(locale: Locale, key: string): string;
export function t(dictionary: Record<string, unknown>, key: string): string;
export function t(localeOrDictionary: Locale | Record<string, unknown>, key: string): string {
  const value =
    typeof localeOrDictionary === 'string'
      ? lookup(messages[localeOrDictionary as Locale], key)
      : lookup(localeOrDictionary, key);
  return typeof value === 'string' ? value : key;
}
