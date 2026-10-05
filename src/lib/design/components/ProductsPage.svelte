<script lang="ts">
  import { page } from '$app/stores';
  import Seo from './Seo.svelte';
  import { productsContent } from '$lib/content/products';
  import { buildGraph, collectionPageSchema } from '$lib/seo/schema';
  import type { Locale } from '$types/content';

  let { locale }: { locale: Locale } = $props();

  const content = $derived(productsContent[locale]);
  const siteUrl = $derived(locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(`${siteUrl}${$page.url.pathname}`);
  const schema = $derived(
    buildGraph(locale, pageUrl, content.title, content.description, [
      collectionPageSchema(
        locale,
        pageUrl,
        content.title,
        content.description,
        [...content.products, ...content.additionalProducts].map((product) => ({
          name: product.name,
          url: `${pageUrl}#${product.id}`
        }))
      )
    ])
  );
</script>

<Seo
  title={content.title}
  description={content.description}
  {locale}
  canonical={pageUrl}
  {schema}
/>

<div class="products-page">
  <header class="portfolio-header">
    <p class="eyebrow">{content.eyebrow}</p>
    <h1>{content.headline}</h1>
    <p class="hero-lead">{content.lead}</p>
    <ul class="disciplines">
      {#each content.disciplines as discipline}<li>{discipline}</li>{/each}
    </ul>
  </header>

  <section aria-labelledby="featured-title">
    <div class="section-heading">
      <h2 id="featured-title">{content.featuredTitle}</h2>
      <p>{content.featuredLead}</p>
    </div>
    <div class="product-grid">
      {#each content.products as product, index}
        <article id={product.id} class="product-card">
          <div class="card-heading">
            <p class="eyebrow">{product.category}</p>
            <span class="index" aria-hidden="true">0{index + 1}</span>
          </div>
          <h3>{product.name}</h3>
          <p class="product-context">{product.context}</p>
          <p class="product-description">{product.description}</p>
          <ul class="capabilities">
            {#each product.capabilities as capability}<li>{capability}</li>{/each}
          </ul>
          {#if product.note}<p class="product-note">{product.note}</p>{/if}
          {#if product.href}
            <div class="product-links">
              <a href={product.href}>{product.linkLabel}</a>
              {#each product.secondaryLinks ?? [] as link}
                <a href={link.href}>{link.label}</a>
              {/each}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </section>

  <section class="external-reference" aria-labelledby="external-title">
    <div>
      <p class="eyebrow">{content.externalTitle}</p>
      <h2 id="external-title">{content.externalReference.name}</h2>
    </div>
    <div>
      <p>{content.externalReference.description}</p>
      {#if content.externalReference.href}
        <a href={content.externalReference.href}>{content.externalReference.linkLabel}</a>
      {/if}
    </div>
  </section>

  <section aria-labelledby="additional-title">
    <div class="section-heading">
      <h2 id="additional-title">{content.additionalTitle}</h2>
      <p>{content.additionalLead}</p>
    </div>
    <div class="additional-grid">
      {#each content.additionalProducts as product}
        <article id={product.id}>
          <h3>{product.name}</h3>
          <p class="product-context">{product.context}</p>
          <p>{product.description}</p>
          {#if product.href}<a href={product.href}>{product.linkLabel}</a>{/if}
        </article>
      {/each}
    </div>
  </section>

  <section class="platform" aria-labelledby="platform-title">
    <div class="section-heading">
      <p class="eyebrow">{content.platformEyebrow}</p>
      <h2 id="platform-title">{content.platformTitle}</h2>
      <p>{content.platformLead}</p>
    </div>
    <ol class="platform-layers">
      {#each content.layers as layer, index}
        <li>
          <span class="layer-number" aria-hidden="true">0{index + 1}</span>
          <h3>{layer.title}</h3>
          <p>{layer.description}</p>
          <span class="layer-components">{layer.components}</span>
        </li>
      {/each}
    </ol>
    <div class="foundation">
      <span class="eyebrow">{content.foundationLabel}</span>
      <p>{content.foundation}</p>
    </div>
    <div class="sovereignty">
      <div class="section-heading">
        <h3>{content.sovereigntyTitle}</h3>
        <p>{content.sovereigntyLead}</p>
      </div>
      <dl class="principles">
        {#each content.principles as principle}
          <div>
            <dt>{principle.title}</dt>
            <dd>{principle.description}</dd>
          </div>
        {/each}
      </dl>
    </div>
    <div class="evolution">
      <div class="section-heading">
        <h3>{content.evolutionTitle}</h3>
        <p>{content.evolutionLead}</p>
      </div>
      <div class="evolution-grid">
        {#each content.evolutionCards as capability}
          <article>
            <h4>{capability.title}</h4>
            <p>{capability.description}</p>
          </article>
        {/each}
      </div>
      <p class="evolution-note">{content.evolutionNote}</p>
    </div>
  </section>

  <section aria-labelledby="references-title">
    <div class="section-heading">
      <h2 id="references-title">{content.referencesTitle}</h2>
      <p>{content.referencesLead}</p>
    </div>
    <div class="reference-grid">
      {#each content.references as reference}
        <article class="reference">
          <p class="eyebrow">{reference.name}</p>
          <h3>{reference.title}</h3>
          <p>{reference.description}</p>
          {#if reference.href}<a href={reference.href}>{reference.label}</a>{/if}
        </article>
      {/each}
    </div>
  </section>

  <section class="collaboration" aria-labelledby="collaboration-title">
    <div>
      <h2 id="collaboration-title">{content.collaborationTitle}</h2>
      <p>{content.collaborationLead}</p>
    </div>
    <a class="rbx-cta" href={content.contactHref}>{content.contactLabel}</a>
  </section>

  <aside class="portfolio-notes" aria-label={content.legalLabel}>
    <p><strong>Satwake / Briefing BTC.</strong> {content.financialNote}</p>
    <a href="/legal">{content.legalLabel}</a>
  </aside>
</div>

<style>
  .products-page {
    padding-top: var(--s-5);
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.1em;
    line-height: var(--lead-body);
    text-transform: uppercase;
    color: var(--cyan-brand);
  }
  .portfolio-header {
    padding: var(--s-5) 0 var(--s-8);
    border-bottom: 1px solid var(--border);
  }
  h1 {
    max-width: 18ch;
    margin: var(--s-5) 0;
    font-size: clamp(2.5rem, 5.3vw, 4.25rem);
    font-weight: 400;
    letter-spacing: -0.045em;
    line-height: 1.08;
    text-wrap: balance;
  }
  .hero-lead {
    max-width: 44rem;
    color: var(--fg-1);
    font-size: var(--text-lg);
    line-height: var(--lead-loose);
  }
  .disciplines,
  .capabilities {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2) var(--s-3);
    padding: 0;
    list-style: none;
  }
  .disciplines {
    margin: var(--s-6) 0 0;
    gap: var(--s-3) var(--s-6);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--fg-1);
  }
  .disciplines li::before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    margin-right: var(--s-3);
    background: var(--cyan-brand);
    vertical-align: middle;
  }
  section {
    margin-top: var(--s-8);
  }
  .section-heading {
    max-width: 46rem;
    margin-bottom: var(--s-6);
  }
  h2 {
    font-size: clamp(1.6rem, 3vw, 2rem);
    font-weight: 400;
    letter-spacing: var(--track-tight);
    line-height: var(--lead-snug);
    text-wrap: balance;
  }
  .section-heading p:not(.eyebrow),
  .collaboration p {
    margin-top: var(--s-3);
    color: var(--fg-1);
    line-height: var(--lead-loose);
  }
  .section-heading > .eyebrow {
    margin-bottom: var(--s-4);
  }
  .product-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s-4);
  }
  .product-card {
    display: flex;
    flex-direction: column;
    padding: var(--s-5);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-1);
    scroll-margin-top: calc(var(--header-h) + var(--s-6));
  }
  .card-heading {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: var(--s-3);
  }
  .index {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--fg-2);
  }
  .product-card h3 {
    margin-top: var(--s-5);
    font-size: var(--text-2xl);
    font-weight: 500;
    letter-spacing: var(--track-tight);
  }
  .product-context {
    margin: var(--s-1) 0 var(--s-4);
    font-size: var(--text-sm);
    color: var(--fg-1);
  }
  .product-description {
    color: var(--fg-1);
  }
  .capabilities {
    margin: var(--s-5) 0;
    font-size: var(--text-xs);
    color: var(--fg-1);
  }
  .capabilities li {
    padding: var(--s-1) var(--s-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  .product-note {
    margin-bottom: var(--s-5);
    color: var(--fg-1);
    font-size: var(--text-sm);
    line-height: var(--lead-body);
  }
  .product-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-3) var(--s-5);
    margin-top: auto;
    font-size: var(--text-sm);
    padding: var(--s-1) 0;
  }

  .external-reference {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--s-5);
    margin-top: var(--s-5);
    padding: var(--s-5);
    border-left: 2px solid var(--border-strong);
    background: var(--bg-1);
  }

  .external-reference h2 {
    margin-top: var(--s-3);
    font-size: var(--text-2xl);
  }

  .external-reference p:not(.eyebrow),
  .additional-grid p {
    color: var(--fg-1);
  }

  .external-reference a,
  .additional-grid a {
    display: inline-block;
    margin-top: var(--s-4);
    font-size: var(--text-sm);
  }

  .additional-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--s-6);
  }

  .additional-grid article {
    border-top: 1px solid var(--border);
    padding-top: var(--s-4);
    scroll-margin-top: calc(var(--header-h) + var(--s-6));
  }

  .additional-grid h3 {
    font-size: var(--text-lg);
    font-weight: 500;
  }
  .platform {
    padding: var(--s-7);
    border: 1px solid var(--border-strong);
    border-top: 2px solid var(--cyan-brand);
    border-radius: var(--radius-md);
    background: var(--bg-1);
  }
  .platform-layers {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1px;
    padding: 0;
    margin: 0;
    border: 1px solid var(--border);
    background: var(--border);
    list-style: none;
  }
  .platform-layers li {
    display: flex;
    flex-direction: column;
    padding: var(--s-5);
    background: var(--bg-0);
  }
  .layer-number {
    margin-bottom: var(--s-5);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--cyan-brand);
  }
  .platform h3,
  .reference h3 {
    font-size: var(--text-lg);
    font-weight: 500;
    line-height: var(--lead-snug);
  }
  .platform-layers p {
    margin: var(--s-3) 0 var(--s-5);
    color: var(--fg-1);
    font-size: var(--text-sm);
  }
  .layer-components {
    margin-top: auto;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--fg-1);
  }
  .foundation {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--s-3);
    padding: var(--s-4) var(--s-5);
    border: 1px solid var(--cyan-dim);
    border-top: 0;
    background: var(--cyan-subtle);
  }
  .foundation p {
    font-size: var(--text-sm);
    color: var(--fg-1);
  }
  .sovereignty {
    margin-top: var(--s-7);
  }

  .evolution {
    margin-top: var(--s-7);
    padding-top: var(--s-6);
    border-top: 1px solid var(--border-strong);
  }

  .evolution-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--s-5);
  }

  .evolution-grid h4 {
    font-size: var(--text-base);
    font-weight: 500;
    margin-bottom: var(--s-3);
  }

  .evolution-grid p,
  .evolution-note {
    color: var(--fg-1);
    font-size: var(--text-sm);
    line-height: var(--lead-loose);
  }

  .evolution-note {
    margin-top: var(--s-5);
  }
  .principles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--s-5);
    margin: 0;
  }
  dt {
    margin-bottom: var(--s-2);
    font-weight: 500;
  }
  dd {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--fg-1);
    line-height: var(--lead-loose);
  }
  .reference-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--s-7);
  }
  .reference {
    padding-top: var(--s-5);
    border-top: 1px solid var(--border-strong);
  }
  .reference h3 {
    margin: var(--s-4) 0 var(--s-3);
  }
  .reference > p:not(.eyebrow) {
    margin-bottom: var(--s-5);
    color: var(--fg-1);
  }
  .reference a {
    font-size: var(--text-sm);
  }
  .collaboration {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--s-6);
    padding: var(--s-7) 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .collaboration > div {
    max-width: 40rem;
  }
  .collaboration h2 {
    font-size: var(--text-2xl);
  }
  .collaboration a {
    padding: var(--s-4);
    text-align: center;
  }
  .portfolio-notes {
    max-width: 56rem;
    margin-top: var(--s-6);
    font-size: var(--text-sm);
    color: var(--fg-1);
    line-height: var(--lead-loose);
  }
  .portfolio-notes p {
    margin-bottom: var(--s-3);
  }
  @media (max-width: 900px) {
    .product-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .platform {
      padding: var(--s-5);
    }
  }
  @media (max-width: 600px) {
    h1 {
      font-size: 2.25rem;
      max-width: 100%;
    }

    .products-page {
      padding-top: 0;
    }
    .portfolio-header {
      padding-top: var(--s-3);
    }
    .product-grid,
    .external-reference,
    .additional-grid,
    .platform-layers,
    .principles,
    .evolution-grid,
    .reference-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .platform {
      padding: var(--s-5) var(--s-4);
    }
    .foundation {
      padding: var(--s-4);
    }
  }
</style>
