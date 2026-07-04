<script lang="ts">
  import { page as pageStore } from '$app/stores';
  import PageHeader from './PageHeader.svelte';
  import Prose from './Prose.svelte';
  import Seo from './Seo.svelte';
  import { buildGraph } from '$lib/seo/schema';
  import type { Locale, PageContent } from '$types/content';

  interface Props {
    page: PageContent | null;
    fallbackTitle: string;
    fallbackLead?: string;
    locale?: Locale;
  }

  let { page, fallbackTitle, fallbackLead, locale = 'pt-BR' }: Props = $props();

  const title = $derived(page?.title || fallbackTitle);
  const description = $derived(page?.description ?? fallbackLead ?? '');
  const siteUrl = $derived(locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(`${siteUrl}${$pageStore.url.pathname}`);
  const schema = $derived(buildGraph(locale, pageUrl, title, description));
</script>

<Seo {title} {description} {locale} canonical={pageUrl} {schema} />

{#if page}
  <PageHeader eyebrow={page.eyebrow} title={page.title} lead={page.lead} body={page.body} />
  {#if page.html}
    <Prose html={page.html} />
  {/if}
{:else}
  <PageHeader title={fallbackTitle} lead={fallbackLead} />
{/if}
