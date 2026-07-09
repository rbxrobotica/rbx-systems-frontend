import { browser } from '$app/environment';
import { init, register, getLocaleFromNavigator, locale } from 'svelte-i18n';
export type Locale = 'pt-BR' | 'en';

register('pt-BR', () => import('./pt-BR.json'));
register('en', () => import('./en.json'));

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

export { locale };
