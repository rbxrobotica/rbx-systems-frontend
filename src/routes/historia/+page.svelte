<script lang="ts">
  import { page as pageStore } from '$app/stores';
  import ContentPage from '$components/ContentPage.svelte';
  import { breadcrumbSchema } from '$lib/seo/schema';
  import { SITE_ORIGIN } from '$lib/seo/site';
  import { breadcrumbItems, leafTitle } from '$design/nav';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const pageUrl = $derived(`${SITE_ORIGIN}${$pageStore.url.pathname}`);
  const schemaNodes = $derived([
    breadcrumbSchema(
      pageUrl,
      breadcrumbItems(data.locale, $pageStore.url.pathname, leafTitle(data))
    )
  ]);
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'history.fallbackTitle')}
  fallbackLead={t(data.locale, 'history.fallbackLead')}
  locale={data.locale}
  {schemaNodes}
/>
