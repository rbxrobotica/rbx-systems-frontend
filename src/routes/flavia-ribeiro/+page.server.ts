import { loadPageOrNull } from '$lib/server/content/gateway';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  const page = await loadPageOrNull('flavia-ribeiro', locale);
  return { locale, page };
};
