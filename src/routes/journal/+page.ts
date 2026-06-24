import { loadAllPosts } from '$api/content';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  const posts = await loadAllPosts(locale);
  return { locale, posts };
};
