import { error } from '@sveltejs/kit';
import { loadAllPosts } from '$lib/server/content/gateway';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { authorSlugFor, journalAuthorBySlug } from '$lib/journal/authors';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const locale = detectLocaleFromUrl(url);
  const author = journalAuthorBySlug(params.slug);
  if (!author) throw error(404, `Author not found: ${params.slug}`);

  const posts = (await loadAllPosts(locale)).filter(
    (post) => authorSlugFor(post.author) === author.slug
  );
  if (posts.length === 0) throw error(404, `No posts for author: ${params.slug}`);

  return { locale, author, posts };
};
