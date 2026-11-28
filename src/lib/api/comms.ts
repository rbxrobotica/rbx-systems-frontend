import { DEFAULT_LOCALE, localeOfPath } from '$lib/i18n/locale';
import { SITE_HOST } from '$lib/seo/site';
import type { Locale } from '$types/content';

/**
 * The service keeps its two public names, one per language, as it had one
 * per site host. Each language section calls the name its host used to call.
 */
const COMMS_BASE: Record<Locale, string> = {
  'pt-BR': 'https://api.comms.rbx.ia.br',
  en: 'https://api.comms.rbxsystems.ch'
};

/**
 * Resolve the public rbx-comms API base URL from the current browser address.
 * Returns the production origin for the language section of the site host, or
 * localhost for dev.
 */
export function getCommsBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  if (window.location.hostname === SITE_HOST) {
    return COMMS_BASE[localeOfPath(window.location.pathname) ?? DEFAULT_LOCALE];
  }

  // Development fallback — can be overridden via VITE_COMMS_BASE_URL.
  return import.meta.env?.VITE_COMMS_BASE_URL ?? 'http://localhost:8080';
}
