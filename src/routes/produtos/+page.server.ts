import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageServerLoad } from './$types';

// The curated portfolio is versioned with the frontend and needs no CMS request.
export const load: PageServerLoad = ({ url }) => ({ locale: detectLocaleFromUrl(url) });
