import { isHttpError } from '@sveltejs/kit';
import { loadPage } from '$lib/server/content/gateway';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageContent } from '$types/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  // Only a missing S3 object (gateway 404) degrades to the ContentPage
  // fallback; infrastructure failures (503 for S3 auth/network errors)
  // must surface, not render as an indexable header-only page.
  let page: PageContent | null = null;
  try {
    page = await loadPage('legal', locale);
  } catch (err) {
    if (isHttpError(err) && err.status === 404) {
      page = null;
    } else {
      throw err;
    }
  }
  return { locale, page };
};
