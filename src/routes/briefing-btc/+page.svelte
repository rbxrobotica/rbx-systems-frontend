<script lang="ts">
  import Seo from '$components/Seo.svelte';
  import LandingOffer from '$components/LandingOffer.svelte';
  import CheckoutForm from '$components/CheckoutForm.svelte';
  import { buildGraph, websiteSchema } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const dictionary = $derived((data.page?.meta ?? {}) as Record<string, unknown>);

  const title = $derived(t(dictionary, 'landing.briefingBtc.metaTitle'));
  const description = $derived(t(dictionary, 'landing.briefingBtc.metaDescription'));
  const pageUrl = $derived(
    data.locale === 'pt-BR'
      ? 'https://rbx.ia.br/briefing-btc'
      : 'https://rbxsystems.ch/briefing-btc'
  );
  const schema = $derived(
    buildGraph(data.locale, pageUrl, title, description, [websiteSchema(data.locale)])
  );
</script>

<Seo {title} {description} locale={data.locale} canonical={pageUrl} {schema} />

<LandingOffer
  {dictionary}
  source="briefing-btc"
  titleKey="landing.briefingBtc.title"
  subtitleKey="landing.briefingBtc.subtitle"
  descriptionKey="landing.briefingBtc.description"
  benefitsKey="landing.briefingBtc.benefits"
  ctaKey="landing.briefingBtc.cta"
  formTitleKey="landing.briefingBtc.formTitle"
>
  {#snippet checkout()}
    <CheckoutForm locale={data.locale} />
    <p class="or-divider">
      {data.locale === 'pt-BR' ? 'ou fale com a gente antes' : 'or talk to us first'}
    </p>
  {/snippet}
</LandingOffer>

<style>
  .or-divider {
    text-align: center;
    font-size: var(--text-xs);
    color: var(--fg-3);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    padding: var(--s-4) 0 0;
  }
</style>
