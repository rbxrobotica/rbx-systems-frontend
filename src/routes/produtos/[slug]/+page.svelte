<script lang="ts">
  import { page as pageStore } from '$app/stores';
  import ContentPage from '$components/ContentPage.svelte';
  import { breadcrumbSchema } from '$lib/seo/schema';
  import { breadcrumbItems, leafTitle } from '$design/nav';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const siteUrl = $derived(data.locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(`${siteUrl}${$pageStore.url.pathname}`);
  const schemaNodes = $derived([
    breadcrumbSchema(
      data.locale,
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
