/**
 * The one public origin of the site, and the hosts that served it before.
 *
 * Until 2026-11 the site answered on two hosts and the host chose the language:
 * rbx.ia.br in Portuguese, rbxsystems.ch in English. It now answers on one
 * host and the first path segment chooses the language (see
 * `$lib/i18n/locale`). The two earlier hosts stay registered and redirect
 * page by page (see `./redirects`).
 */
import type { Locale } from '$types/content';

export const SITE_HOST = 'merovelis.com';
export const SITE_ORIGIN = `https://${SITE_HOST}`;

/**
 * The conversion landing of the briefing lives on its own host
 * (rbx-landing-briefing-btc). The path /briefing-btc of this site has pointed
 * there since 2026-09-20: campaign posts, chat deep-links and bookmarks still
 * use it, and their query string travels with them.
 */
export const BRIEFING_PATH = '/briefing-btc';
export const BRIEFING_LANDING = 'https://briefingbtc.merovelis.com/';

/** The language each earlier host served. */
export const LEGACY_HOST_LOCALE: Record<string, Locale> = {
  'rbx.ia.br': 'pt-BR',
  'rbxsystems.ch': 'en'
};
