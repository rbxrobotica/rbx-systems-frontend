<script lang="ts">
  import { t } from '$lib/i18n/translate';
  import { trackEvent, LANDING_OFFER_CTA } from '$lib/analytics/events';
  import LeadForm from './LeadForm.svelte';

  interface Props {
    dictionary: Record<string, unknown>;
    source: string;
    titleKey: string;
    subtitleKey: string;
    descriptionKey: string;
    benefitsKey: string;
    ctaKey: string;
    formTitleKey: string;
    metaTitleKey?: string;
    metaDescriptionKey?: string;
    children?: import('svelte').Snippet;
  }

  let {
    dictionary,
    source,
    titleKey,
    subtitleKey,
    descriptionKey,
    benefitsKey,
    ctaKey,
    formTitleKey,
    metaTitleKey,
    metaDescriptionKey,
    children
  }: Props = $props();

  const tr = (key: string) => t(dictionary, key);

  const benefits = $derived(
    (tr(benefitsKey)
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean) as string[]) ?? []
  );

  function trackCta(location: string) {
    trackEvent(LANDING_OFFER_CTA, { source, location });
  }
</script>

<section class="landing-offer">
  <div class="hero">
    <span class="eyebrow">{tr(subtitleKey)}</span>
    <h1>{tr(titleKey)}</h1>
    <p class="lead">{tr(descriptionKey)}</p>

    {#if benefits.length > 0}
      <ul class="benefits">
        {#each benefits as benefit}
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="check">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {benefit}
          </li>
        {/each}
      </ul>
    {/if}

    {#if children}
      {@render children()}
    {/if}

    <a href="#lead-form" class="rbx-cta cta-primary" onclick={() => trackCta('hero')}>
      {tr(ctaKey)}
    </a>
  </div>

  <div class="form-card" id="lead-form">
    <div class="hairline"></div>
    <div class="corners" aria-hidden="true"></div>
    <div class="form-inner">
      <h2>{tr(formTitleKey)}</h2>
      <LeadForm {dictionary} {source} offer={source} compact={true} />
    </div>
  </div>
</section>

<style>
  .landing-offer {
    display: grid;
    gap: var(--s-8);
    align-items: start;
    padding: var(--s-6) 0 var(--s-9);
  }

  @media (min-width: 1024px) {
    .landing-offer {
      grid-template-columns: 1.2fr 0.8fr;
      gap: var(--s-9);
    }
  }

  .hero {
    display: flex;
    flex-direction: column;
    gap: var(--s-5);
    max-width: var(--prose-w);
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--cyan-brand);
    font-weight: 600;
  }

  .hero h1 {
    font-size: var(--text-3xl);
    font-weight: 400;
    letter-spacing: var(--track-tight);
    line-height: 1.1;
  }

  .lead {
    font-size: var(--text-lg);
    color: var(--fg-2);
    line-height: var(--lead-body);
  }

  .benefits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
  }

  .benefits li {
    display: flex;
    align-items: flex-start;
    gap: var(--s-3);
    color: var(--fg-1);
  }

  .check {
    width: 1.25rem;
    height: 1.25rem;
    color: var(--cyan-brand);
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .cta-primary {
    align-self: flex-start;
    margin-top: var(--s-2);
  }

  .form-card {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-1);
    backdrop-filter: blur(8px);
  }

  .hairline {
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan-brand), transparent);
    opacity: 0.8;
  }

  .corners {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .corners::before,
  .corners::after {
    content: '';
    position: absolute;
    width: 1rem;
    height: 1rem;
    border-color: rgba(0, 255, 255, 0.3);
    border-style: solid;
  }
  .corners::before {
    top: 0;
    left: 0;
    border-width: 1px 0 0 1px;
  }
  .corners::after {
    bottom: 0;
    right: 0;
    border-width: 0 1px 1px 0;
  }

  .form-inner {
    padding: var(--s-6);
    display: flex;
    flex-direction: column;
    gap: var(--s-5);
  }

  .form-inner h2 {
    font-size: var(--text-xl);
    font-weight: 400;
    letter-spacing: var(--track-tight);
  }
</style>
