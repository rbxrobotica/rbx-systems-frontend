import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Permanent redirect for the post URLs the sitemap wrongly advertised as
// /journal/{slug}; the canonical post route is /blog/{slug}.
export const load: PageServerLoad = ({ params }) => {
  redirect(301, `/blog/${params.slug}`);
};
