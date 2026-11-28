import { browser } from '$app/environment';
import { init, addMessages } from 'svelte-i18n';
import ptBR from './pt-BR.json';
import en from './en.json';
import { DEFAULT_LOCALE, localeOfPath } from './locale';
import type { Locale } from '$types/content';

// Pre-load dictionaries so SSR can format messages synchronously.
addMessages('pt-BR', ptBR);
addMessages('en', en);

/**
 * The locale the dictionaries start in: the one of the path in the browser.
 * The server has no page yet when this module loads; the root layout sets the
 * locale of each request before anything is rendered, and again after every
 * navigation.
 */
export function detectLocale(): Locale {
  if (!browser) return DEFAULT_LOCALE;
  return localeOfPath(window.location.pathname) ?? DEFAULT_LOCALE;
}

init({
  fallbackLocale: 'en',
  initialLocale: detectLocale()
});

export { locale } from 'svelte-i18n';
