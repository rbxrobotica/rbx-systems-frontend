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

/**
 * Read a list of strings from a dictionary (feature lists on plan cards).
 * Returns an empty list when the key is missing or not a list of strings.
 */
export function tl(locale: Locale, key: string): string[] {
  const value = lookup(messages[locale], key);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Read a list of objects from a dictionary (e.g. FAQ entries). Returns an
 * empty list when the key is missing or not a list of plain objects.
 */
export function tobjects<T extends Record<string, unknown>>(locale: Locale, key: string): T[] {
  const value = lookup(messages[locale], key);
  return Array.isArray(value)
    ? value.filter((v): v is T => typeof v === 'object' && v !== null)
    : [];
}
