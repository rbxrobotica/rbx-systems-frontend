<script lang="ts">
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import Logo from './Logo.svelte';
  import { NAV_SECTIONS, navLabel, resolveNav, localeSwitchHref } from '$design/nav';
  import { t } from '$lib/i18n/translate';
  import { localizedPath } from '$lib/seo/alternates';
  import type { Locale } from '$types/content';

  interface Props {
    locale: Locale;
  }

  let { locale }: Props = $props();

  const tr = (key: string) => t(locale, key);
  const href = (pathname: string) => localizedPath(locale, pathname);

  // Header in three rows: brand + language + contact; the five sections; and,
  // when the page belongs to a section, a band with that section's pages.
  const pathname = $derived($page.url.pathname);
  const nav = $derived(resolveNav(locale, pathname));
  const band = $derived(nav.section && nav.section.children.length > 1 ? nav.section : undefined);

  const ptHref = $derived(localeSwitchHref(locale, 'pt-BR', pathname));
  const enHref = $derived(localeSwitchHref(locale, 'en', pathname));

  let menuOpen = $state(false);
  let sectionOpen = $state(false);

  afterNavigate(() => {
    menuOpen = false;
    sectionOpen = false;
  });
</script>

<div class="site-nav">
  <header class="site-header">
    <div class="row brand-row">
      <a href={href('/')} class="brand" aria-label="RBX Systems">
        <span class="brand-desktop"><Logo size={28} variant="stacked" /></span>
        <span class="brand-mobile"><Logo size={24} variant="compact" /></span>
      </a>

      <div class="tools">
        <div class="lang rbx-eyebrow" role="group" aria-label={tr('nav.language')}>
          <a
            href={ptHref}
            hreflang="pt-BR"
            lang="pt-BR"
            class:active={locale === 'pt-BR'}
            aria-current={locale === 'pt-BR' ? 'true' : undefined}>PT</a
          >
          <span aria-hidden="true">/</span>
          <a
            href={enHref}
            hreflang="en"
            lang="en"
            class:active={locale === 'en'}
            aria-current={locale === 'en' ? 'true' : undefined}>EN</a
          >
        </div>

        <a href={href('/contato')} class="cta rbx-eyebrow" aria-label={tr('nav.contact')}>
          <span class="cta-label">{tr('nav.contact')}</span>
          <svg
            class="cta-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6h16v12H4z" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </a>

        <button
          type="button"
          class="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? tr('nav.closeMenu') : tr('nav.menu')}
          onclick={() => (menuOpen = !menuOpen)}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            {#if menuOpen}
              <path d="m6 6 12 12" />
              <path d="M18 6 6 18" />
            {:else}
              <path d="M4 8h16" />
              <path d="M4 16h16" />
            {/if}
          </svg>
        </button>
      </div>
    </div>

    <nav class="row primary" aria-label={tr('nav.primary')}>
      <ul>
        {#each NAV_SECTIONS as section (section.key)}
          <li>
            <a
              href={href(section.path)}
              class:active={nav.section?.key === section.key}
              aria-current={nav.section?.key === section.key ? 'true' : undefined}
            >
              {navLabel(locale, section)}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </header>

  {#if band}
    <div class="band">
      <nav class="band-inner" aria-label={navLabel(locale, band)}>
        <ul>
          {#each band.children as item (item.path)}
            <li>
              <a
                href={href(item.path)}
                class:active={nav.item?.path === item.path}
                aria-current={nav.item?.path === item.path ? 'page' : undefined}
              >
                {navLabel(locale, item)}
              </a>
            </li>
          {/each}
        </ul>
      </nav>

      <button
        type="button"
        class="section-toggle"
        aria-expanded={sectionOpen}
        aria-controls="section-menu"
        onclick={() => (sectionOpen = !sectionOpen)}
      >
        <span class="section-path">
          <span class="section-name">{navLabel(locale, band)}</span>
          {#if nav.item && nav.item.path !== band.path}
            <span class="sep" aria-hidden="true">›</span>
            <span class="section-current">{navLabel(locale, nav.item)}</span>
          {/if}
        </span>
        <svg
          class="chevron"
          class:open={sectionOpen}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <ul id="section-menu" class="section-menu" hidden={!sectionOpen}>
        {#each band.children as item (item.path)}
          <li>
            <a
              href={href(item.path)}
              class:active={nav.item?.path === item.path}
              aria-current={nav.item?.path === item.path ? 'page' : undefined}
            >
              {navLabel(locale, item)}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <nav id="site-menu" class="menu" aria-label={tr('nav.primary')} hidden={!menuOpen}>
    {#each NAV_SECTIONS as section (section.key)}
      <div class="menu-section">
        <a href={href(section.path)} class="menu-title">{navLabel(locale, section)}</a>
        {#if section.children.length > 1}
          <ul>
            {#each section.children as item (item.path)}
              <li><a href={href(item.path)}>{navLabel(locale, item)}</a></li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </nav>
</div>

<style>
  [hidden] {
    display: none !important;
  }

  .site-nav a {
    border-bottom: none;
    transition: color var(--dur) var(--ease);
  }
  .site-nav a:hover {
    color: var(--fg-0);
    border-bottom: none;
  }

  .site-header {
    background: var(--bg-0);
    border-bottom: 1px solid var(--border);
  }
  .row {
    max-width: var(--nav-w);
    margin: 0 auto;
    padding: 0 var(--gutter);
  }
  .brand-row {
    height: var(--header-row);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-5);
  }
  .brand {
    display: inline-flex;
    align-items: center;
  }
  .brand-mobile {
    display: none;
  }

  .tools {
    display: flex;
    align-items: center;
    gap: var(--s-5);
  }
  .lang {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .lang a {
    color: var(--fg-2);
    padding: var(--s-2);
    line-height: 1;
  }
  .lang a.active {
    color: var(--fg-0);
    box-shadow: inset 0 -1px 0 var(--cyan-brand);
  }
  .lang span {
    color: var(--fg-3);
  }
  .cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--s-2);
    background: var(--cta);
    color: var(--on-cta);
    padding: 10px var(--s-4);
    border-radius: var(--radius-sm);
    line-height: 1;
    transition: background var(--dur) var(--ease);
  }
  .cta:hover {
    background: var(--cyan-signal);
    color: var(--on-cta);
  }
  .cta-icon {
    display: none;
  }
  .menu-toggle {
    display: none;
  }

  .primary ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-6);
    height: var(--nav-row);
  }
  .primary li {
    display: flex;
  }
  .primary a {
    display: flex;
    align-items: center;
    font-size: var(--text-base);
    font-weight: 500;
    color: var(--fg-2);
    white-space: nowrap;
  }
  .primary a.active {
    color: var(--fg-0);
    box-shadow: inset 0 -1px 0 var(--cyan-brand);
  }

  .band {
    background: var(--bg-1);
    border-bottom: 1px solid var(--border);
  }
  .band-inner {
    max-width: var(--nav-w);
    margin: 0 auto;
    padding: 0 var(--gutter);
  }
  .band-inner ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: var(--band-row);
    font-size: 0.875rem;
  }
  .band-inner li {
    display: flex;
    align-items: center;
    height: 20px;
    border-left: 1px solid var(--border);
  }
  .band-inner li:first-child {
    border-left: 0;
  }
  .band-inner a {
    color: var(--fg-2);
    padding: 0 var(--s-4);
    line-height: 20px;
    white-space: nowrap;
  }
  .band-inner li:first-child a {
    padding-left: 0;
  }
  .band-inner a.active {
    color: var(--fg-0);
    padding-bottom: 3px;
    margin-bottom: -3px;
    box-shadow: inset 0 -1px 0 var(--cyan-brand);
  }

  .section-toggle,
  .section-menu,
  .menu {
    display: none;
  }

  @media (max-width: 767px) {
    .brand-row {
      height: var(--header-row-mobile);
      gap: var(--s-3);
    }
    .brand-desktop {
      display: none;
    }
    .brand-mobile {
      display: inline-flex;
    }
    .tools {
      gap: var(--s-1);
    }
    .lang {
      margin-right: var(--s-2);
    }
    .cta {
      width: 44px;
      height: 44px;
      padding: 0;
    }
    .cta-label {
      display: none;
    }
    .cta-icon {
      display: block;
    }
    .menu-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      padding: 0;
      background: none;
      border: 0;
      color: var(--fg-0);
      cursor: pointer;
    }
    .primary {
      display: none;
    }

    .band-inner {
      display: none;
    }
    .section-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: var(--band-row);
      padding: 0 var(--gutter);
      background: none;
      border: 0;
      color: var(--fg-0);
      font: 500 0.875rem/1 var(--font-sans);
      text-align: left;
      cursor: pointer;
    }
    .section-path {
      display: flex;
      align-items: center;
      gap: var(--s-2);
      min-width: 0;
    }
    .section-name {
      color: var(--fg-2);
    }
    .sep {
      color: var(--fg-3);
    }
    .section-current {
      padding-bottom: 3px;
      margin-bottom: -3px;
      box-shadow: inset 0 -1px 0 var(--cyan-brand);
    }
    .chevron {
      flex: none;
      color: var(--fg-2);
      transition: transform var(--dur) var(--ease);
    }
    .chevron.open {
      transform: rotate(180deg);
    }
    .section-menu {
      display: block;
      list-style: none;
      margin: 0;
      padding: var(--s-2) var(--gutter) var(--s-3);
      border-top: 1px solid var(--border);
    }
    .section-menu a {
      display: flex;
      align-items: center;
      min-height: 44px;
      color: var(--fg-1);
      font-size: var(--text-base);
    }
    .section-menu a.active {
      color: var(--fg-0);
    }

    .menu {
      display: block;
      background: var(--bg-0);
      border-bottom: 1px solid var(--border);
      padding: var(--s-3) var(--gutter) var(--s-6);
    }
    .menu-section + .menu-section {
      margin-top: var(--s-3);
      padding-top: var(--s-3);
      border-top: 1px solid var(--border);
    }
    .menu-title {
      display: flex;
      align-items: center;
      min-height: 44px;
      font-size: var(--text-lg);
      font-weight: 500;
      color: var(--fg-0);
    }
    .menu ul {
      list-style: none;
      margin: 0;
      padding: 0 0 0 var(--s-4);
    }
    .menu ul a {
      display: flex;
      align-items: center;
      min-height: 44px;
      color: var(--fg-1);
    }
  }
</style>
