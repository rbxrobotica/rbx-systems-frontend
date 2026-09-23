<script lang="ts">
  import { page as pageStore } from '$app/stores';
  import ContentPage from '$components/ContentPage.svelte';
  import { breadcrumbSchema } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const siteUrl = $derived(data.locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(`${siteUrl}${$pageStore.url.pathname}`);
  const title = $derived(data.page?.title ?? t(data.locale, 'careers.fallbackTitle'));
  const schemaNodes = $derived([
    breadcrumbSchema(data.locale, pageUrl, [
      { name: t(data.locale, 'nav.home'), path: '/' },
      { name: title, path: $pageStore.url.pathname }
    ])
  ]);
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'careers.fallbackTitle')}
  fallbackLead={t(data.locale, 'careers.fallbackLead')}
  locale={data.locale}
  {schemaNodes}
/>
