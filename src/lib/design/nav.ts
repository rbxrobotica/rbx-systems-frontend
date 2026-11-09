/**
 * Navigation model for the public site: five sections, the pages each one
 * shows in the secondary band, and the resolution of the current URL into
 * section, band item and breadcrumb trail. Paths are canonical pt-BR routes;
 * `localizedPath` maps them to the route of the active host.
 */
import { getAlternates, localizedPath } from '$lib/seo/alternates';
import { t } from '$lib/i18n/translate';
import type { Locale } from '$types/content';

export interface NavItem {
  /** Canonical internal path (pt-BR route). */
  path: string;
  /** i18n key of the label. Omitted when the label is a proper name. */
  labelKey?: string;
  /** Literal label (product names). */
  label?: string;
  /**
   * Other canonical paths that belong under this item, matched exactly or as
   * a prefix: blog posts under Journal, service pages under Soluções, person
   * pages under Equipe.
   */
  also?: string[];
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
        also: ['/leandro-damasio', '/caue-alencar', '/flavia-ribeiro']
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
      { path: '/solucoes', labelKey: 'nav.overview', also: ['/servicos', '/services'] },
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
      { path: '/produtos/robson', label: 'Robson', also: ['/robson'] },
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
      { path: '/journal', labelKey: 'nav.journal', also: ['/blog'] },
      { path: '/changelog', labelKey: 'nav.changelog' },
      { path: '/newsroom', labelKey: 'nav.newsroom' }
    ]
  }
];

/** Pages outside the five sections that still get a breadcrumb. */
export const STANDALONE_PAGES: NavItem[] = [
  { path: '/contato', labelKey: 'nav.contact' },
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
  /** Band item to highlight, when the page is one of them. */
  item?: NavItem;
  /** Breadcrumb after Home; empty on the home page and on unknown routes. */
  trail: Crumb[];
}

export function navLabel(locale: Locale, item: NavItem): string {
  if (item.label) return item.label;
  return item.labelKey ? t(locale, item.labelKey) : item.path;
}

function normalize(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

type Match = 'exact' | 'under' | null;

/** Exact match on the item's own route, or a page that belongs under it. */
function match(locale: Locale, item: NavItem, pathname: string): Match {
  const own = localizedPath(locale, item.path);
  if (pathname === own) return 'exact';
  const roots = [own, ...(item.also ?? []).map((p) => localizedPath(locale, p))];
  for (const root of roots) {
    if (root === '/') continue;
    if (pathname === root || pathname.startsWith(`${root}/`)) return 'under';
  }
  return null;
}

export function resolveNav(locale: Locale, rawPathname: string): NavState {
  const pathname = normalize(rawPathname);
  if (pathname === '/') return { trail: [] };

  for (const section of NAV_SECTIONS) {
    const sectionLabel = navLabel(locale, section);
    const sectionHref = localizedPath(locale, section.path);
    // Longest routes first, so /produtos/robson wins over /produtos.
    const children = [...section.children].sort((a, b) => b.path.length - a.path.length);

    const exact = children.find((c) => match(locale, c, pathname) === 'exact');
    if (exact) {
      const isRoot = exact.path === section.path;
      return {
        section,
        item: exact,
        trail: isRoot
          ? [{ label: sectionLabel }]
          : [{ label: sectionLabel, href: sectionHref }, { label: navLabel(locale, exact) }]
      };
    }

    const under = children.find((c) => match(locale, c, pathname) === 'under');
    if (under) {
      const isRoot = under.path === section.path;
      const trail: Crumb[] = [{ label: sectionLabel, href: sectionHref }];
      if (!isRoot) {
        trail.push({ label: navLabel(locale, under), href: localizedPath(locale, under.path) });
      }
      return { section, item: isRoot ? undefined : under, trail };
    }
  }

  const standalone = STANDALONE_PAGES.find((p) => match(locale, p, pathname));
  if (standalone) return { trail: [{ label: navLabel(locale, standalone) }] };
  return { trail: [] };
}

const BASES: Record<Locale, string> = { 'pt-BR': 'https://rbx.ia.br', en: 'https://rbxsystems.ch' };

/**
 * Href of the language switch. The other locale lives on the other host: use
 * the hreflang alternate when the route is mapped, otherwise the same path
 * (blog slugs are shared across hosts and redirect to their alias).
 */
export function localeSwitchHref(current: Locale, target: Locale, pathname: string): string {
  if (target === current) return pathname;
  const alt = getAlternates(current, pathname)?.find((a) => a.hreflang === target);
  return alt?.href ?? `${BASES[target]}${pathname}`;
}
