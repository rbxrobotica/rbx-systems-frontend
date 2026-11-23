<script lang="ts">
  import PageHeader from '$components/PageHeader.svelte';
  import Prose from '$components/Prose.svelte';
  import Seo from '$components/Seo.svelte';
  import { productsContent } from '$lib/content/products';
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

  // The home is a product page first: the portfolio comes from the typed catalog,
  // not from the CMS, so it renders when the content store is slow or down.
  const catalog = $derived(productsContent[data.locale]);
  const featured = $derived(catalog.products[0]);
  const others = $derived(catalog.products.slice(1));
  const productsHref = $derived(data.locale === 'pt-BR' ? '/produtos' : '/products');
  const partnershipHref = $derived(data.locale === 'pt-BR' ? '/parceria' : '/partnership');
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
{/if}

<div class="actions">
  <a href={productsHref} class="rbx-cta">{t(data.locale, 'home.ctaProducts')}</a>
  <a href="{productsHref}#{featured.id}" class="quiet-link">
    {t(data.locale, 'home.ctaStrategos')}
  </a>
</div>

<section class="featured" aria-labelledby="featured-name">
  <div class="featured-heading">
    <p class="rbx-eyebrow accent">{t(data.locale, 'home.featuredEyebrow')}</p>
    <h2 id="featured-name">{featured.name}</h2>
    <p class="meta">{featured.category} · {featured.context}</p>
  </div>
  <div class="featured-body">
    <p>{featured.description}</p>
    <ul class="capabilities">
      {#each featured.capabilities as capability}<li>{capability}</li>{/each}
    </ul>
    {#if featured.href}<a href={featured.href}>{featured.linkLabel}</a>{/if}
  </div>
</section>

<section aria-labelledby="home-products">
  <h2 id="home-products" class="section-title">{t(data.locale, 'home.productsTitle')}</h2>
  <div class="grid">
    {#each others as product (product.id)}
      <article class="card">
        <p class="rbx-eyebrow accent">{product.category}</p>
        <h3>{product.name}</h3>
        <p class="meta">{product.context}</p>
        <p class="card-text">{product.description}</p>
        {#if product.href}<a href={product.href}>{product.linkLabel}</a>{/if}
      </article>
    {/each}
  </div>
</section>

<section aria-labelledby="home-platform">
  <h2 id="home-platform" class="section-title">{t(data.locale, 'home.platformTitle')}</h2>
  <p class="section-lead">{catalog.additionalLead}</p>
  <div class="grid">
    {#each catalog.additionalProducts as product (product.id)}
      <article class="card card--plain">
        <h3>{product.name}</h3>
        <p class="meta">{product.context}</p>
        <p class="card-text">{product.description}</p>
      </article>
    {/each}
  </div>
  <p class="all-products"><a href={productsHref}>{t(data.locale, 'home.allProducts')}</a></p>
</section>

{#if data.page?.html}
  <div class="home-copy"><Prose html={data.page.html} /></div>
  <p class="partnership-link">
    <a href={partnershipHref}>{t(data.locale, 'home.ctaPartnership')}</a>
  </p>
{/if}

<style>
  .actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--s-4);
    margin-bottom: var(--s-8);
  }
  .quiet-link,
  .all-products,
  .partnership-link {
    font-size: var(--text-sm);
  }
  section {
    margin-bottom: var(--s-8);
  }
  .accent {
    color: var(--accent-text, var(--cta));
  }
  .meta {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--track-wide);
    color: var(--fg-2);
  }
  .featured {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    gap: var(--s-6);
    padding: var(--s-6);
    border: 1px solid var(--border);
    border-top: 2px solid var(--accent-line, var(--cta));
    border-radius: var(--radius-md);
    background: var(--bg-1);
  }
  .featured-heading {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }
  .featured h2 {
    font-size: var(--text-3xl);
    font-weight: 300;
    line-height: var(--lead-tight);
    letter-spacing: var(--track-tight);
  }
  .featured-body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--s-4);
  }
  .featured-body > p {
    font-size: var(--text-lg);
    font-weight: 300;
    color: var(--fg-0);
    max-width: var(--prose-w);
  }
  .capabilities {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2) var(--s-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--track-wide);
    color: var(--fg-1);
  }
  .section-title {
    font-size: var(--text-2xl);
    font-weight: 400;
    margin-bottom: var(--s-4);
  }
  .section-lead {
    color: var(--fg-1);
    max-width: var(--prose-w);
    margin-bottom: var(--s-4);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s-4);
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--s-2);
    padding: var(--s-5);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-1);
  }
  .card--plain {
    background: none;
  }
  .card h3 {
    font-size: var(--text-xl);
    font-weight: 500;
  }
  .card-text {
    color: var(--fg-1);
    margin-bottom: var(--s-2);
  }
  .all-products {
    margin-top: var(--s-4);
  }
  .home-copy {
    max-width: var(--content-w);
  }
  .home-copy :global(p) {
    max-width: var(--prose-w);
  }
  .partnership-link {
    margin-top: var(--s-5);
  }
  @media (max-width: 767px) {
    .featured {
      grid-template-columns: minmax(0, 1fr);
      padding: var(--s-5);
    }
  }
  @media (max-width: 600px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
