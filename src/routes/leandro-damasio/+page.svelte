<script lang="ts">
  import ContentPage from '$components/ContentPage.svelte';
  import { SITE_ORIGIN } from '$lib/seo/site';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // The Person node itself comes from buildGraph; here the WebPage declares it
  // as its main entity, same treatment as the other team pages.
  const aboutId = $derived(`${SITE_ORIGIN}/#leandro-damasio`);
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'leandroDamasio.headline')}
  fallbackLead={t(data.locale, 'leandroDamasio.body')}
  locale={data.locale}
  {aboutId}
/>
