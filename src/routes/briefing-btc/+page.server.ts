import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { loadPage } from '$lib/server/content/gateway';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const locale = detectLocaleFromUrl(url);
  const page = await loadPage('briefing-btc', locale).catch(() => null);
  return { page, locale };
};
