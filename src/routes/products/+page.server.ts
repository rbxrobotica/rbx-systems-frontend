import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { getPartnershipExchangeRates } from '$lib/server/partnershipPricing';
import type { PageServerLoad } from './$types';

// The curated portfolio is versioned with the frontend and needs no CMS request.
export const load: PageServerLoad = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  return {
    locale,
    exchangeRates: locale === 'en' ? await getPartnershipExchangeRates() : null
  };
};
