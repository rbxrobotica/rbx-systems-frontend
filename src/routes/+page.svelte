<script lang="ts">
  import PageHeader from '$components/PageHeader.svelte';
  import Prose from '$components/Prose.svelte';
  import Seo from '$components/Seo.svelte';
  import { buildGraph } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const title = $derived(data.page?.title || t(data.locale, 'home.metaTitle'));
  const description = $derived(data.page?.description || t(data.locale, 'home.metaDescription'));
  const pageUrl = $derived(
    data.locale === 'pt-BR' ? 'https://rbx.ia.br/' : 'https://rbxsystems.ch/'
  );
  const schema = $derived(buildGraph(data.locale, pageUrl, title, description));
</script>

<Seo {title} {description} locale={data.locale} {schema} />

{#if data.page}
  <PageHeader
    eyebrow={data.page.eyebrow}
    title={data.page.title || t(data.locale, 'home.headline')}
    lead={data.page.lead || t(data.locale, 'home.body')}
    body={data.page.body}
  />
{:else}
  <PageHeader title={t(data.locale, 'home.headline')} lead={t(data.locale, 'home.body')} />
  <p class="rbx-caption">{t(data.locale, 'common.comingSoon')}</p>
{/if}

<div class="actions">
  <a href={data.locale === 'pt-BR' ? '/parceria' : '/partnership'} class="rbx-cta">
    {t(data.locale, 'home.ctaPartnership')}
  </a>
  <a href={data.locale === 'pt-BR' ? '/produtos' : '/products'} class="rbx-cta">
    {t(data.locale, 'home.ctaProducts')}
  </a>
</div>

{#if data.page?.html}
  <div class="home-copy"><Prose html={data.page.html} /></div>
  <div class="actions actions--final">
    <a href={data.locale === 'pt-BR' ? '/parceria' : '/partnership'} class="rbx-cta">
      {t(data.locale, 'home.ctaPartnership')}
    </a>
  </div>
{/if}

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-3);
    margin-bottom: var(--s-8);
  }
  .home-copy {
    max-width: var(--content-w);
  }
  .actions--final {
    margin-top: var(--s-6);
    margin-bottom: 0;
  }
  .home-copy :global(p) {
    max-width: var(--prose-w);
  }
  .home-copy :global(ul) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s-4);
    padding: 0;
  }
  .home-copy :global(li) {
    padding: var(--s-5);
    margin: 0;
    list-style-position: inside;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-1);
  }
  @media (max-width: 600px) {
    .home-copy :global(ul) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
