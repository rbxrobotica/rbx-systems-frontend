<script lang="ts">
  import PageHeader from '$components/PageHeader.svelte';
  import Prose from '$components/Prose.svelte';
  import ContactSection from '$components/ContactSection.svelte';
  import Seo from '$components/Seo.svelte';
  import { buildGraph } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const title = $derived(t(data.locale, 'home.metaTitle'));
  const description = $derived(t(data.locale, 'home.metaDescription'));
  const pageUrl = $derived(data.locale === 'pt-BR' ? 'https://rbx.ia.br/' : 'https://rbxsystems.ch/');
  const schema = $derived(buildGraph(data.locale, pageUrl, title, description));
</script>

<Seo title={title} description={description} locale={data.locale} {schema} />

{#if data.page}
  <PageHeader
    eyebrow={data.page.eyebrow}
    title={data.page.title || t(data.locale, 'home.headline')}
    lead={data.page.lead || t(data.locale, 'home.body')}
    body={data.page.body}
  />
  {#if data.page.html}
    <Prose html={data.page.html} />
  {/if}
{:else}
  <PageHeader title={t(data.locale, 'home.headline')} lead={t(data.locale, 'home.body')} />
  <p class="rbx-caption">{t(data.locale, 'common.comingSoon')}</p>
{/if}

<div class="actions">
  <a href="/solucoes" class="rbx-cta">{t(data.locale, 'home.ctaServices')}</a>
  <a href="/produtos" class="rbx-cta">{t(data.locale, 'home.ctaProducts')}</a>
</div>

<ContactSection />

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-3);
    margin-top: var(--s-6);
  }
</style>
