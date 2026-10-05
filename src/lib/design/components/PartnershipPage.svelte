<script lang="ts">
  import Seo from './Seo.svelte';
  import PartnershipForm from './PartnershipForm.svelte';
  import {
    partnershipContent,
    partnershipTerms,
    formatPartnershipPrice
  } from '$lib/content/partnership';
  import { buildGraph } from '$lib/seo/schema';
  import { trackPartnershipEvent } from '$lib/analytics/partnership';
  import type { Locale } from '$types/content';

  let { locale }: { locale: Locale } = $props();
  const content = $derived(partnershipContent[locale]);
  const price = $derived(formatPartnershipPrice(locale));
  const pageUrl = $derived(
    locale === 'pt-BR' ? 'https://rbx.ia.br/parceria' : 'https://rbxsystems.ch/partnership'
  );
  const schema = $derived(buildGraph(locale, pageUrl, content.title, content.description));

  function observeOffer(node: HTMLElement) {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackPartnershipEvent('offer_view', { locale, surface: 'partnership', entry: 'offer' });
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
</script>

<Seo
  title={content.title}
  description={content.description}
  {locale}
  canonical={pageUrl}
  {schema}
/>

<div class="partnership-page">
  <header class="hero">
    <div class="introduction">
      <p class="eyebrow">{content.eyebrow}</p>
      <h1>{content.headline}</h1>
      <p class="lead">{content.lead}</p>
      <a
        class="portfolio-link"
        href={content.portfolioHref}
        onclick={() =>
          trackPartnershipEvent('cta_click', {
            locale,
            surface: 'partnership',
            entry: 'hero',
            destination: 'portfolio'
          })}>{content.portfolioLabel}</a
      >
    </div>
    <aside class="offer" aria-labelledby="offer-title" use:observeOffer>
      <p id="offer-title" class="eyebrow">{content.priceLabel}</p>
      <p class="price">{price}<span>{content.period}</span></p>
      <p class="currency">{content.currency}</p>
      <p class="capacity"><strong>{partnershipTerms.monthlyHours}</strong> {content.capacity}</p>
      <p class="detail">{content.capacityDetail}</p>
      <a
        class="rbx-cta"
        href="#qualificacao"
        onclick={() =>
          trackPartnershipEvent('cta_click', {
            locale,
            surface: 'partnership',
            entry: 'offer',
            destination: 'qualification'
          })}>{content.cta}</a
      >
      <p class="detail">{content.ctaNote}</p>
      <p class="intake">{content.intake}</p>
    </aside>
  </header>

  <section aria-labelledby="fit-title">
    <div class="section-heading">
      <h2 id="fit-title">{content.fitTitle}</h2>
      <p>{content.fitLead}</p>
    </div>
    <div class="three-columns">
      {#each content.fitCards as card}
        <article>
          <h3>{card.title}</h3>
          <p>{card.description}</p>
        </article>
      {/each}
    </div>
  </section>

  <section aria-labelledby="scope-title">
    <div class="section-heading"><h2 id="scope-title">{content.scopeTitle}</h2></div>
    <div class="scope-grid">
      <div>
        <h3>{content.includedTitle}</h3>
        <ul>
          {#each content.included as item}<li>{item}</li>{/each}
        </ul>
      </div>
      <div>
        <h3>{content.boundariesTitle}</h3>
        <ul>
          {#each content.boundaries as item}<li>{item}</li>{/each}
        </ul>
      </div>
    </div>
    <aside class="sovereignty">
      <h3>{content.sovereigntyTitle}</h3>
      <p>{content.sovereignty}</p>
    </aside>
  </section>

  <section aria-labelledby="process-title">
    <div class="section-heading"><h2 id="process-title">{content.processTitle}</h2></div>
    <ol class="three-columns steps">
      {#each content.steps as step, index}
        <li>
          <span class="eyebrow" aria-hidden="true">0{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </li>
      {/each}
    </ol>
    <p class="process-note">{content.processNote}</p>
  </section>

  <section id="qualificacao" class="qualification" aria-labelledby="qualification-title">
    <div class="section-heading">
      <h2 id="qualification-title">{content.qualificationTitle}</h2>
      <p>{content.qualificationLead}</p>
    </div>
    <PartnershipForm {locale} />
  </section>
</div>

<style>
  .partnership-page {
    padding: var(--s-5) 0;
  }
  .hero {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--s-8);
    align-items: start;
    padding: var(--s-5) 0 var(--s-8);
    border-bottom: 1px solid var(--border);
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--cyan-brand);
  }
  h1 {
    margin: var(--s-5) 0;
    max-width: 18ch;
    font-size: clamp(2.4rem, 4vw, 3.6rem);
    font-weight: 400;
    letter-spacing: -0.045em;
    line-height: 1.12;
    text-wrap: balance;
  }
  .lead {
    font-size: var(--text-lg);
    line-height: var(--lead-loose);
    color: var(--fg-1);
  }
  .portfolio-link {
    display: inline-block;
    margin-top: var(--s-6);
    font-size: var(--text-sm);
  }
  .offer {
    padding: var(--s-6);
    border: 1px solid var(--border-strong);
    border-top: 2px solid var(--cyan-brand);
    border-radius: var(--radius-md);
    background: var(--bg-1);
  }
  .price {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--s-2);
    margin-top: var(--s-4);
    font-size: clamp(2.3rem, 3.5vw, 3.1rem);
    letter-spacing: -0.045em;
    color: var(--fg-0);
  }
  .price span {
    font-size: var(--text-base);
    letter-spacing: normal;
    color: var(--fg-1);
  }
  .currency {
    color: var(--fg-2);
    font-size: var(--text-xs);
    margin: var(--s-1) 0 var(--s-5);
  }
  .capacity {
    color: var(--fg-0);
    margin-bottom: var(--s-2);
  }
  .detail,
  .intake {
    font-size: var(--text-sm);
    color: var(--fg-1);
    line-height: var(--lead-loose);
  }
  .offer .rbx-cta {
    display: block;
    padding: var(--s-3) var(--s-4);
    margin: var(--s-5) 0 var(--s-3);
    text-align: center;
  }
  .intake {
    margin-top: var(--s-5);
    padding-top: var(--s-4);
    border-top: 1px solid var(--border);
  }
  section {
    margin-top: var(--s-8);
  }
  h2 {
    font-size: clamp(1.6rem, 3vw, 2rem);
    font-weight: 400;
    letter-spacing: var(--track-tight);
    line-height: var(--lead-snug);
  }
  .section-heading {
    max-width: 45rem;
    margin-bottom: var(--s-6);
  }
  .section-heading p {
    margin-top: var(--s-3);
    color: var(--fg-1);
    line-height: var(--lead-loose);
  }
  .three-columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--s-6);
  }
  article {
    border-top: 1px solid var(--border-strong);
    padding-top: var(--s-5);
  }
  h3 {
    font-size: var(--text-lg);
    font-weight: 500;
    line-height: var(--lead-snug);
  }
  article p,
  .steps p,
  .sovereignty p {
    color: var(--fg-1);
    margin-top: var(--s-3);
    line-height: var(--lead-loose);
  }
  .scope-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s-7);
  }
  ul {
    padding-left: var(--s-5);
    margin: var(--s-4) 0 0;
    color: var(--fg-1);
  }
  ul li + li {
    margin-top: var(--s-3);
  }
  .sovereignty {
    margin-top: var(--s-6);
    padding: var(--s-5);
    background: var(--bg-1);
    border-left: 2px solid var(--cyan-dim);
  }
  .steps {
    padding: 0;
    list-style: none;
  }
  .steps h3 {
    margin-top: var(--s-4);
  }
  .process-note {
    max-width: 56rem;
    margin-top: var(--s-5);
    font-size: var(--text-sm);
    color: var(--fg-2);
  }
  .qualification {
    max-width: 52rem;
    scroll-margin-top: calc(var(--header-h) + var(--s-6));
    padding-top: var(--s-7);
    border-top: 1px solid var(--border);
  }
  @media (max-width: 850px) {
    .hero {
      grid-template-columns: 1fr;
      gap: var(--s-6);
    }
    h1 {
      max-width: 23ch;
    }
  }
  @media (max-width: 600px) {
    .partnership-page {
      padding-top: 0;
    }
    .three-columns,
    .scope-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .offer {
      padding: var(--s-5);
    }
  }
</style>
