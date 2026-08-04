import { error, redirect } from '@sveltejs/kit';
import { loadPost, resolvePostSlug } from '$lib/server/content/gateway';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const locale = detectLocaleFromUrl(url);
  const resolved = await resolvePostSlug(params.slug, locale);
  if (!resolved) throw error(404, `Post not found: ${params.slug}`);

  // The localized slug is the canonical URL on this host: requests through
  // the storage slug or another locale's alias permanently redirect to it.
  if (params.slug !== resolved.publicSlug) {
    throw redirect(301, `/blog/${resolved.publicSlug}`);
  }

  const post = await loadPost(resolved.canonicalSlug, locale);
  return { locale, post, publicSlug: resolved.publicSlug, alternates: resolved.alternates };
};
