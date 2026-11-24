<script lang="ts">
  import '$design/tokens.css';
  import { locale as dictionaryLocale } from '$lib/i18n';

  import { untrack, type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import NavBar from '$components/NavBar.svelte';
  import Footer from '$components/Footer.svelte';
  import Breadcrumb from '$components/Breadcrumb.svelte';
  import ContactMenu from '$components/ContactMenu.svelte';
  import Analytics from '$lib/analytics/Analytics.svelte';
  import { captureUtm } from '$lib/analytics/utm';
  import { localizedUrl } from '$lib/seo/alternates';
  import type { LayoutData } from './$types';

  interface Props {
    children: Snippet;
    data: LayoutData;
  }

  let { children, data }: Props = $props();

  // UTM attribution capture (first/last touch) on every navigation — runs even
  // when the Plausible provider is not configured, so commerce attribution
  // never depends on analytics being live.
  $effect(() => {
    if (browser) captureUtm($page.url.search);
  });

  // svelte-i18n keeps one locale for the whole process, and the components
  // that read it get no locale prop. It follows the locale of the path: set
  // here while the page is rendered (a render is synchronous, so a request
  // cannot see the locale of another), and again after each navigation, since
  // changing language no longer loads a new document.
  dictionaryLocale.set(untrack(() => data.locale));
  $effect.pre(() => {
    dictionaryLocale.set(data.locale);
  });

  const rssUrl = $derived(localizedUrl(data.locale, '/rss.xml'));
</script>

<svelte:head>
  <link rel="alternate" type="application/rss+xml" title="RBX Journal" href={rssUrl} />
</svelte:head>

<div class="rbx-root">
  <NavBar locale={data.locale} />
  <main class="page">
    <Breadcrumb locale={data.locale} />
    {@render children()}
  </main>
  <Footer locale={data.locale} />
  <ContactMenu />
  <Analytics />
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: var(--bg-0);
    color: var(--fg-0);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--lead-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }
  :global(h1, h2, h3, h4, h5, h6) {
    margin: 0;
    color: var(--fg-0);
  }
  :global(p) {
    margin: 0;
  }
  :global(a) {
    color: var(--fg-0);
    text-decoration: none;
    border-bottom: 1px solid var(--border-strong);
    transition:
      border-color var(--dur) var(--ease),
      color var(--dur) var(--ease);
  }
  :global(a:hover) {
    color: var(--cyan-brand);
    border-bottom-color: var(--cyan-brand);
  }
  :global(*:focus-visible) {
    outline: none;
    box-shadow: var(--ring-focus);
    outline-offset: 2px;
  }
  .rbx-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .page {
    flex: 1;
    max-width: var(--content-w);
    width: 100%;
    margin: 0 auto;
    padding: var(--s-6) var(--gutter);
  }
</style>
