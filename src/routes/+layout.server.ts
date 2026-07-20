import { detectLocaleFromUrl } from '$lib/i18n/locale';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  const locale = detectLocaleFromUrl(url);
  // Plausible config arrives as runtime env (per-domain pods); the client
  // bundle never sees VITE_* vars, so expose it via layout data.
  const analytics =
    env.VITE_PLAUSIBLE_DOMAIN && env.VITE_PLAUSIBLE_SCRIPT_SRC
      ? {
          domain: env.VITE_PLAUSIBLE_DOMAIN,
          scriptSrc: env.VITE_PLAUSIBLE_SCRIPT_SRC,
          apiHost: env.VITE_PLAUSIBLE_API_HOST
        }
      : null;
  return { locale, analytics };
};
