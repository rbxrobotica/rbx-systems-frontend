import { error } from '@sveltejs/kit';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { loadPage } from '$lib/server/content/gateway';
import type { PageServerLoad } from './$types';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const load: PageServerLoad = async ({ url, params }) => {
  const locale = detectLocaleFromUrl(url);
  const slug = params.slug;

  if (!slug || !SLUG_RE.test(slug)) {
    throw error(404, 'Not found');
  }

  const page = await loadPage(`services/${slug}`, locale);
  return { page, locale, slug };
};
