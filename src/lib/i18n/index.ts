import { browser } from '$app/environment';
import { init, addMessages, getLocaleFromNavigator } from 'svelte-i18n';
import ptBR from './pt-BR.json';
import en from './en.json';
import type { Locale } from '$types/content';

// Pre-load dictionaries so SSR can format messages synchronously.
addMessages('pt-BR', ptBR);
addMessages('en', en);

export function detectLocale(): Locale {
  if (!browser) return 'pt-BR';
  const host = window.location.hostname;
  const cookieLocale = document.cookie
    .split('; ')
    .find((c) => c.startsWith('locale='))
    ?.split('=')[1];
  if (cookieLocale === 'pt-BR' || cookieLocale === 'en') return cookieLocale as Locale;
  if (host.endsWith('.ia.br')) return 'pt-BR';
  if (host.endsWith('.ch')) return 'en';
  const nav = getLocaleFromNavigator();
  if (nav?.startsWith('pt')) return 'pt-BR';
  return 'en';
}

init({
  fallbackLocale: 'en',
  initialLocale: detectLocale()
});

export { locale } from 'svelte-i18n';
