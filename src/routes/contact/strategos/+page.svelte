<script lang="ts">
  import Seo from '$components/Seo.svelte';
  import ContactSection from '$components/ContactSection.svelte';
  import { localizedUrl } from '$lib/seo/alternates';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const source = 'strategos-founder-plan';

  const title = $derived(t(data.locale, 'contact.strategos.metaTitle'));
  const description = $derived(t(data.locale, 'contact.strategos.metaDescription'));
  const pageUrl = $derived(localizedUrl(data.locale, '/contact/strategos'));
</script>

<Seo {title} {description} locale={data.locale} canonical={pageUrl} />

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<ContactSection
  {source}
  heading="Request Founder Plan early access"
  body="Tell us about the strategic decisions you need to work through. You choose whether we reply by email or WhatsApp."
/>
