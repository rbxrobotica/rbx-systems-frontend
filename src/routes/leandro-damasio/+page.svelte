<script lang="ts">
  import ContentPage from '$components/ContentPage.svelte';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const siteUrl = $derived(data.locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  // The Person node itself comes from buildGraph; here the WebPage declares it
  // as its main entity, same treatment as the other team pages.
  const aboutId = $derived(`${siteUrl}/#leandro-damasio`);
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'leandroDamasio.headline')}
  fallbackLead={t(data.locale, 'leandroDamasio.body')}
  locale={data.locale}
  {aboutId}
/>
