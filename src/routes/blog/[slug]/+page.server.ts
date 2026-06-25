import { loadPost } from '$lib/server/content/gateway';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const locale = detectLocaleFromUrl(url);
  const post = await loadPost(params.slug, locale);
  return { locale, post };
};
