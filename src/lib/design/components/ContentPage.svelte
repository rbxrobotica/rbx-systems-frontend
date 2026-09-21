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
    /** Extra JSON-LD nodes merged into the page @graph (Service, BreadcrumbList, ...). */
    schemaNodes?: Record<string, unknown>[];
    /** @id the WebPage node is about (e.g. a Person or Service entity). */
    aboutId?: string;
  }

  let {
    page,
    fallbackTitle,
    fallbackLead,
    locale = 'pt-BR',
    schemaNodes = [],
    aboutId
  }: Props = $props();

  const title = $derived(page?.title || fallbackTitle);
  const description = $derived(page?.description ?? fallbackLead ?? '');
  const siteUrl = $derived(locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(`${siteUrl}${$pageStore.url.pathname}`);
  const schema = $derived(buildGraph(locale, pageUrl, title, description, schemaNodes, aboutId));
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
