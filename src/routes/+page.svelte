<script lang="ts">
  import { _ } from 'svelte-i18n';
  import PageHeader from '$components/PageHeader.svelte';
  import Prose from '$components/Prose.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{$_('home.metaTitle')}</title>
  <meta name="description" content={$_('home.metaDescription')} />
</svelte:head>

{#if data.page}
  <PageHeader
    eyebrow={data.page.eyebrow}
    title={data.page.title || $_('home.headline')}
    lead={data.page.lead || $_('home.body')}
    body={data.page.body}
  />
  {#if data.page.html}
    <Prose html={data.page.html} />
  {/if}
{:else}
  <PageHeader title={$_('home.headline')} lead={$_('home.body')} />
  <p class="rbx-caption">{$_('common.comingSoon')}</p>
{/if}

<div class="actions">
  <a href="/solucoes" class="rbx-cta">{$_('home.ctaServices')}</a>
  <a href="/produtos" class="rbx-cta">{$_('home.ctaProducts')}</a>
</div>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-3);
    margin-top: var(--s-6);
  }
</style>
