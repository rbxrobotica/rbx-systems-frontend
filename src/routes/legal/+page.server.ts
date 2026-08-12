import { loadPage } from '$lib/server/content/gateway';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageContent } from '$types/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  // loadPage throws 404 when the S3 object is absent. The legal notice must
  // degrade to the ContentPage fallback instead of taking the route down
  // while content publication lags a deploy.
  let page: PageContent | null = null;
  try {
    page = await loadPage('legal', locale);
  } catch {
    page = null;
  }
  return { locale, page };
};
