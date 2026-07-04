<script lang="ts">
  import Seo from '$components/Seo.svelte';
  import ContactSection from '$components/ContactSection.svelte';
  import { buildGraph } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const title = $derived(t(data.locale, 'contact.metaTitle'));
  const description = $derived(t(data.locale, 'contact.metaDescription'));
  const pageUrl = $derived(
    data.locale === 'pt-BR' ? 'https://rbx.ia.br/contato' : 'https://rbxsystems.ch/contato'
  );
  const schema = $derived(buildGraph(data.locale, pageUrl, title, description));
</script>

<Seo {title} {description} locale={data.locale} canonical={pageUrl} {schema} />

<ContactSection />
