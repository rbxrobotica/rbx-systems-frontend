<script lang="ts">
  import { page as pageStore } from '$app/stores';
  import ContentPage from '$components/ContentPage.svelte';
  import { breadcrumbSchema, serviceSchema } from '$lib/seo/schema';
  import { SITE_ORIGIN } from '$lib/seo/site';
  import { breadcrumbItems, leafTitle } from '$design/nav';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const pageUrl = $derived(`${SITE_ORIGIN}${$pageStore.url.pathname}`);
  const title = $derived(data.page?.title ?? data.slug);
  const description = $derived(data.page?.description ?? data.page?.lead ?? '');
  const schemaNodes = $derived([
    serviceSchema(pageUrl, title, description),
    breadcrumbSchema(
      pageUrl,
      breadcrumbItems(data.locale, $pageStore.url.pathname, leafTitle(data))
    )
  ]);
</script>

<ContentPage
  page={data.page}
  fallbackTitle={data.page?.title ?? data.slug}
  fallbackLead={data.page?.lead ?? ''}
  locale={data.locale}
  {schemaNodes}
/>
