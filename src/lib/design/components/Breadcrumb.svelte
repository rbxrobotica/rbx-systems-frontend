<script lang="ts">
  import { page } from '$app/stores';
  import { leafTitle, resolveNav } from '$design/nav';
  import { t } from '$lib/i18n/translate';
  import { localizedHref } from '$lib/seo/alternates';
  import type { Locale } from '$types/content';

  interface Props {
    locale: Locale;
  }

  let { locale }: Props = $props();

  // Visible counterpart of the BreadcrumbList JSON-LD: home, section, page.
  // Derived from the navigation model, so every page rendered by the layout
  // gets one without declaring it; hidden on the home page. Posts, tags,
  // authors, services and products are named from the page data, the same
  // source their structured data uses.
  const trail = $derived(resolveNav(locale, $page.url.pathname, leafTitle($page.data)).trail);
</script>

{#if trail.length > 0}
  <nav class="crumbs rbx-eyebrow" aria-label={t(locale, 'nav.breadcrumb')}>
    <ol>
      <li>
        <a href={localizedHref(locale, '/')} class="home" aria-label={t(locale, 'nav.home')}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5 10v10h14V10" />
          </svg>
        </a>
      </li>
      {#each trail as crumb, index (index)}
        <li class="sep" aria-hidden="true">›</li>
        <li>
          {#if crumb.href}
            <a href={crumb.href}>{crumb.label}</a>
          {:else}
            <span class="current" aria-current="page">{crumb.label}</span>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
{/if}

<style>
  .crumbs {
    margin-bottom: var(--s-7);
    line-height: 1;
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    gap: var(--s-2);
  }
  li {
    display: flex;
    align-items: center;
    flex: none;
  }
  /* Ancestors keep their width; a long page title is cut on one line (the
     full title is the heading right below). */
  li:last-child {
    flex: 0 1 auto;
    min-width: 0;
  }
  a {
    color: var(--fg-2);
    border-bottom: none;
    padding: 2px 0;
  }
  a:hover {
    color: var(--fg-0);
    border-bottom: none;
  }
  .home {
    display: inline-flex;
  }
  .sep {
    color: var(--fg-3);
  }
  .current {
    color: var(--fg-0);
    /* Room above for accented capitals, which the clipping would cut. */
    padding: 2px 0;
    box-shadow: inset 0 -1px 0 var(--cyan-dim);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
