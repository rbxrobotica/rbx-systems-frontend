/**
 * Navigation model for the public site: five sections, the pages each one
 * shows in the secondary band, and the resolution of the current URL into
 * section, band item and breadcrumb trail.
 *
 * Paths in the model are canonical pt-BR routes, without the locale segment.
 * A requested path arrives as /en/about or /pt-br/sobre: the segment is
 * dropped and the rest respelled to its canonical form before it is matched,
 * so either spelling resolves. Hrefs go out through `localizedHref`, with the
 * segment and the spelling of the active language.
 *
 * The visible breadcrumb and the BreadcrumbList structured data are both
 * derived from `resolveNav`, with the same page title from `leafTitle`, so
 * they cannot drift apart.
 */
import { localizedHref, spelledPath, withLocalePrefix } from '$lib/seo/alternates';
import { t } from '$lib/i18n/translate';
import type { Locale, PostAlternate } from '$types/content';

export interface NavItem {
  /** Canonical internal path (pt-BR route). */
  path: string;
  /** i18n key of the label. Omitted when the label is a proper name. */
  labelKey?: string;
  /** Literal label (product names). */
  label?: string;
  /**
   * Known pages that belong under this item without being band items:
   * person pages under Equipe, a campaign form under Contato.
   */
  pages?: NavItem[];
  /**
   * Canonical path prefixes whose pages belong under this item and are known
   * only by their own title: blog posts under Journal, service pages under
   * Soluções. Pages below the item's own path are always included.
   */
  under?: string[];
}

export interface NavSection extends NavItem {
  key: string;
  children: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'company',
    labelKey: 'nav.company',
    path: '/sobre',
    children: [
      { path: '/sobre', labelKey: 'nav.about' },
      { path: '/historia', labelKey: 'nav.history' },
      {
        path: '/equipe',
        labelKey: 'nav.team',
        pages: [
          { path: '/leandro-damasio', labelKey: 'nav.leandroDamasio' },
          { path: '/caue-alencar', labelKey: 'nav.caueAlencar' },
          { path: '/flavia-ribeiro', labelKey: 'nav.flaviaRibeiro' }
        ]
      },
      { path: '/carreiras', labelKey: 'nav.careers' },
      { path: '/manifesto', labelKey: 'nav.manifesto' },
      { path: '/trust', labelKey: 'nav.trust' }
    ]
  },
  {
    key: 'solutions',
    labelKey: 'nav.solutions',
    path: '/solucoes',
    children: [
      { path: '/solucoes', labelKey: 'nav.overview', under: ['/servicos'] },
      { path: '/cases', labelKey: 'nav.cases' },
      { path: '/atelier', labelKey: 'nav.atelier' }
    ]
  },
  {
    key: 'products',
    labelKey: 'nav.products',
    path: '/produtos',
    children: [
      { path: '/produtos', labelKey: 'nav.overview' },
      { path: '/produtos/robson', label: 'Robson', under: ['/robson'] },
      { path: '/produtos/briefing-btc', label: 'Briefing BTC' }
    ]
  },
  {
    key: 'partnership',
    labelKey: 'nav.partnership',
    path: '/parceria',
    children: [
      { path: '/parceria', labelKey: 'nav.overview' },
      { path: '/diagnostico', labelKey: 'nav.diagnostic' }
    ]
  },
  {
    key: 'journal',
    labelKey: 'nav.journal',
    path: '/journal',
    children: [
      { path: '/journal', labelKey: 'nav.journal', under: ['/blog'] },
      { path: '/changelog', labelKey: 'nav.changelog' },
      { path: '/newsroom', labelKey: 'nav.newsroom' }
    ]
  }
];

/** Pages outside the five sections that still get a breadcrumb. */
export const STANDALONE_PAGES: NavItem[] = [
  {
    path: '/contato',
    labelKey: 'nav.contact',
    pages: [{ path: '/contact/strategos', label: 'Strategos Founder Plan' }]
  },
  { path: '/legal', labelKey: 'nav.legal' }
];

export interface Crumb {
  label: string;
  /** Absent on the current page. */
  href?: string;
}

export interface NavState {
  /** Active primary section, when the page belongs to one. */
  section?: NavSection;
  /** Band item to highlight: the page itself, or the item it sits under. */
  item?: NavItem;
  /**
   * Breadcrumb after Home, ending in the current page. Empty on the home
   * page and on unknown routes. When a page is known only by its parent and
   * no title was given, the trail ends in that parent, still linked.
   */
  trail: Crumb[];
}

export function navLabel(locale: Locale, item: NavItem): string {
  if (item.label) return item.label;
  return item.labelKey ? t(locale, item.labelKey) : item.path;
}

/**
 * The pt-BR spelling of a route, whichever spelling and locale segment were
 * requested. A service slug may also arrive under the prefix of the other
 * language (/services/agentes-de-ia, /servicos/ai-agents): the loaders render
 * both, so both resolve to the one mapped route.
 */
export function canonicalPath(rawPathname: string): string {
  return spelledPath('pt-BR', rawPathname);
}

interface Located {
  item: NavItem;
  /** Known page under the item, when the path is one of `item.pages`. */
  page?: NavItem;
  /** The path is the item's own route. */
  exact: boolean;
}

/** Find the item a canonical path is, or sits under. */
function locate(items: NavItem[], path: string): Located | undefined {
  const exact = items.find((item) => item.path === path);
  if (exact) return { item: exact, exact: true };

  for (const item of items) {
    const page = item.pages?.find((candidate) => candidate.path === path);
    if (page) return { item, page, exact: false };
  }

  // Longest root first, so /produtos/robson/x sits under Robson, not Produtos.
  const roots = items
    .flatMap((item) => [item.path, ...(item.under ?? [])].map((root) => ({ item, root })))
    .filter(({ root }) => root !== '/' && (path === root || path.startsWith(`${root}/`)))
    .sort((a, b) => b.root.length - a.root.length);
  return roots[0] ? { item: roots[0].item, exact: false } : undefined;
}

/**
 * Resolve a requested path. `leaf` is the title of the current page for
 * pages the model knows only by their parent (see `leafTitle`).
 */
export function resolveNav(locale: Locale, rawPathname: string, leaf?: string): NavState {
  const path = canonicalPath(rawPathname);
  if (path === '/') return { trail: [] };

  const link = (item: NavItem): Crumb => ({
    label: navLabel(locale, item),
    href: localizedHref(locale, item.path)
  });
  const here = (label: string): Crumb => ({ label });
  /** Crumbs below the parent: the item, then the page when it is known. */
  const below = ({ item, page, exact }: Located, itemIsParent: boolean): Crumb[] => {
    if (exact) return itemIsParent ? [] : [here(navLabel(locale, item))];
    const crumbs: Crumb[] = itemIsParent ? [] : [link(item)];
    if (page) crumbs.push(here(navLabel(locale, page)));
    else if (leaf) crumbs.push(here(leaf));
    return crumbs;
  };

  for (const section of NAV_SECTIONS) {
    const found = locate(section.children, path);
    if (!found) continue;
    // The first band item is the section's own landing page.
    const isLanding = found.item.path === section.path;
    if (found.exact && isLanding) {
      return { section, item: found.item, trail: [here(navLabel(locale, section))] };
    }
    return {
      section,
      // A page under the landing item (a post, a service) highlights nothing.
      item: found.exact || !isLanding ? found.item : undefined,
      trail: [link(section), ...below(found, isLanding)]
    };
  }

  const found = locate(STANDALONE_PAGES, path);
  if (!found) return { trail: [] };
  if (found.exact) return { trail: [here(navLabel(locale, found.item))] };
  return { trail: [link(found.item), ...below(found, true)] };
}

/**
 * CMS titles of service and product pages end in the site name
 * ("LLMOps — RBX Systems", "API Integration · RBX Systems"); a crumb does not
 * repeat it.
 */
const SITE_SUFFIX = /\s+[—–·|-]\s+RBX Systems$/;

/**
 * Title of the current page as its loader exposes it: a post, an author, a
 * tag, a CMS page, or the slug as last resort. The layout and the pages that
 * emit BreadcrumbList call this on the same page data.
 */
export function leafTitle(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as {
    post?: { title?: unknown; publicSlug?: unknown; slug?: unknown } | null;
    author?: { name?: unknown } | null;
    tag?: unknown;
    page?: { title?: unknown } | null;
    slug?: unknown;
  };
  const candidates = [
    d.post?.title,
    d.author?.name,
    d.tag,
    d.page?.title,
    d.slug,
    // A post stored with a blank title is still named, by its public slug.
    d.post?.publicSlug,
    d.post?.slug
  ];
  const found = candidates.find((value) => typeof value === 'string' && value.trim() !== '');
  if (typeof found !== 'string') return undefined;
  const title = found.trim();
  return title.replace(SITE_SUFFIX, '') || title;
}

/**
 * The trail as BreadcrumbList items: Home first, then every crumb, the
 * current page with its own path. Every path carries the locale segment.
 * Feed it to `breadcrumbSchema`.
 */
export function breadcrumbItems(
  locale: Locale,
  pathname: string,
  leaf?: string
): { name: string; path: string }[] {
  const current = withLocalePrefix(locale, pathname);
  return [
    { name: t(locale, 'nav.home'), path: withLocalePrefix(locale, '/') },
    ...resolveNav(locale, pathname, leaf).trail.map((crumb) => ({
      name: crumb.label,
      path: crumb.href ?? current
    }))
  ];
}

/**
 * Href of the language switch: the same page under the other locale segment,
 * in the spelling of that language. A mapped route is looked up by its
 * canonical spelling, so a service reached under the prefix of the other
 * language still lands on its own page; an unmapped /produtos/<slug> or
 * /products/<slug> is respelled, and a path that is the same in both
 * languages only changes its segment.
 *
 * A post is the exception: its slug may differ per language, and it may not
 * exist in the other one. `alternates` is what the loader of the post
 * resolved. The switch goes to the post's own address in the target language,
 * and to the Journal of that language when the post has no version there,
 * so it never lands on a redirect or on a missing page.
 */
export function localeSwitchHref(
  current: Locale,
  target: Locale,
  pathname: string,
  alternates?: PostAlternate[]
): string {
  if (target === current) return pathname;
  const canonical = canonicalPath(pathname);
  if (alternates && canonical.startsWith('/blog/')) {
    const post = alternates.find((alternate) => alternate.locale === target);
    return localizedHref(target, post ? `/blog/${post.publicSlug}` : '/journal');
  }
  return withLocalePrefix(target, spelledPath(target, canonical));
}
