import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  return { locale };
};
