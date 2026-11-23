import { redirect } from '@sveltejs/kit';
import { detectLocaleFromUrl } from '$lib/i18n/locale';
import type { PageServerLoad } from './$types';

// The Strategos Founder Plan form lived here until 2026-11-23, when Strategos
// turned to logistics and the plan was withdrawn. Earlier links land on the
// contact page of their language instead of a 404.
export const load: PageServerLoad = ({ url }) => {
  redirect(301, detectLocaleFromUrl(url) === 'pt-BR' ? '/contato' : '/contact');
};
