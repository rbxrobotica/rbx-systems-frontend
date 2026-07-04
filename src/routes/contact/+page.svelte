<script lang="ts">
  import { _ } from 'svelte-i18n';
  import Seo from '$components/Seo.svelte';
  import ContactSection from '$components/ContactSection.svelte';
  import { buildGraph } from '$lib/seo/schema';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const title = $_('contact.metaTitle');
  const description = $_('contact.metaDescription');
  const pageUrl = $derived(
    data.locale === 'pt-BR' ? 'https://rbx.ia.br/contact' : 'https://rbxsystems.ch/contact'
  );
  const schema = $derived(buildGraph(data.locale, pageUrl, title, description));
</script>

<Seo {title} {description} locale={data.locale} canonical={pageUrl} {schema} />

<ContactSection />
