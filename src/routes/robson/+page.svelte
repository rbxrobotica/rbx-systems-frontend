<script lang="ts">
  import Seo from '$components/Seo.svelte';
  import LandingOffer from '$components/LandingOffer.svelte';
  import { localizedUrl } from '$lib/seo/alternates';
  import { buildGraph, softwareApplicationSchema } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const dictionary = $derived((data.page?.meta ?? {}) as Record<string, unknown>);

  const title = $derived(t(dictionary, 'landing.robson.metaTitle'));
  const description = $derived(t(dictionary, 'landing.robson.metaDescription'));
  const pageUrl = $derived(localizedUrl(data.locale, '/robson'));
  // This LP duplicates the /produtos/robson CMS page for campaign traffic;
  // canonical points to the product page (same host) to avoid duplicate content.
  const canonicalUrl = $derived(localizedUrl(data.locale, '/produtos/robson'));
  const schema = $derived(
    buildGraph(data.locale, pageUrl, title, description, [
      softwareApplicationSchema(pageUrl, 'Robson', description, 'BusinessApplication')
    ])
  );
</script>

<Seo {title} {description} locale={data.locale} canonical={canonicalUrl} {schema} />

<LandingOffer
  {dictionary}
  locale={data.locale}
  source="robson"
  titleKey="landing.robson.title"
  subtitleKey="landing.robson.subtitle"
  descriptionKey="landing.robson.description"
  benefitsKey="landing.robson.benefits"
  ctaKey="landing.robson.cta"
  formTitleKey="landing.robson.formTitle"
/>
