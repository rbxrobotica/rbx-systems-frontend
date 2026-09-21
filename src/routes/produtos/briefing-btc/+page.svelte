<script lang="ts">
  import { untrack } from 'svelte';
  import { page as pageStore } from '$app/stores';
  import ContentPage from '$components/ContentPage.svelte';
  import BriefingPlanSummary from '$components/BriefingPlanSummary.svelte';
  import BriefingSubscribeModal from '$components/BriefingSubscribeModal.svelte';
  import { faqPageSchema } from '$lib/seo/schema';
  import { t, tobjects } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let subscribeOpen = $state(untrack(() => data.subscribe.open));

  const siteUrl = $derived(data.locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(`${siteUrl}${$pageStore.url.pathname}`);
  const faqs = $derived(tobjects<{ q: string; a: string }>(data.locale, 'briefing.faq.items'));
  const schemaNodes = $derived(
    faqs.length > 0
      ? [
          faqPageSchema(
            pageUrl,
            faqs.map((faq) => ({ question: faq.q, answer: faq.a }))
          )
        ]
      : []
  );
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'briefing.headline')}
  fallbackLead={t(data.locale, 'briefing.body')}
  locale={data.locale}
  {schemaNodes}
/>

<section class="subscribe">
  <BriefingPlanSummary
    locale={data.locale}
    onopen={() => (subscribeOpen = true)}
    source="briefing-btc-product"
  />
</section>

{#if faqs.length > 0}
  <section class="faq">
    <h2>{t(data.locale, 'briefing.faq.title')}</h2>
    {#each faqs as faq}
      <div class="faq-item">
        <h3>{faq.q}</h3>
        <p>{faq.a}</p>
      </div>
    {/each}
  </section>
{/if}

<BriefingSubscribeModal
  locale={data.locale}
  bind:open={subscribeOpen}
  initialAudience={data.subscribe.audience}
  initialBilling={data.subscribe.billing}
  deepLink={data.subscribe.open}
  source="briefing-btc-product"
/>

<style>
  .subscribe {
    max-width: var(--prose-w);
    margin: var(--s-7) 0 var(--s-8);
  }
  .faq {
    max-width: var(--prose-w);
    margin: 0 0 var(--s-8);
  }
  .faq h2 {
    margin: 0 0 var(--s-4);
  }
  .faq-item {
    padding: var(--s-4) 0;
    border-bottom: 1px solid var(--border);
  }
  .faq-item h3 {
    font-size: var(--text-lg);
    font-weight: 500;
    margin: 0 0 var(--s-2);
  }
  .faq-item p {
    color: var(--fg-2);
    margin: 0;
  }
</style>
