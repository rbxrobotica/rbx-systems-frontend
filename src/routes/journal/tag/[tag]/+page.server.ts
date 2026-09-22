import { error, redirect } from '@sveltejs/kit';
import { loadAllPosts } from '$lib/server/content/gateway';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { canonicalTag, postHasTag } from '$lib/journal/tags';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const locale = detectLocaleFromUrl(url);
  const canonical = canonicalTag(params.tag);

  // One canonical URL per concept: locale variants (/journal/tag/risco)
  // permanently redirect to it (/journal/tag/risk).
  if (params.tag !== canonical) throw redirect(301, `/journal/tag/${canonical}`);

  const posts = await loadAllPosts(locale);
  const matches = posts.filter((post) => postHasTag(post.tags, canonical));
  if (matches.length === 0) throw error(404, `Tag not found: ${params.tag}`);

  return { locale, tag: canonical, posts: matches };
};
