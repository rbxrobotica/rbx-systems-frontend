<script lang="ts">
  import { t } from '$lib/i18n/translate';
  import { trackEvent, LANDING_OFFER_CTA } from '$lib/analytics/events';
  import {
    currencyForLocale,
    findPlan,
    formatAmount,
    perMonthAmount
  } from '$lib/briefing/catalog.js';
  import type { Locale } from '$types/content';

  interface Props {
    locale: Locale;
    /** Called when the visitor asks to see the plans; the parent opens the modal. */
    onopen: () => void;
    source?: string;
  }

  let { locale, onopen, source = 'briefing-btc' }: Props = $props();

  const tr = (key: string) => t(locale, `briefing.subscribe.${key}`);
  const currency = $derived(currencyForLocale(locale));
  const proAnnual = $derived(findPlan('individual', 'annual', currency));
  const freePrice = $derived(formatAmount(0, currency, locale, { alwaysDecimals: true }));
  const proFrom = $derived(formatAmount(perMonthAmount(proAnnual), currency, locale));

  function open() {
    trackEvent(LANDING_OFFER_CTA, { source, location: 'plan-summary' });
    onopen();
  }
</script>

<div class="plans">
  <div class="hairline"></div>
  <span class="eyebrow">{tr('summary.eyebrow')}</span>
  <h3>{tr('summary.title')}</h3>
  <p class="body">{tr('summary.body')}</p>
  <dl class="rows">
    <div>
      <dt>{tr('summary.freeLabel')}</dt>
      <dd>{freePrice} <span class="from">{tr('summary.freeNote')}</span></dd>
    </div>
    <div>
      <dt>{tr('summary.proLabel')}</dt>
      <dd><span class="from">{tr('summary.from')}</span> {proFrom}{tr('summary.perMonth')}</dd>
    </div>
  </dl>
  <button type="button" class="rbx-cta" onclick={open}>{tr('summary.cta')}</button>
</div>

<style>
  .plans {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
    padding: var(--s-6);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-1);
  }

  .hairline {
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent-line), transparent);
    opacity: 0.8;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--accent-text);
    font-weight: 600;
  }

  h3 {
    font-size: var(--text-xl);
    font-weight: 400;
    letter-spacing: var(--track-tight);
  }

  .body {
    font-size: var(--text-sm);
    color: var(--fg-2);
  }

  .rows {
    margin: 0;
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--border);
  }

  .rows > div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--s-3);
    padding: var(--s-2) 0;
    border-bottom: 1px solid var(--border);
    font-size: var(--text-sm);
  }

  dt {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--fg-2);
  }

  dd {
    margin: 0;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--fg-0);
  }

  .from {
    color: var(--fg-2);
    font-family: var(--font-sans);
  }

  .rbx-cta {
    align-self: flex-start;
    margin-top: var(--s-2);
    cursor: pointer;
  }
</style>
