import type { Reroute } from '@sveltejs/kit';
import { isHostWidePath, stripLocalePrefix } from '$lib/i18n/locale';

/**
 * The locale segment chooses the language, not the route: /en/about and
 * /pt-br/sobre are matched as /about and /sobre, so the route folders carry no
 * locale. `event.url` and `page.url` keep the address as requested, and the
 * language is read from there.
 *
 * Host-wide paths have no language. Under a locale segment they are left as
 * they are, match no route and answer 404, so each of them has one address.
 */
export const reroute: Reroute = ({ url }) => {
  const rest = stripLocalePrefix(url.pathname);
  return isHostWidePath(rest) ? url.pathname : rest;
};
