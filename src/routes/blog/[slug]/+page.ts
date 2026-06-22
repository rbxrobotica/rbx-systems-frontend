import { loadPost } from '$api/content';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = async ({ params, url }) => {
  const locale = detectLocaleFromUrl(url);
  const post = await loadPost(params.slug, locale);
  return { locale, post };
};
