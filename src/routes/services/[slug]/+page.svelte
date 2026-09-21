<script lang="ts">
  import { page as pageStore } from '$app/stores';
  import ContentPage from '$components/ContentPage.svelte';
  import { breadcrumbSchema, serviceSchema } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const siteUrl = $derived(data.locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(`${siteUrl}${$pageStore.url.pathname}`);
  const title = $derived(data.page?.title ?? data.slug);
  const description = $derived(data.page?.description ?? data.page?.lead ?? '');
  const solutionsPath = $derived(data.locale === 'pt-BR' ? '/solucoes' : '/solutions');
  const schemaNodes = $derived([
    serviceSchema(data.locale, pageUrl, title, description),
    breadcrumbSchema(data.locale, pageUrl, [
      { name: t(data.locale, 'nav.home'), path: '/' },
      { name: t(data.locale, 'nav.solutions'), path: solutionsPath },
      { name: title, path: $pageStore.url.pathname }
    ])
  ]);
</script>

<ContentPage
  page={data.page}
  fallbackTitle={data.page?.title ?? data.slug}
  fallbackLead={data.page?.lead ?? ''}
  locale={data.locale}
  {schemaNodes}
/>
