<script lang="ts">
  import Seo from '$components/Seo.svelte';
  import LandingOffer from '$components/LandingOffer.svelte';
  import { buildGraph, softwareApplicationSchema } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const dictionary = $derived((data.page?.meta ?? {}) as Record<string, unknown>);

  const title = $derived(t(dictionary, 'landing.robson.metaTitle'));
  const description = $derived(t(dictionary, 'landing.robson.metaDescription'));
  const pageUrl = $derived(
    data.locale === 'pt-BR' ? 'https://rbx.ia.br/robson' : 'https://rbxsystems.ch/robson'
  );
  const schema = $derived(
    buildGraph(data.locale, pageUrl, title, description, [
      softwareApplicationSchema(data.locale, pageUrl, 'Robson', description, 'BusinessApplication')
    ])
  );
</script>

<Seo {title} {description} locale={data.locale} canonical={pageUrl} {schema} />

<LandingOffer
  {dictionary}
  source="robson"
  titleKey="landing.robson.title"
  subtitleKey="landing.robson.subtitle"
  descriptionKey="landing.robson.description"
  benefitsKey="landing.robson.benefits"
  ctaKey="landing.robson.cta"
  formTitleKey="landing.robson.formTitle"
/>
