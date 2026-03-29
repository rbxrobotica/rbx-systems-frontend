import { headers } from 'next/headers';
import type { Locale } from './getDictionary';

export function getLocaleFromHeaders(): Locale {
  const headerStore = headers();
  return (headerStore.get('x-rbx-locale') as Locale) ?? 'pt-BR';
}
