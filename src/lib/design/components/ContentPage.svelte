<script lang="ts">
  import PageHeader from './PageHeader.svelte';
  import Prose from './Prose.svelte';
  import type { PageContent } from '$types/content';

  interface Props {
    page: PageContent | null;
    fallbackTitle: string;
    fallbackLead?: string;
  }

  let { page, fallbackTitle, fallbackLead }: Props = $props();
</script>

<svelte:head>
  <title>{page?.title ?? fallbackTitle}</title>
  <meta name="description" content={page?.description ?? ''} />
</svelte:head>

{#if page}
  <PageHeader eyebrow={page.eyebrow} title={page.title} lead={page.lead} body={page.body} />
  {#if page.html}
    <Prose html={page.html} />
  {/if}
{:else}
  <PageHeader title={fallbackTitle} lead={fallbackLead} />
{/if}
