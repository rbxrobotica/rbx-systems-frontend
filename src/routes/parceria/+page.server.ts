import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { getPartnershipExchangeRates } from '$lib/server/partnershipPricing';
import type { PageServerLoad } from './$types';

// Approved commercial terms are versioned with the frontend, without a CMS fetch.
export const load: PageServerLoad = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  return {
    locale,
    exchangeRates: locale === 'en' ? await getPartnershipExchangeRates() : null
  };
};
