import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageServerLoad } from './$types';

// Approved commercial terms are versioned with the frontend, without a CMS fetch.
export const load: PageServerLoad = ({ url }) => ({ locale: detectLocaleFromUrl(url) });
