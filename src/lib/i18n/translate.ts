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
      // eslint-disable-next-line security/detect-object-injection -- segment comes from a message key written in source, never from a request
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

/**
 * Read a list of strings from a dictionary (feature lists on plan cards).
 * Returns an empty list when the key is missing or not a list of strings.
 */
export function tl(locale: Locale, key: string): string[] {
  // eslint-disable-next-line security/detect-object-injection -- locale is 'pt-BR' or 'en'
  const value = lookup(messages[locale], key);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Read a list of objects from a dictionary (e.g. FAQ entries). Returns an
 * empty list when the key is missing or not a list of plain objects.
 */
export function tobjects<T extends Record<string, unknown>>(locale: Locale, key: string): T[] {
  // eslint-disable-next-line security/detect-object-injection -- locale is 'pt-BR' or 'en'
  const value = lookup(messages[locale], key);
  return Array.isArray(value)
    ? value.filter((v): v is T => typeof v === 'object' && v !== null)
    : [];
}
